export type Coord = {lat:number;lng:number};
export type Kind = 'treasure'|'trap'|'supply';
export type Point = {id:string;name:string;kind:Kind;position:Coord;radius:number};
export type Quest = {id:string;name:string;boundary:Coord[];points:Point[]};
export type Status = 'active'|'paused'|'completed'|'failed'|'ended';
export type Fix = {position:Coord;accuracy:number;timestamp:number};
export type Event = {id:string;time:number;text:string;position?:Coord;pointId?:string};
export type Sample = {position:Coord;time:number;segment:number};
export type Session = {id:string;quest:Quest;status:Status;demo:boolean;startedAt:number;endedAt?:number;health:number;score:number;found:string[];trail:Sample[];events:Event[];distance:number;activeSeconds:number;segment:number;lastFix?:Fix;outside:boolean;candidates:Record<string,number>};
export const kinds:Record<Kind,{name:string;icon:string;color:string;effect:string}>={treasure:{name:'宝藏',icon:'◆',color:'#b77b24',effect:'+100 分'},trap:{name:'陷阱',icon:'ϟ',color:'#b44d49',effect:'−20 体力'},supply:{name:'补给',icon:'✚',color:'#27786a',effect:'+25 体力'}};
export function id(){return globalThis.crypto?.randomUUID?.() ?? 'q'+Date.now().toString(36)+Math.random().toString(36).slice(2);}
export function distance(a:Coord,b:Coord){const r=Math.PI/180,dlat=(b.lat-a.lat)*r,dlng=(b.lng-a.lng)*r;return 6371000*2*Math.asin(Math.sqrt(Math.min(1,Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2)));}
export function valid(p:Coord){return Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<85&&Math.abs(p.lng)<=180;}
function cross(a:Coord,b:Coord,c:Coord){return (b.lng-a.lng)*(c.lat-a.lat)-(b.lat-a.lat)*(c.lng-a.lng);}
function on(p:Coord,a:Coord,b:Coord){return Math.abs(cross(a,b,p))<1e-12&&p.lng>=Math.min(a.lng,b.lng)-1e-10&&p.lng<=Math.max(a.lng,b.lng)+1e-10&&p.lat>=Math.min(a.lat,b.lat)-1e-10&&p.lat<=Math.max(a.lat,b.lat)+1e-10;}
export function contains(p:Coord,poly:Coord[]){if(!valid(p)||poly.length<3)return false;let inside=false;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(on(p,a,b))return true;if((a.lat>p.lat)!==(b.lat>p.lat)&&p.lng<(b.lng-a.lng)*(p.lat-a.lat)/(b.lat-a.lat)+a.lng)inside=!inside;}return inside;}
export function boundaryError(poly:Coord[]):string|undefined{
 if(poly.length<3)return '请至少标记 3 个边界顶点';if(poly.length>50||!poly.every(valid))return '最多 50 个有效顶点';
 if(poly.some(p=>distance(p,poly[0])>5000||Math.abs(p.lng-poly[0].lng)>1))return '请在约 5 公里以内圈定区域';
 let area=0;
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(distance(a,b)<5)return '相邻顶点请间隔至少 5 米';area+=(a.lng-poly[0].lng)*(b.lat-poly[0].lat)-(b.lng-poly[0].lng)*(a.lat-poly[0].lat);for(let j=i+1;j<poly.length;j++){if(j===(i+1)%poly.length||(j+1)%poly.length===i)continue;const c=poly[j],d=poly[(j+1)%poly.length];if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0||on(c,a,b)||on(d,a,b)||on(a,c,d)||on(b,c,d))return '边界不能交叉或重叠';}}
 if(Math.abs(area)*0.5*111195**2*Math.cos(poly[0].lat*Math.PI/180)<400)return '区域至少需要约 400 平方米';
}
export function questError(q:Quest){return !q.name.trim()?'请填写探索名称':boundaryError(q.boundary)??(!q.points.some(p=>p.kind==='treasure')?'请至少布置一个宝藏':q.points.some(p=>!contains(p.position,q.boundary)||!Number.isFinite(p.radius)||p.radius<15||p.radius>80)?'点位需在区域内，半径为 15–80 米':undefined);}
export function blank():Quest{return {id:id(),name:'我的周末探索',boundary:[],points:[]};}
export function demoQuest(center:Coord={lat:31.2304,lng:121.4737}):Quest{const at=(lat:number,lng:number)=>({lat:center.lat+lat,lng:center.lng+lng});return {id:id(),name:'城市绿洲 · 初次探险',boundary:[at(-.0015,-.002),at(-.0015,.002),at(.0015,.002),at(.0015,-.002)],points:[{id:id(),name:'林间补给站',kind:'supply',position:at(-.0008,-.001),radius:35},{id:id(),name:'藤蔓陷阱',kind:'trap',position:at(0,0),radius:35},{id:id(),name:'树影下的宝藏',kind:'treasure',position:at(.0008,.001),radius:35}]};}
function event(s:Session,text:string,time=Date.now(),position?:Coord,pointId?:string){s.events.push({id:id(),text,time,position,pointId});}
export function start(quest:Quest,demo=false,time=Date.now()):Session{const error=questError(quest);if(error)throw Error(error);const s:Session={id:id(),quest:structuredClone(quest),status:'active',demo,startedAt:time,health:100,score:0,found:[],trail:[],events:[],distance:0,activeSeconds:0,segment:0,outside:false,candidates:{}};event(s,demo?'开始演示探索':'开始真实探索',time);return s;}
export function breakTrack(s:Session){s.segment++;s.lastFix=undefined;s.candidates={};}
export function pause(s:Session){if(s.status==='active'){s.status='paused';breakTrack(s);event(s,'已暂停探索');}}
export function resume(s:Session){if(s.status==='paused'){s.status='active';breakTrack(s);event(s,'继续探索');}}
export function end(s:Session){if(!finished(s)){s.status='ended';s.endedAt=Date.now();breakTrack(s);event(s,'提前结束，足迹已保留');}}
export function finished(s:Session){return ['completed','ended','failed'].includes(s.status);}
export function usable(f:Fix,now=Date.now()){return valid(f.position)&&Number.isFinite(f.accuracy)&&f.accuracy>=0&&f.accuracy<=30&&now-f.timestamp>=-2000&&now-f.timestamp<=10000;}
export function ingest(s:Session,f:Fix,now=Date.now()){
 if(s.status!=='active')return;if(!usable(f,now)){breakTrack(s);return;}
 if(s.lastFix){const dt=(f.timestamp-s.lastFix.timestamp)/1000;if(dt<=0)return;if(dt>15)breakTrack(s);else if(distance(f.position,s.lastFix.position)>Math.max(35,dt*4+f.accuracy+s.lastFix.accuracy)){breakTrack(s);return;}else s.activeSeconds+=dt;}
 s.lastFix=f;
 const last=s.trail.at(-1);if(!last||last.segment!==s.segment){s.trail.push({position:f.position,time:f.timestamp,segment:s.segment});}else{const d=distance(last.position,f.position);if(d>=Math.max(5,f.accuracy/2)&&f.timestamp-last.time>=2000){s.distance+=d;s.trail.push({position:f.position,time:f.timestamp,segment:s.segment});}}
 const outside=!contains(f.position,s.quest.boundary);if(outside!==s.outside){s.outside=outside;event(s,outside?'已离开区域，点位判定暂停':'已回到探索区域',f.timestamp,f.position);}if(outside){s.candidates={};return;}
 for(const kind of ['trap','supply','treasure'] as Kind[]){for(const p of s.quest.points.filter(p=>p.kind===kind&&!s.found.includes(p.id))){if(distance(f.position,p.position)+f.accuracy>p.radius){delete s.candidates[p.id];continue;}if(s.candidates[p.id]===undefined){s.candidates[p.id]=f.timestamp;continue;}if(f.timestamp-s.candidates[p.id]<3000)continue;s.found.push(p.id);delete s.candidates[p.id];if(kind==='treasure')s.score+=100;if(kind==='trap')s.health=Math.max(0,s.health-20);if(kind==='supply')s.health=Math.min(100,s.health+25);event(s,`${p.name} · ${kinds[kind].effect}`,f.timestamp,f.position,p.id);if(!s.health){s.status='failed';s.endedAt=f.timestamp;event(s,'体力耗尽，探索结束',f.timestamp);return;}}}
 if(s.quest.points.filter(p=>p.kind==='treasure').every(p=>s.found.includes(p.id))){s.status='completed';s.endedAt=f.timestamp;event(s,'全部宝藏已找到，探索完成！',f.timestamp);}
}
