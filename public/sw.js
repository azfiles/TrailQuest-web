const root=new URL('./',self.location.href);
const prefix='trailquest-web:'+root.pathname+':';
const cache=prefix+'v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(cache).then(c=>c.addAll([root.href,new URL('icon.svg',root).href,new URL('manifest.webmanifest',root).href])));self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&k!==cache).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==root.origin||!url.pathname.startsWith(root.pathname))return;event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(cache).then(c=>c.put(req,copy));}return response;}).catch(async()=>{const hit=await caches.match(req);if(hit)return hit;if(req.mode==='navigate')return (await caches.match(root.href))||Response.error();return Response.error();}));});
