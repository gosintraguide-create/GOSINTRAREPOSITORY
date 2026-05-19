#!/usr/bin/env node
/**
 * retranslate.mjs
 * ---------------
 * Retranslates all (or selected) locale files using Claude.
 *
 * Usage:
 *   node scripts/retranslate.mjs                       # all 6 languages
 *   node scripts/retranslate.mjs --lang nl,fr           # specific languages
 *   node scripts/retranslate.mjs --lang nl --new-only   # only missing/untranslated keys
 *
 * Requires:
 *   ANTHROPIC_API_KEY environment variable
 *   @anthropic-ai/sdk  →  npm install @anthropic-ai/sdk
 *
 * Run whenever you add new keys to en.json:
 *   node scripts/retranslate.mjs --new-only
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, "../src/app/lib/translations/locales");

// ── Config ──────────────────────────────────────────────────────────────────
const ALL_LANGUAGES = ["pt", "es", "fr", "de", "nl", "it"];

const LANGUAGE_HINTS = {
  nl: "Use everyday Dutch as spoken in the Netherlands. Never invent or combine words that do not exist in Dutch. When in doubt, use the simpler common word. Avoid anglicisms unless they are genuinely accepted in Dutch (e.g. 'ticket', 'tour'). Informal but polite tone.",
  fr: "Use natural French as spoken in France. Use the 'vous' form but keep it warm and approachable, not stiff. Avoid overly formal constructions. Short UI labels should be punchy, not literal word-for-word translations of English.",
  de: "Use natural German as spoken in Germany. Use the formal 'Sie' register but keep a friendly, enthusiastic tone. Keep UI labels short — German compound words can be long, so prefer concise phrasing. Never invent compound words.",
  it: "Use natural Italian as spoken in Central/Northern Italy. Check all gender and number agreements carefully. Keep the tone enthusiastic and welcoming. Short UI labels should feel natural, not translated.",
  es: "Use neutral Spanish (no regional slang or local expressions). Ensure all question and exclamation marks are doubled (¿ and ¡). Check all accents. Warm, friendly tone.",
  pt: "Use European Portuguese as spoken in Portugal (NOT Brazilian Portuguese). Use the formal 'você' form but keep it warm. Check all accents. The tone should feel like a knowledgeable Lisbon local recommending something they love.",
};

const SYSTEM_PROMPT = `You are a professional travel and tourism translator with native fluency.
You are translating UI strings and content for "Go Sintra" — a hop-on/hop-off tour company in Sintra, Portugal.
The target audience is European tourists visiting Sintra for the day.

Brand voice: friendly, enthusiastic, approachable — like a knowledgeable local friend, not a corporate travel brochure.

RULES (follow strictly):
1. Only use real, natural words that native speakers actually use in everyday life.
2. Keep brand terms in English exactly as-is: "hop-on/hop-off", "QR code", "Go Sintra", "Hop On Sintra".
3. Keep attraction names in English or their standard local form (e.g. "Pena Palace" or "Palácio da Pena" — whichever is more natural for the target language).
4. Match the EXACT JSON structure — same keys, same nesting, same array lengths. Do NOT add, remove, or rename any keys.
5. Preserve placeholder patterns like {name}, {count}, {price} exactly as they appear.
6. For very short UI strings (buttons, labels under 3 words): be natural and concise, not literal.
7. Return ONLY valid JSON — no explanation, no markdown code fences, no preamble.`;

// ── Argument parsing ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const langArg = args.find((a) => a.startsWith("--lang=") || args[args.indexOf(a) - 1] === "--lang");
const newOnly = args.includes("--new-only");

let targetLanguages = ALL_LANGUAGES;
const langIdx = args.indexOf("--lang");
if (langIdx !== -1 && args[langIdx + 1]) {
  targetLanguages = args[langIdx + 1].split(",").map((l) => l.trim());
} else {
  const inline = args.find((a) => a.startsWith("--lang="));
  if (inline) targetLanguages = inline.replace("--lang=", "").split(",").map((l) => l.trim());
}

// ── Utilities ────────────────────────────────────────────────────────────────

/** Deep-get all leaf paths in an object (dot notation) */
function getLeafPaths(obj, prefix = "") {
  const paths = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      paths.push(...getLeafPaths(v, key));
    } else {
      paths.push(key);
    }
  }
  return paths;
}

/** Deep-get a value by dot-notation path */
function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o != null ? o[k] : undefined), obj);
}

/** Deep-set a value by dot-notation path */
function setPath(obj, dotPath, value) {
  const keys = dotPath.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

/** Deep-merge src into target (target wins on conflict) */
function deepMerge(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v) && typeof target[k] === "object") {
      deepMerge(target[k], v);
    } else if (target[k] === undefined) {
      target[k] = v;
    }
  }
  return target;
}

/**
 * Find keys in en.json that are missing or untranslated in the locale file.
 * "Untranslated" = value is identical to English (leaf strings only).
 */
function findMissingKeys(enObj, localeObj, prefix = "") {
  const missing = {};
  for (const [k, v] of Object.entries(enObj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    const localeVal = localeObj?.[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      const sub = findMissingKeys(v, localeVal || {}, fullKey);
      if (Object.keys(sub).length > 0) missing[k] = sub;
    } else {
      // missing or still English
      if (localeVal === undefined || localeVal === v) {
        missing[k] = v;
      }
    }
  }
  return missing;
}

// ── Translation logic ────────────────────────────────────────────────────────

async function translateSection(client, sectionName, sectionData, lang) {
  const hint = LANGUAGE_HINTS[lang] || "";
  const userMsg = `Translate the following JSON section ("${sectionName}") from English into ${lang.toUpperCase()}.

LANGUAGE-SPECIFIC GUIDANCE: ${hint}

English JSON to translate:
${JSON.stringify(sectionData, null, 2)}`;

  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      const response = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });

      const raw = response.content[0].text.trim();
      // Strip any accidental markdown fences
      const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      return JSON.parse(jsonStr);
    } catch (err) {
      if (attempts >= 3) throw err;
      console.warn(`    ⚠️  Attempt ${attempts} failed (${err.message}), retrying…`);
      await new Promise((r) => setTimeout(r, 1500 * attempts));
    }
  }
}

async function retranslateLanguage(client, lang, enData, newOnly) {
  const localePath = path.join(LOCALES_DIR, `${lang}.json`);
  let existingLocale = {};
  if (fs.existsSync(localePath)) {
    existingLocale = JSON.parse(fs.readFileSync(localePath, "utf-8"));
  }

  // Build the object to translate
  const toTranslate = newOnly ? findMissingKeys(enData, existingLocale) : enData;

  if (newOnly && Object.keys(toTranslate).length === 0) {
    console.log(`  ✅ ${lang.toUpperCase()}: all keys already translated, nothing to do.`);
    return;
  }

  const result = newOnly ? JSON.parse(JSON.stringify(existingLocale)) : {};

  const topLevelSections = Object.keys(toTranslate);
  console.log(`  → ${topLevelSections.length} section(s) to translate`);

  for (const sectionKey of topLevelSections) {
    const sectionData = toTranslate[sectionKey];

    // Split attractions per-attraction to manage token limits
    if (sectionKey === "attractions" && !newOnly) {
      process.stdout.write(`    [${lang}] attractions `);
      result.attractions = {};
      for (const [attrId, attrData] of Object.entries(sectionData)) {
        process.stdout.write("·");
        const translated = await translateSection(client, `attractions.${attrId}`, attrData, lang);
        result.attractions[attrId] = translated;
        await new Promise((r) => setTimeout(r, 200));
      }
      console.log(" done");
    } else {
      process.stdout.write(`    [${lang}] ${sectionKey}…`);
      const translated = await translateSection(client, sectionKey, sectionData, lang);
      if (newOnly) {
        deepMerge(result, { [sectionKey]: translated });
      } else {
        result[sectionKey] = translated;
      }
      console.log(" ✓");
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Write the result
  fs.writeFileSync(localePath, JSON.stringify(result, null, 2) + "\n", "utf-8");
  console.log(`  ✅ Written to ${path.relative(process.cwd(), localePath)}\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌  ANTHROPIC_API_KEY environment variable is not set.");
    console.error("    Set it before running: set ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  const enPath = path.join(LOCALES_DIR, "en.json");
  if (!fs.existsSync(enPath)) {
    console.error(`❌  English source file not found at ${enPath}`);
    process.exit(1);
  }
  const enData = JSON.parse(fs.readFileSync(enPath, "utf-8"));

  console.log(`\n🌍  Go Sintra — Translation Script`);
  console.log(`    Languages : ${targetLanguages.join(", ")}`);
  console.log(`    Mode      : ${newOnly ? "new/missing keys only" : "full retranslation"}`);
  console.log(`    Model     : claude-opus-4-5\n`);

  for (const lang of targetLanguages) {
    if (!ALL_LANGUAGES.includes(lang)) {
      console.warn(`⚠️  Unknown language "${lang}", skipping.`);
      continue;
    }
    console.log(`\n[${lang.toUpperCase()}] Starting…`);
    try {
      await retranslateLanguage(client, lang, enData, newOnly);
    } catch (err) {
      console.error(`❌  Error translating ${lang}: ${err.message}`);
    }
  }

  console.log("\n🎉  Done! Run 'npm run build' to type-check the updated locale files.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
