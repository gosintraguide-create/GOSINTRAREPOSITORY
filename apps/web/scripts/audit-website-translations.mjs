import fs from 'node:fs';
import path from 'node:path';
import {parse} from '@babel/parser';
const root = new URL('../src/app/', import.meta.url);
export const pages = ['HomePage','HeroSectionNew','ProductCard','RouteOverview','Header','Footer','InfoBar','AboutPage','AttractionsPage','AttractionDetailPage','PrivateToursPage','PrivateTourDetailPage','TourBookingDialog','TourCalendar','BlogPage','BlogArticlePage','BlogSEO','ArticleFAQ','RouteMapPage','HopOnServiceDetailPage','SunsetSpecialCarousel','SunsetSpecialPurchasePage','ManageBookingPage','RequestPickupPage','BookingConfirmationPage','LiveChatPage','LiveChatWidget','LiveChat','CookieConsent','NotFoundPage','LoadingIndicator','RootLayout','Breadcrumbs','StripePaymentForm','ErrorBoundary','RouterErrorFallback','InstallPrompt','OfflineIndicator'];
export function flatten(value, prefix = '', out = {}) {
  if (typeof value === 'string') out[prefix] = value;
  else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, out);
  return out;
}
export function walk(node, visit, parents = []) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node, parents);
  for (const [key, value] of Object.entries(node)) {
    if (['loc','start','end','extra','comments','tokens'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(child => walk(child, visit, [...parents, node]));
    else if (value && typeof value === 'object') walk(value, visit, [...parents, node]);
  }
}
const en = flatten(JSON.parse(fs.readFileSync(new URL('lib/translations/locales/en.json', root))));
const english = new Set(Object.values(en));
const findings = [];
for (const name of pages) {
  const file = new URL(`components/${name}.tsx`, root);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  walk(parse(source, {sourceType:'module',plugins:['typescript','jsx']}), (node, parents) => {
    const parent = parents.at(-1);
    const visible = node.type === 'JSXText' || (node.type === 'StringLiteral' && parent?.type === 'JSXAttribute' && ['placeholder','alt','title','aria-label'].includes(parent.name?.name));
    if (!visible) return;
    const text = node.value.replace(/\s+/g, ' ').trim();
    if (!/[a-zA-Z]{2}/.test(text)) return;
    findings.push({file:name,line:node.loc.start.line,kind:node.type,text,existing:english.has(text)});
  });
}
fs.mkdirSync(new URL('../../../output/translation-review/', import.meta.url), {recursive:true});
fs.writeFileSync(new URL('../../../output/translation-review/hardcoded.json', import.meta.url),JSON.stringify(findings,null,2));
console.log(findings.map(x=>`${x.file}:${x.line} ${x.existing?'EXISTS':'NEW'} ${x.text}`).join('\n'));
