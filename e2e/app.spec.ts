import {test,expect} from '@playwright/test';
test('edit map, complete demo, inspect history and reload saved record',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');await expect(page.getByRole('heading',{name:'把平凡的街角， 变成一场探险。'})).toBeVisible();await expect(page.locator('.leaflet-container')).toBeVisible();await expect(page.locator('.point-row')).toHaveCount(3);
 await page.screenshot({path:`test-results/${testInfo.project.name}-editor.png`,fullPage:true});
 await page.getByRole('button',{name:'先试试演示探索'}).click();await expect(page.locator('.session-status')).toHaveText('● 探索进行中');
 for(let n=0;n<3;n++){await page.getByRole('button',{name:'走向下一点 →'}).click();if(n<2)await expect(page.getByRole('button',{name:'走向下一点 →'})).toBeEnabled({timeout:40000});}
 await expect(page.getByText('✦ 满载而归')).toBeVisible({timeout:40000});await expect(page.locator('.stats')).toContainText('100');await page.screenshot({path:`test-results/${testInfo.project.name}-completed.png`,fullPage:true});await page.getByRole('button',{name:'保存到历史并返回 ↗'}).click();await page.getByRole('button',{name:'我的足迹',exact:true}).click();await expect(page.locator('.history-card')).toHaveCount(1);await page.locator('.history-card').click();await expect(page.getByRole('button',{name:'导出 JSON'})).toBeVisible();await page.reload();await page.getByRole('button',{name:'我的足迹',exact:true}).click();await expect(page.locator('.history-card')).toHaveCount(1);await expect(page.locator('body')).not.toHaveJSProperty('scrollWidth',0);expect(errors).toEqual([]);
});
test('static local storage and help without backend requests',async({page})=>{const apiCalls:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))apiCalls.push(r.url());});await page.goto('./');await expect(page.getByText('本机存档',{exact:false})).toBeVisible();await page.getByRole('button',{name:'玩法说明',exact:true}).click();await expect(page.getByRole('heading',{name:'让好奇心带路。'})).toBeVisible();expect(apiCalls).toEqual([]);});
test('HTTPS foreground exploration with a deterministic simulated GPS stream',async({page})=>{
 // Keep this fixture separate from the native demo mode. Playwright 1.55 native
 // overrides emit transient errors in Chromium and microseconds in WebKit.
 await page.addInitScript(()=>{
  let next=0;const watches=new Map<number,PositionCallback>();
  const position=()=>({coords:{latitude:31.2312,longitude:121.4747,accuracy:3,altitude:null,altitudeAccuracy:null,heading:null,speed:null},timestamp:Date.now()}) as GeolocationPosition;
  Object.defineProperty(navigator,'geolocation',{value:{watchPosition(success:PositionCallback){const id=++next;watches.set(id,success);setTimeout(()=>{if(watches.has(id))success(position());},0);return id;},clearWatch(id:number){watches.delete(id);},getCurrentPosition(success:PositionCallback){success(position());}}});
  setInterval(()=>{for(const callback of watches.values())callback(position());},1000);
 });
 await page.goto('./');
 expect(await page.evaluate(()=>window.isSecureContext)).toBe(true);
 await page.getByRole('button',{name:'◎ 定位到我'}).click();
 await expect(page.getByText('定位精度 ±3m')).toBeVisible();
 await page.getByRole('button',{name:'开始真实探索'}).click();
 await expect(page.locator('.session-status')).toHaveText('● 探索进行中');
 await expect(page.getByText('✦ 满载而归')).toBeVisible({timeout:12000});
 await expect(page.locator('.events')).toContainText('开始真实探索');
 await expect(page.locator('.stats')).toContainText('100');
});
test('map source switches without exposing configured key in the page address',async({page})=>{
 await page.addInitScript(()=>{
  class Shape{constructor(_options:unknown){}}
  class FakeMap{constructor(_el:HTMLElement,_options:unknown){}on(_name:string,_callback:unknown){}add(_layers:unknown){}remove(_layers:unknown){}setFitView(){}setZoomAndCenter(){}destroy(){}}
  window.AMapLoader={load:async()=>({Map:FakeMap,Polygon:Shape,Polyline:Shape,Circle:Shape,CircleMarker:Shape,Marker:Shape,Pixel:Shape}) as any};
 });
 await page.goto('./');
 await page.getByRole('button',{name:'地图源：OSM'}).click();
 await page.getByRole('textbox',{name:'高德 Web 端 Key'}).fill('test-key-12345');
 await page.getByRole('textbox',{name:'安全密钥'}).fill('test-code-12345');
 await page.getByRole('button',{name:'使用高德地图'}).click();
 await expect(page.getByRole('button',{name:'高德地图 ▾'})).toBeVisible();
 expect(page.url()).not.toContain('test-key');
 await page.getByRole('button',{name:'高德地图 ▾'}).click();
 await page.getByRole('button',{name:'使用 OSM'}).click();
 await expect(page.getByRole('button',{name:'地图源：OSM'})).toBeVisible();
});
