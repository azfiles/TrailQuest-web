const root=new URL('./',self.location.href);
const prefix='trailquest-web:'+root.pathname+':';
const cache=prefix+'v2';
const tileCache=prefix+'osm-seen-v1',tileTimes=prefix+'osm-seen-times-v1';
const tileBase='https://tile.openstreetmap.org/';
const tilePath=/^\d+\/\d+\/\d+\.png$/;
const maxAge=7*24*60*60*1000;
self.addEventListener('install',event=>{event.waitUntil(caches.open(cache).then(c=>c.addAll([root.href,new URL('icon.svg',root).href,new URL('manifest.webmanifest',root).href])));self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&![cache,tileCache,tileTimes].includes(k)).map(k=>caches.delete(k))))])));
async function seenTile(req,offline){
 const url=new URL(req.url),path=offline?url.pathname.slice(root.pathname.length+'osm-cache/'.length):url.pathname.slice(1);
 if(!tilePath.test(path))return Response.error();
 const key=tileBase+path,tiles=await caches.open(tileCache),times=await caches.open(tileTimes),hit=await tiles.match(key);
 if(offline)return hit||Response.error();
 const stored=await times.match(key),timestamp=stored?Number(await stored.text()):0;
 if(hit&&timestamp&&Date.now()-timestamp<maxAge)return hit;
 try{const response=await fetch(req);if(response.ok||response.type==='opaque'){
   try{await tiles.put(key,response.clone());await times.put(key,new Response(String(Date.now())));}catch{}
  }return response;
 }catch{return hit||Response.error();}
}
self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET')return;
 if(url.origin===root.origin&&url.pathname.startsWith(root.pathname+'osm-cache/')){event.respondWith(seenTile(req,true));return;}
 if(url.origin==='https://tile.openstreetmap.org'&&tilePath.test(url.pathname.slice(1))){event.respondWith(seenTile(req,false));return;}
 if(url.origin!==root.origin||!url.pathname.startsWith(root.pathname))return;
 event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(cache).then(c=>c.put(req,copy));}return response;}).catch(async()=>{const hit=await caches.match(req);if(hit)return hit;if(req.mode==='navigate')return (await caches.match(root.href))||Response.error();return Response.error();}));});
