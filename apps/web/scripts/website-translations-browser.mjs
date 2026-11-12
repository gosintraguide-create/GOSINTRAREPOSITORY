import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const root=path.resolve(import.meta.dirname,'../dist');
const output=path.resolve(import.meta.dirname,'../../../output/translation-review');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end();}if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=process.env.REVIEW_ORIGIN || `http://127.0.0.1:${server.address().port}`;
const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXECUTABLE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const languages=process.env.REVIEW_LANGS?.split(',') || ['en','pt','es','fr','de','nl','it'];
const fixtures=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../src/app/lib/translations/review-fixtures.json'),'utf8'));
const english=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../src/app/lib/translations/locales/en.json'),'utf8'));
const supplemental=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../src/app/lib/translations/website-ui.json'),'utf8'));
const routes=process.env.REVIEW_ROUTES?.split(',') || ['/','/private-tours','/attractions','/about','/travel-guide','/route-map','/manage-booking','/request-pickup','/privacy-policy','/terms-of-service','/buy-ticket','/my-cards','/404','/hop-on-hop-off-sintra','/live-chat','/city-card-terms',...Object.keys(english.attractions).filter(k=>typeof english.attractions[k]==='object'&&english.attractions[k].name).map(k=>'/attractions/'+k),...fixtures.tours.map(t=>'/private-tours/'+t.id),...fixtures.articles.map(a=>'/travel-guide/'+a.slug)];
// These account routes belong to separate, unsubmitted local work.
for (const route of ['/my-cards','/city-card-terms']) { const index=routes.indexOf(route); if(index>=0)routes.splice(index,1); }
const results=[];const failures=[];
try{
 await Promise.all(languages.map(async language=>{
  const context=await browser.createBrowserContext();
  const page=await context.newPage();await page.setViewport({width:1366,height:900});
  await page.evaluateOnNewDocument(l=>{localStorage.setItem('language',l);localStorage.setItem('feature-flags',JSON.stringify({privateToursEnabled:true,sunsetSpecialEnabled:false}));},language);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request',request=>{
   const url=new URL(request.url());
   if(request.url().startsWith(origin)||url.protocol==='data:')return request.continue();
   // All remote requests are intercepted: this test cannot reach production or staging.
   if(url.hostname.endsWith('supabase.co')){
    const reply=data=>request.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':request.headers()['access-control-request-headers']||'authorization, content-type, apikey, x-client-info'},body:JSON.stringify(data)});
    if(url.pathname.includes('private-tours'))return reply({success:true,tours:fixtures.tours});
    if(url.pathname.includes('blog-articles'))return reply({success:true,articles:fixtures.articles});
    return reply({success:true,enabled:true,content:{},settings:{},tours:[],articles:[],categories:[],bookings:[],requests:[],monuments:[],images:[],availability:[],messages:[]});
   }
   return request.abort();
  });
  for(const route of routes){
   await page.goto(origin+route,{waitUntil:'networkidle0',timeout:30000});
   await page.waitForFunction(l=>document.documentElement.lang===l,{},language).catch(async error=>{throw new Error(JSON.stringify({language,route,errors,state:await page.evaluate(()=>({lang:document.documentElement.lang,text:document.body.innerText.slice(0,1200)}))})+' '+error.message)});
   const copy=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,`../src/app/lib/translations/locales/${language}.json`),'utf8'));
   const tour=fixtures.tours.find(t=>route==='/private-tours/'+t.id);
   const article=fixtures.articles.find(a=>route==='/travel-guide/'+a.slug);
   if(tour||article){const expected=tour?copy.editorial.tours[tour.id].title:copy.editorial.articles[article.id].title;await page.waitForFunction(title=>[...document.querySelectorAll('h1')].some(e=>e.textContent.trim()===title),{},expected);}
   if(route==='/private-tours') await page.waitForSelector(`a[href="/private-tours/${fixtures.tours[0].id}"]`);
   const snapshot=await page.evaluate(()=>({title:document.title,text:document.body.innerText,overflow:document.documentElement.scrollWidth>innerWidth+2,lang:document.documentElement.lang}));
   if(errors.length)failures.push({language,route,errors:errors.splice(0)});
   if(/Minified React error|An unexpected error occurred/.test(snapshot.text))failures.push({language,route,error:'Error boundary rendered'});
   if(snapshot.text.includes(supplemental['Common solutions:'][language]))failures.push({language,route,error:'Translated error boundary rendered',text:snapshot.text.slice(0,1200)});
   results.push({language,route,...snapshot});
   if(article){assert.ok(snapshot.text.includes(copy.editorial.articles[article.id].excerpt));assert.ok(snapshot.title.includes(copy.editorial.articles[article.id].title));}
   if(route==='/private-tours'){
    const expected={en:'Private tours',pt:'Passeios privados',es:'Visitas privadas',fr:'Visites privées',de:'Private Touren',nl:'Privétours',it:'Tour privati'}[language];
    assert.ok(snapshot.text.includes(expected),`${language} private tours heading`);
    if(language!=='en')assert.ok(!snapshot.text.includes('Not sure which tour is right for you?'),`${language} English CMS leak`);
    if(['pt','de'].includes(language)){
     const copy=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,`../src/app/lib/translations/locales/${language}.json`)));
     for(const button of await page.$$('button'))if((await button.evaluate(e=>e.textContent)).trim()===copy.cookie.rejectAll){await button.click();break;}
     for(const width of [320,390]){
      await page.setViewport({width,height:844});
      await page.waitForFunction(()=>{
       const logo=document.querySelector('header a[href="/"]')?.getBoundingClientRect();
       const cards=[...document.querySelectorAll('header a[href="/my-cards"]')].map(e=>e.getBoundingClientRect()).find(r=>r.width>0);
       return logo && (cards ? logo.right<=cards.left : logo.left>=0 && logo.right<=innerWidth);
      });
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,`${language} mobile overflow at ${width}px`);
     }
     await page.screenshot({path:path.join(output,`private-tours-${language}-mobile.png`),fullPage:true});
     await page.setViewport({width:1366,height:900});
    }
   }
  }
  if(language==='en'){
   await page.goto(origin+'/private-tours',{waitUntil:'networkidle0'});
   for(const button of await page.$$('button'))if((await button.evaluate(e=>e.textContent)).trim()==='Reject All'){await button.click();break;}
   for(const button of await page.$$('button'))if((await button.evaluate(e=>e.textContent)).trim()==='EN'&&await button.isVisible()){await button.click();break;}
   await page.waitForSelector('[role="menuitem"]');
   for(const item of await page.$$('[role="menuitem"]'))if((await item.evaluate(e=>e.textContent)).includes('Português')){await item.click();break;}
   await page.waitForFunction(()=>document.documentElement.lang==='pt'&&document.querySelector('h1')?.textContent==='Passeios privados');
   assert.ok((await page.evaluate(()=>document.body.innerText)).includes('Não sabe que passeio escolher?'));
   console.log('Checked language switch without reloading');
  }
  if(language==='pt'){
   await page.evaluateOnNewDocument(()=>{
    localStorage.removeItem('language');
    Object.defineProperty(navigator,'language',{get:()=> 'pt-BR',configurable:true});
    Object.defineProperty(navigator,'languages',{get:()=> ['pt-BR','en-US'],configurable:true});
   });
   await page.goto(origin+'/private-tours',{waitUntil:'networkidle0'});
   await page.waitForFunction(()=>document.documentElement.lang==='pt' && document.querySelector('h1')?.textContent==='Passeios privados');
   assert.equal(await page.evaluate(()=>localStorage.getItem('language')),'pt');
   console.log('PASS: fresh pt-BR device selects the pt-PT catalogue, without a saved preference');
  }
  await context.close();console.log(`Checked ${language}: ${routes.length} routes`);
 }));
 fs.writeFileSync(path.join(output,process.env.REVIEW_ORIGIN?'preview-review.json':process.env.REVIEW_ROUTES?'targeted-browser-review.json':'browser-review.json'),JSON.stringify({results,failures},null,2));
 assert.deepEqual(failures,[]);
 console.log(`PASS: ${results.length} language/route combinations, isolated from all remote services.`);
}finally{await browser.close();server.close();}
