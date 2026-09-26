import {test,expect} from '@playwright/test';
test('edit map, complete demo, inspect history and reload saved record',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');await expect(page.getByRole('heading',{name:'把平凡的街角， 变成一场探险。'})).toBeVisible();await expect(page.locator('.leaflet-container')).toBeVisible();await expect(page.locator('.point-row')).toHaveCount(3);
 await page.screenshot({path:`test-results/${testInfo.project.name}-editor.png`,fullPage:true});
 await page.getByRole('button',{name:'先试试演示探索'}).click();await expect(page.locator('.session-status')).toHaveText('● 探索进行中');
 for(let n=0;n<3;n++){await page.getByRole('button',{name:'走向下一点 →'}).click();if(n<2)await expect(page.getByRole('button',{name:'走向下一点 →'})).toBeEnabled({timeout:40000});}
 await expect(page.getByText('✦ 满载而归')).toBeVisible({timeout:40000});await expect(page.locator('.stats')).toContainText('100');await page.screenshot({path:`test-results/${testInfo.project.name}-completed.png`,fullPage:true});await page.getByRole('button',{name:'保存到历史并返回 ↗'}).click();await page.getByRole('button',{name:'我的足迹',exact:true}).click();await expect(page.locator('.history-card')).toHaveCount(1);await page.locator('.history-card').click();await expect(page.getByRole('button',{name:'导出 JSON'})).toBeVisible();await page.reload();await page.getByRole('button',{name:'我的足迹',exact:true}).click();await expect(page.locator('.history-card')).toHaveCount(1);await expect(page.locator('body')).not.toHaveJSProperty('scrollWidth',0);expect(errors).toEqual([]);
});
test('static local storage and help without backend requests',async({page})=>{const apiCalls:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))apiCalls.push(r.url());});await page.goto('./');await expect(page.getByText('本机存档',{exact:false})).toBeVisible();await page.getByRole('button',{name:'玩法说明',exact:true}).click();await expect(page.getByRole('heading',{name:'让好奇心带路。'})).toBeVisible();expect(apiCalls).toEqual([]);});
test('HTTPS geolocation permission starts foreground exploration',async({page,context})=>{
 await context.grantPermissions(['geolocation']);
 await context.setGeolocation({latitude:31.2312,longitude:121.4747,accuracy:3});
 await page.goto('./');
 await page.getByRole('button',{name:'◎ 定位到我'}).click();
 await expect(page.getByText('定位精度 ±3m')).toBeVisible();
 await page.getByRole('button',{name:'开始真实探索'}).click();
 await expect(page.locator('.session-status')).toHaveText('● 探索进行中');
 for(let i=0;i<5;i++){await page.waitForTimeout(1100);await context.setGeolocation({latitude:31.2312+i*0.000001,longitude:121.4747,accuracy:3});}
 await expect(page.getByText('✦ 满载而归')).toBeVisible();
 await expect(page.locator('.events')).toContainText('开始真实探索');
});
