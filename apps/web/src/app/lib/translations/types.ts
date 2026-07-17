import type enJson from './locales/en.json';

// The English JSON file is the single source of truth for the translation shape.
// All other language files must match this structure exactly.
// Adding a key to en.json automatically makes it required everywhere.
export type TranslationFile = typeof enJson;
