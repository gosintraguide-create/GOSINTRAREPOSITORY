import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {getProfileCopy} from '../src/app/lib/translations/profileCopy.ts';
const origin=process.env.REVIEW_ORIGIN || 'http://127.0.0.1:5183', out=path.resolve(import.meta.dirname,'../../../output/profile-review');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const user={id:'00000000-0000-4000-8000-000000000001',email:'profile@example.invalid',email_confirmed_at:'2026-01-01',user_metadata:{full_name:'Local Test Guest'},app_metadata:{},aud:'authenticated',created_at:'2026-01-01'};
const session={access_token:'local-customer-token',refresh_token:'local-refresh-token',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon'}).format(new Date());
const card={id:'card1',bookingId:'CC-00000000-0000-4000-8000-000000000001',index:0,name:'Local Test Guest',date,ageBand:'full',status:'confirmed',qr:'LOCAL TEST ONLY',perks:true,canCancel:false,transportHours:{opens:'09:00',closes:'19:30'}};
try {
 for(const language of ['pt','en','de','fr','es','it','nl']){
  const context=await browser.createBrowserContext(),page=await context.newPage(),p=getProfileCopy(language);
  const locale=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,`../src/app/lib/translations/locales/${language}.json`),'utf8'));
  const cardCopy=JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname,'../src/app/lib/translations/card-ui.json'),'utf8'))[language];
  await page.setViewport({width:language==='en'?1280:320,height:844,isMobile:language!=='en',hasTouch:language!=='en'});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.evaluateOnNewDocument(language=>localStorage.setItem('language',language),language);
  const errors=[],sent=[];let rides=[],attempts=0;page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
  await page.setRequestInterception(true);page.on('request',async req=>{
   if(req.url().startsWith(origin)||req.url().startsWith('data:'))return req.continue();
   const url=new URL(req.url());
   if(!url.hostname.endsWith('supabase.co'))return req.abort();
   const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':req.headers()['access-control-request-headers']||'authorization,content-type,apikey,x-client-info'};
   const respond=(data,status=200)=>req.respond({status,headers,contentType:'application/json',body:JSON.stringify(data)});
   if(req.method()==='OPTIONS')return respond({});
   if(url.pathname.endsWith('/otp'))return respond({});
   if(url.pathname.endsWith('/verify'))return respond(session);
   if(url.pathname.endsWith('/user'))return respond(user);
   if(url.pathname.endsWith('/logout'))return respond({});
   if(url.pathname.includes('/customer/')){
    assert.equal(req.headers().authorization,'Bearer local-customer-token');
    if(url.pathname.endsWith('/history'))return respond({success:true,orders:[{id:'local-order',date,createdAt:'2026-11-12T10:00:00Z',state:'paid',quantity:1,totalCents:1500}],nextPage:null});
    if(url.pathname.endsWith('/city-cards'))return respond({success:true,cards:[card],orders:[],refunds:[],recoveryPending:false});
    if(url.pathname.endsWith('/cancel')){rides=rides.map(r=>({...r,status:'cancelled'}));return respond({success:true,request:rides[0]});}
    if(url.pathname.endsWith('/rides')){
     if(req.method()==='POST'){
      const body=JSON.parse(req.postData());sent.push(body);attempts++;
      if(attempts===1)return respond({success:false,error:'Simulated lost response'},503);
      rides=[{id:'local-ride',status:'pending',pickupLocation:body.pickupLocation,destination:body.destination,groupSize:1,nonTukTuk:false,pickedUpAt:null,acceptedByName:null}];return respond({success:true,request:rides[0]});
     }return respond({success:true,requests:rides});
    }
    return respond({success:false,error:'Unexpected customer endpoint'},404);
   }
   return respond({success:true,content:{},settings:{},articles:[],categories:[],messages:[],tours:[]});
  });
  const clickText=async text=>{await page.waitForFunction(text=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()===text&&!b.disabled),{},text);await page.evaluate(text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text).click(),text);};
  await page.goto(origin+'/profile',{waitUntil:'networkidle0'});
  console.log('Profile page',await page.title(),await page.$eval('body',e=>e.innerText.slice(0,300)));
  await page.waitForSelector('input[type=email]');
  for(const button of await page.$$('button'))if((await button.evaluate(e=>e.textContent)).trim()===locale.cookie.rejectAll){await button.click();break;}
  assert.ok(await page.$eval('header', (e,label)=>e.textContent.includes(label),p.signIn));
  await page.type('input[type=email]',user.email);await clickText(cardCopy.sendCode);
  await page.waitForSelector('input[autocomplete=one-time-code]');await page.type('input[autocomplete=one-time-code]','123456');await clickText(cardCopy.verify);
  await page.waitForSelector('.cc-profile-nav');await page.waitForSelector('.cc-qr');
  assert.ok(await page.$eval('header',(e,label)=>e.textContent.includes(label),p.profile));
  assert.match(await page.$eval('meta[name=robots]',e=>e.content),/noindex/);
  await page.screenshot({path:path.join(out,`cards-${language}.png`)});
  await page.click('.cc-profile-nav a[href="/profile/rides"]');await page.waitForSelector('.cc-ride-fields input[type=checkbox]');
  await page.click('.cc-ride-fields input[type=checkbox]');await page.type('input[type=tel]','+351912345678');await clickText(p.send);
  await page.waitForFunction(text=>document.body.textContent.includes(text),{},p.sendError);await clickText(p.retry);
  await page.waitForFunction(text=>document.body.textContent.includes(text),{},p.pending);
  assert.equal(sent.length,2);assert.deepEqual(sent[0],sent[1],'retry must reuse payload and request key');
  await clickText(p.cancel);await page.waitForFunction(text=>document.body.textContent.includes(text),{},p.cancelled);
  await page.screenshot({path:path.join(out,`rides-${language}.png`)});
  await page.$eval('.cc-profile-nav a[href="/profile/history"]',e=>e.click());await page.waitForFunction(text=>document.body.textContent.includes(text),{},p.paid);
  assert.equal(await page.$eval('.customer-cards',e=>e.scrollWidth>e.clientWidth+1),false,'profile fits narrow screen');
  await page.screenshot({path:path.join(out,`history-${language}.png`)});
  await clickText(cardCopy.signOut);await page.waitForSelector('input[type=email]');assert.equal(await page.$('.cc-profile-nav'),null);
  assert.deepEqual(errors,[]);await context.close();console.log(`Profile login, cards, ride retry/cancel, history and logout: ${language} passed`);
 }
}finally{await browser.close();}
