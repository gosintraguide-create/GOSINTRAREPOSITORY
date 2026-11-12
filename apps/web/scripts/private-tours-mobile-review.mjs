import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const origin=process.env.REVIEW_ORIGIN || 'http://127.0.0.1:5183';
const baseline=process.env.REVIEW_BASELINE==='true';
const out=path.resolve(import.meta.dirname,'../../../output/mobile-review');fs.mkdirSync(out,{recursive:true});
const fixture=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../src/app/lib/translations/review-fixtures.json'),'utf8'));
const browser=await puppeteer.launch({executablePath:process.env.CHROME_EXECUTABLE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{
 for(const [width,height,language] of [[320,740,'pt'],[390,844,'en'],[430,932,'de'],[320,740,'fr'],[320,740,'es'],[320,740,'it'],[320,740,'nl'],[844,390,'pt'],[1280,900,'en']]){
  const context=await browser.createBrowserContext();const page=await context.newPage();
  await page.setViewport({width,height,isMobile:width<768,hasTouch:width<1024,deviceScaleFactor:1});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:language==='en'?'no-preference':'reduce'}]);
  await page.evaluateOnNewDocument(language=>{localStorage.setItem('language',language);localStorage.setItem('feature-flags',JSON.stringify({privateToursEnabled:true}));},language);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);page.on('request',request=>{
   if(request.url().startsWith(origin)||request.url().startsWith('data:'))return request.continue();
   if(new URL(request.url()).hostname.endsWith('supabase.co')){
    let data={success:true,content:{},settings:{},articles:[],categories:[],tours:[],messages:[],availability:[]};
    if(request.url().includes('private-tours'))data={success:true,tours:fixture.tours};
    if(request.url().includes('blog-articles'))data={success:true,articles:fixture.articles};
    return request.respond({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':request.headers()['access-control-request-headers']||'authorization, content-type, apikey, x-client-info'},body:JSON.stringify(data)});
   }
   return request.abort();
  });
  await page.goto(origin+'/private-tours',{waitUntil:'networkidle0'});
  await page.waitForSelector('#section-classic a');
  await page.waitForFunction(l=>document.documentElement.lang===l,{},language);
  // Dismiss the cookie overlay by its translated label; do not change consent logic.
  const locale=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,`../src/app/lib/translations/locales/${language}.json`),'utf8'));
  for(const button of await page.$$('button'))if((await button.evaluate(e=>e.textContent)).trim()===locale.cookie.rejectAll){await button.click();break;}
  const geometry=()=>page.evaluate(()=>{
   const nav=document.querySelector('#private-tours-sticky-nav'),r=nav.getBoundingClientRect(),buttons=[...nav.querySelectorAll('button')];
   return {y:scrollY,overflow:document.documentElement.scrollWidth>innerWidth+1,nav:{top:r.top,bottom:r.bottom,width:r.width,scrollLeft:nav.scrollLeft,scrollWidth:nav.scrollWidth},buttons:buttons.map(b=>{const r=b.getBoundingClientRect();return{text:b.textContent,left:r.left,right:r.right,current:b.getAttribute('aria-current'),id:b.getAttribute('aria-controls')};})};
  });
  const initial=await geometry();
  await page.screenshot({path:path.join(out,`${baseline?'before':'after'}-${width}-${language}.png`)});
  const checks=[];
  if(!baseline){assert.equal(initial.overflow,false);assert.equal(initial.y,0);assert.ok(initial.buttons[0].left>=-1,'first category accessible without negative overflow');}
  for(const index of [3,0,2,1]){
   const clicked=await page.evaluate(index=>{const nav=document.querySelector('#private-tours-sticky-nav');const button=nav.querySelectorAll('button')[index];button.click();return button.getAttribute('aria-controls')||['section-classic','section-beaten','section-nature','section-hiking'][index];},index);
   await page.waitForFunction(id=>new Promise(resolve=>{const el=document.getElementById(id);let last=el.getBoundingClientRect().top,frames=0;const tick=()=>{const top=el.getBoundingClientRect().top;frames=Math.abs(top-last)<1?frames+1:0;last=top;if(frames>=8)resolve(true);else requestAnimationFrame(tick)};requestAnimationFrame(tick)}),{},clicked);
   const state=await geometry();const section=await page.$eval('#'+clicked,e=>({top:e.getBoundingClientRect().top}));
   checks.push({index,section,...state});
   if(!baseline){assert.ok(section.top>=state.nav.bottom-2,`${width}: section not hidden by sticky bars`);assert.equal(state.buttons[index].current,'location',`${width}: category selection follows destination`);assert.ok(state.buttons[index].left>=-1&&state.buttons[index].right<=width+1,`${width}: active label fully visible`);}
  }
  if(width<768){
   await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'}); for(const el of document.querySelectorAll('*'))if(el.scrollTop)el.scrollTo({top:0,behavior:'instant'});});
   const rail=await page.$('#section-classic [data-tour-rail]') || (await page.$$('#section-classic .md\\:hidden .flex')).at(-1);
   if(rail){
    const box=await rail.boundingBox();const cdp=await page.createCDPSession();
    const x=Math.min(width-35,box.x+box.width-30),y=Math.min(height-80,box.y+80);
    const before=await rail.evaluate(e=>e.scrollLeft);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-i*22,y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const after=await rail.evaluate(e=>e.scrollLeft);
    checks.push({touchSwipe:{before,after}});
    if(!baseline)assert.ok(after>before+20,'touch swipe moves tour cards');
    await rail.evaluate(e=>e.scrollTo({left:e.scrollWidth,behavior:'instant'}));
    await page.waitForFunction(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const edge=await page.evaluate(()=>document.querySelector('#section-classic [data-tour-fade]')?.getAttribute('data-visible'));
    if(!baseline)assert.notEqual(edge,'true','end card is not covered by a misleading fade');
   }
  }
  assert.deepEqual(errors,[]);
  if(!baseline && width<1024){
   const href=await page.$eval('#section-classic a',e=>e.getAttribute('href'));
   await page.goto(origin+href,{waitUntil:'networkidle0'});
   const bookLabel=locale.privateTourDetail.bookThisTour;
   await page.waitForFunction(label=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes(label)),{},bookLabel);
   const detail=await page.evaluate(label=>{
    const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(label));
    const r=button.getBoundingClientRect();
    return {left:r.left,right:r.right,width:r.width,height:r.height,overflow:document.documentElement.scrollWidth>innerWidth+1};
   },bookLabel);
   console.log('Booking control',width,detail);
   assert.ok(detail.left>=0 && detail.right<=width+1,'booking button fits viewport');
   await page.evaluate(label=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(label)).click(),bookLabel);
   await page.waitForSelector('[role="dialog"]');
   const dialog=await page.$eval('[role="dialog"]',e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,overflow:e.scrollWidth>e.clientWidth+1};});
   assert.ok(dialog.left>=-1&&dialog.right<=width+1&&dialog.top>=-1&&dialog.bottom<=height+1,'booking dialog fits viewport');
   await page.screenshot({path:path.join(out,`dialog-${width}-${language}.png`)});
   if(dialog.overflow)console.log(await page.$eval('[role="dialog"]',e=>[...e.querySelectorAll('*')].filter(c=>c.getBoundingClientRect().right>e.getBoundingClientRect().right).map(c=>({tag:c.tagName,cls:c.className,text:c.textContent.slice(0,50)})).slice(0,12)));
   assert.equal(dialog.overflow,false,'booking dialog has no horizontal overflow');
   await page.keyboard.press('Escape');
   await page.waitForSelector('[role="dialog"]',{hidden:true});
   checks.push({detail,dialog});
   assert.deepEqual(errors,[]);
  }
  results.push({width,height,language,initial,checks,errors});await context.close();console.log(`Checked ${width}×${height} ${language}`);
 }
 fs.writeFileSync(path.join(out,baseline?'before.json':'after.json'),JSON.stringify(results,null,2));
}finally{await browser.close();}
