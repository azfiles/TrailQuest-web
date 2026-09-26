import {useEffect,useRef,useState} from 'react';
import type {Coord,Point,Sample} from './core';
import {kinds} from './core';
import {amapPair,fromAmap} from './mapCoordinates';

type Props={boundary:Coord[];points:Point[];trail:Sample[];position?:Coord;onTap?:(p:Coord)=>void;focus?:Coord;focusVersion:number;keyValue:string;securityCode:string;onError:(message:string)=>void};

type AmapGlobal={Map:new (...args:any[])=>any;Polygon:new (...args:any[])=>any;Polyline:new (...args:any[])=>any;Circle:new (...args:any[])=>any;CircleMarker:new (...args:any[])=>any;Marker:new (...args:any[])=>any;Pixel:new (...args:any[])=>any};
declare global{interface Window{_AMapSecurityConfig?:{securityJsCode:string};AMapLoader?:{load:(args:{key:string;version:string})=>Promise<AmapGlobal>}}}
let loaderPromise:Promise<void>|undefined;
function loader(){
 if(!loaderPromise)loaderPromise=new Promise<void>((resolve,reject)=>{
  if(window.AMapLoader){resolve();return;}
  const script=document.createElement('script');script.src='https://webapi.amap.com/loader.js';script.async=true;
  const timer=window.setTimeout(()=>reject(Error('高德地图加载超时，请检查网络或 Key')),15000);
  script.onload=()=>{clearTimeout(timer);window.AMapLoader?resolve():reject(Error('高德地图加载器不可用'));};
  script.onerror=()=>{clearTimeout(timer);reject(Error('无法连接高德地图，请检查网络'));};document.head.appendChild(script);
 }).catch(error=>{loaderPromise=undefined;throw error;});return loaderPromise;
}
function markerContent(kind:Point['kind'],name:string){const container=document.createElement('div');container.className='quest-marker amap-quest-marker';container.title=name;const glyph=document.createElement('span');glyph.style.background=kinds[kind].color;glyph.textContent=kinds[kind].icon;container.append(glyph);return container;}
export function AmapView({boundary,points,trail,position,onTap,focus,focusVersion,keyValue,securityCode,onError}:Props){
 const el=useRef<HTMLDivElement>(null),map=useRef<any>(null),sdk=useRef<AmapGlobal>(null),overlays=useRef<any[]>([]),tap=useRef(onTap),fitted=useRef(false),[ready,setReady]=useState(false);tap.current=onTap;
 useEffect(()=>{let alive=true;window._AMapSecurityConfig={securityJsCode:securityCode};
  loader().then(()=>window.AMapLoader!.load({key:keyValue,version:'2.0'})).then(AMap=>{
   if(!alive||!el.current)return;
   sdk.current=AMap;const m=new AMap.Map(el.current,{zoom:15,center:amapPair({lat:31.2304,lng:121.4737}),resizeEnable:true});map.current=m;
   m.on('click',(event:{lnglat:{getLng:()=>number;getLat:()=>number}})=>tap.current?.(fromAmap({lat:event.lnglat.getLat(),lng:event.lnglat.getLng()})));
   setReady(true);
  }).catch(error=>{if(alive)onError(error instanceof Error?error.message:'高德地图加载失败，请检查 Key 和安全密钥');});
  return()=>{alive=false;map.current?.destroy();map.current=null;sdk.current=null;};
 },[keyValue,securityCode]);
 useEffect(()=>{const m=map.current,AMap=sdk.current;if(!ready||!m||!AMap)return;
  if(overlays.current.length)m.remove(overlays.current);const layers:any[]=[];
  const path=boundary.map(amapPair);
  if(path.length>=3)layers.push(new AMap.Polygon({path,strokeColor:'#24745e',strokeWeight:2,strokeStyle:'dashed',fillColor:'#6aa681',fillOpacity:.13,bubble:false}));
  else if(path.length===2)layers.push(new AMap.Polyline({path,strokeColor:'#24745e',strokeWeight:2,bubble:false}));
  if(onTap)for(const p of boundary)layers.push(new AMap.CircleMarker({center:amapPair(p),radius:4,strokeColor:'#fff',strokeWeight:2,fillColor:'#24745e',fillOpacity:1,bubble:false}));
  for(const p of points){const color=kinds[p.kind].color,center=amapPair(p.position);layers.push(new AMap.Circle({center,radius:p.radius,strokeColor:color,strokeWeight:1,fillColor:color,fillOpacity:.07,bubble:false}));layers.push(new AMap.Marker({position:center,content:markerContent(p.kind,p.name),offset:new AMap.Pixel(-17,-17),title:p.name,bubble:false}));}
  let segment:number|undefined,group:Coord[]=[];
  const addSegment=()=>{if(group.length>1)layers.push(new AMap.Polyline({path:group.map(amapPair),strokeColor:'#367bd4',strokeWeight:4,bubble:false}));};
  for(const sample of trail){if(sample.segment!==segment){addSegment();group=[];segment=sample.segment;}group.push(sample.position);}addSegment();
  if(position)layers.push(new AMap.CircleMarker({center:amapPair(position),radius:8,strokeColor:'#fff',strokeWeight:3,fillColor:'#357edf',fillOpacity:1,bubble:false}));
  m.add(layers);overlays.current=layers;
  if(!fitted.current&&path.length>=3){m.setFitView(layers.filter(x=>x instanceof AMap.Polygon),false,[55,55],17);fitted.current=true;}
 },[ready,boundary,points,trail,position,onTap]);
 useEffect(()=>{if(ready&&focus&&map.current)map.current.setZoomAndCenter(17,amapPair(focus));},[ready,focusVersion,focus]);
 return <div ref={el} className="map-canvas" aria-label="探索地图"/>;
}
