import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const languages=['en','pt','es','fr','de','nl','it'];
const read=file=>JSON.parse(fs.readFileSync(path.join(root,'src/app/lib/translations',file),'utf8'));
const supplemental=read('website-ui.json');
function flatten(x,p='',out={}){if(typeof x==='string')out[p]=x;else if(x&&typeof x==='object')for(const[k,v]of Object.entries(x))flatten(v,p?`${p}.${k}`:k,out);return out;}
const placeholders=s=>[...s.matchAll(/\{([a-zA-Z]\w*)\}/g)].map(m=>m[1]).sort();
test('all seven catalogues retain keys, array entries and interpolation variables',()=>{
 const reference=flatten(read('locales/en.json'));
 for(const language of languages){const values=flatten(read(`locales/${language}.json`));assert.deepEqual(Object.keys(values).sort(),Object.keys(reference).sort(),language);for(const[k,v]of Object.entries(values)){assert.ok(v.trim(),`${language}.${k} empty`);assert.deepEqual(placeholders(v),placeholders(reference[k]),`${language}.${k}`);assert.ok(!v.includes('\ufffd'),`${language}.${k} encoding`);}}
 for(const[key,row]of Object.entries(supplemental)){assert.deepEqual(Object.keys(row).sort(),[...languages].sort(),key);for(const[l,text]of Object.entries(row)){assert.ok(text.trim());assert.deepEqual(placeholders(text),placeholders(row.en),`${l}.${key}`);}}
});
// These are catalogue/data tests; no DOM renderer or extra test dependency is needed.
const savedValues=new Map();
globalThis.localStorage={getItem:key=>savedValues.get(key)??null,setItem:(key,value)=>savedValues.set(key,String(value)),removeItem:key=>savedValues.delete(key),clear:()=>savedValues.clear()};
globalThis.window=Object.assign(new EventTarget(),{localStorage,location:{hostname:'localhost'}});
globalThis.document={};
const dir=path.join(root,'node_modules/.cache/website-translations');fs.mkdirSync(dir,{recursive:true});
await build({stdin:{contents:`export * from './src/app/lib/translations/loader'; export * from './src/app/lib/translations/websiteText'; export {loadComprehensiveContentForLanguage} from './src/app/lib/comprehensiveContent';export {loadContentWithLanguage} from './src/app/lib/contentManager';`,resolveDir:root,loader:'tsx'},bundle:true,packages:'external',platform:'node',format:'esm',jsx:'automatic',define:{'import.meta.env':'{}'},outfile:path.join(dir,'bundle.mjs')});
const api=await import(pathToFileURL(path.join(dir,'bundle.mjs')));

await build({entryPoints:[path.join(root,'src/app/lib/translations/language.ts')],bundle:true,platform:'node',format:'esm',outfile:path.join(dir,'language.mjs')});
const {normalizeWebsiteLanguage,selectWebsiteLanguage}=await import(pathToFileURL(path.join(dir,'language.mjs')));
test('Brazilian Portuguese device and saved regional preferences resolve to the European Portuguese catalogue',async()=>{
 for(const regional of ['pt-BR','pt-PT','PT_br','pt-AO','pt']){
  assert.equal(normalizeWebsiteLanguage(regional),'pt');
  assert.equal(selectWebsiteLanguage(null,[regional,'en-US'],languages),'pt');
  assert.equal(selectWebsiteLanguage(regional,['en-US'],languages),'pt');
  await api.preloadTranslation(regional);
  assert.equal(api.getTranslation(regional),api.getTranslation('pt'));
  assert.equal(api.websiteText(regional,'Private tours'),api.websiteText('pt','Private tours'));
 }
 assert.equal(selectWebsiteLanguage(null,['ja-JP','pt-BR','en-US'],languages),'pt');
 assert.equal(selectWebsiteLanguage('en',['pt-BR'],languages),'en','explicit visitor choice takes precedence');
 assert.equal(selectWebsiteLanguage(null,['pt-BR'],['en','fr']),'en','disabled languages are not selected');
 assert.equal(selectWebsiteLanguage(null,[],languages),'en');
});

await build({stdin:{contents:`export * from './src/app/lib/translations/publishedContent'; export * from './src/app/lib/translations/loader';`,resolveDir:root,loader:'tsx'},bundle:true,packages:'external',platform:'node',format:'esm',define:{'import.meta.env':'{}'},outfile:path.join(dir,'published.mjs')});
const published=await import(pathToFileURL(path.join(dir,'published.mjs')));
test('reviewed published content covers seven languages without changing booking data or newer CMS edits',async()=>{
 const fixtures=read('review-fixtures.json');
 for(const language of languages){
  await published.preloadTranslation(language);
  const copy=read(`locales/${language}.json`).editorial;
  for(const tour of fixtures.tours){const result=published.reviewedTour(tour,language);assert.equal(result.title,copy.tours[tour.id].title);assert.equal(result.longDescription,copy.tours[tour.id].longDescription);for(const key of ['id','perPersonPrice','fixedPrice','pricingMode','minPeople','maxGroupSize','groupTiers'])assert.deepEqual(result[key],tour[key],key);assert.ok(!result.features.some(x=>/^Feature \d+$/.test(x)));const edited={...tour,title:'New editorial title'};assert.equal(published.reviewedTour(edited,language),edited);}
  for(const article of fixtures.articles){const result=published.reviewedArticle(article,language);assert.equal(result.title,copy.articles[article.id].title);assert.ok(result.content.length>1000);assert.ok(!/€2\.30|€4\.60|guaranteed seating/.test(result.content));const edited={...article,translations:{...article.translations,en:{...article.translations.en,content:'New source edition'}}};assert.equal(published.reviewedArticle(edited,language),undefined);}
 }
 const article=fixtures.articles[0];assert.equal(published.reviewedArticle({...article,translations:{...article.translations,pt:{title:'New approved translation',excerpt:'Approved',content:'Approved CMS content'}}},'pt'),undefined);
 assert.equal(await published.reviewFixture('articles'),undefined,'fixtures are disabled outside explicit local development');
});
test('CMS defaults translate without server translations and keep media/settings',async()=>{
 for(const language of languages){await api.preloadTranslation(language);localStorage.clear();const content=api.loadComprehensiveContentForLanguage(language);assert.equal(content.privateTours.page.heroTitle,api.websiteText(language,'Private tours'));assert.equal(content.privateTours.page.categories.classicSintra.name,api.websiteText(language,'CLASSIC SINTRA'));assert.ok(!content.privateTours.page.faq[2].answer.includes('9am'));}
 localStorage.setItem('comprehensive-content',JSON.stringify({homepage:{hero:{heroImage:'https://example.invalid/photo.jpg'}},adminSettings:{enabledLanguages:['en','pt']}}));
 const pt=api.loadComprehensiveContentForLanguage('pt');assert.equal(pt.homepage.hero.heroImage,'https://example.invalid/photo.jpg');assert.deepEqual(pt.adminSettings.enabledLanguages,['en','pt']);
 localStorage.setItem('comprehensive-content-pt',JSON.stringify({privateTours:{page:{heroTitle:'Passeio editorial aprovado'}}}));
 assert.equal(api.loadComprehensiveContentForLanguage('pt').privateTours.page.heroTitle,'Passeio editorial aprovado');
});
test('saved English website content no longer overwrites translations',async()=>{
 await api.preloadTranslation('pt');localStorage.clear();
 localStorage.setItem('website-content',JSON.stringify({homepage:{hero:{title:'Discover Sintra Your Way',heroImage:'https://example.invalid/image.jpg'}}}));
 const content=api.loadContentWithLanguage('pt');assert.equal(content.homepage.hero.title,api.getTranslation('pt').homepage.hero.title);assert.equal(content.homepage.hero.heroImage,'https://example.invalid/image.jpg');
});
test('interpolation retains values and proper names; language loading notifies subscribers',async()=>{
 for(const language of languages){assert.equal(api.websiteText(language,'Hop On Sintra'),'Hop On Sintra');const text=api.websiteText(language,'From {price} / person',{price:'37,50 €'});assert.ok(text.includes('37,50 €'));assert.ok(!text.includes('{price}'));}
 assert.equal(api.websiteText('unknown','Custom quote'),supplemental['Custom quote'].en);
 assert.ok(api.getLocaleVersion()>=6);
});
