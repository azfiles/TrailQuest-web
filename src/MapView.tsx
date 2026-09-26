import {useEffect,useRef,useState} from 'react';
import {AmapView} from './AmapView';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {Coord,Point,Sample,kinds} from './core';
function LeafletView({boundary,points,trail,position,onTap,focus,focusVersion,drawingBoundary,exploring,onTileError}:{boundary:Coord[];points:Point[];trail:Sample[];position?:Coord;onTap?:(p:Coord)=>void;focus?:Coord;focusVersion:number;drawingBoundary?:boolean;exploring?:boolean;onTileError:(offline:boolean)=>void}){
 const el=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),overlay=useRef<L.LayerGroup|null>(null),tiles=useRef<L.TileLayer|null>(null),tap=useRef(onTap),fitted=useRef(false),tileError=useRef(onTileError);tap.current=onTap;tileError.current=onTileError;
 useEffect(()=>{if(!el.current)return;const m=L.map(el.current,{zoomControl:false}).setView([31.2304,121.4737],15);map.current=m;L.control.zoom({position:'bottomright'}).addTo(m);overlay.current=L.layerGroup().addTo(m);m.on('click',e=>tap.current?.({lat:e.latlng.lat,lng:e.latlng.lng}));const ro=new ResizeObserver(()=>m.invalidateSize());ro.observe(el.current);return()=>{ro.disconnect();m.remove();map.current=null;};},[]);
 useEffect(()=>{const m=map.current;if(!m)return;if(tiles.current)m.removeLayer(tiles.current);const offline=Boolean(exploring);
  const source=offline?`${location.origin}${import.meta.env.BASE_URL}osm-cache/{z}/{x}/{y}.png`:'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const layer=L.tileLayer(source,{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin'});
  let failures=0;layer.on('tileerror',()=>{if(++failures>=3)tileError.current(offline);});layer.on('tileload',()=>{failures=0;});layer.addTo(m);tiles.current=layer;
 },[exploring]);
 useEffect(()=>{const m=map.current,g=overlay.current;if(!m||!g)return;g.clearLayers();const coords=boundary.map(p=>[p.lat,p.lng] as [number,number]);if(coords.length>=3&&!drawingBoundary)L.polygon(coords,{color:'#24745e',fillColor:'#6aa681',fillOpacity:.13,weight:2,dashArray:'7 5',interactive:false}).addTo(g);else if(coords.length>=2)L.polyline(coords,{color:'#24745e',weight:3,interactive:false}).addTo(g);if(onTap)for(const p of boundary)L.circleMarker([p.lat,p.lng],{radius:5,color:'#fff',fillColor:'#24745e',fillOpacity:1,weight:2,interactive:false}).addTo(g);
 for(const p of points){const k=kinds[p.kind];L.circle([p.position.lat,p.position.lng],{radius:p.radius,color:k.color,fillOpacity:.07,weight:1,interactive:false}).addTo(g);const marker=L.marker([p.position.lat,p.position.lng],{icon:L.divIcon({className:'quest-marker',html:`<span style="background:${k.color}">${k.icon}</span>`,iconSize:[34,34],iconAnchor:[17,17]})});const content=document.createElement('div');content.textContent=p.name;marker.bindTooltip(content,{direction:'top'}).addTo(g);}
 const groups:Coord[][]=[];let segment:number|undefined;for(const sample of trail){if(sample.segment!==segment){groups.push([]);segment=sample.segment;}groups.at(-1)!.push(sample.position);}for(const group of groups)if(group.length>1)L.polyline(group.map(p=>[p.lat,p.lng]),{color:'#367bd4',weight:4,interactive:false}).addTo(g);
 if(position)L.circleMarker([position.lat,position.lng],{radius:8,color:'#fff',weight:3,fillColor:'#357edf',fillOpacity:1,interactive:false}).addTo(g);
 if(!fitted.current&&!drawingBoundary&&boundary.length>=3){m.fitBounds(coords,{padding:[55,55],maxZoom:17});fitted.current=true;}
 },[boundary,points,trail,position,onTap,drawingBoundary]);
 useEffect(()=>{if(focus)map.current?.setView([focus.lat,focus.lng],17,{animate:true});},[focusVersion,focus]);
 return <div ref={el} className="map-canvas" aria-label="探索地图"/>;
}

const configKey='trailquest:amap:session';
type MapConfig={key:string;securityCode:string};
function savedConfig():MapConfig|null{try{const raw=sessionStorage.getItem(configKey);if(!raw)return null;const value=JSON.parse(raw);if(typeof value.key==='string'&&typeof value.securityCode==='string')return value;}catch{}return null;}
export function MapView(props:{boundary:Coord[];points:Point[];trail:Sample[];position?:Coord;onTap?:(p:Coord)=>void;focus?:Coord;focusVersion:number;drawingBoundary?:boolean;exploring?:boolean}){
 const [config,setConfig]=useState<MapConfig|null>(savedConfig),[form,setForm]=useState(false),[key,setKey]=useState(''),[code,setCode]=useState(''),[error,setError]=useState('');
 const apply=(event:React.FormEvent)=>{event.preventDefault();const k=key.trim(),c=code.trim();if(!/^[a-zA-Z0-9_-]{8,128}$/.test(k)||!/^[a-zA-Z0-9_-]{8,128}$/.test(c)){setError('请填写高德 Web 端 JS API 的 Key 和安全密钥');return;}const next={key:k,securityCode:c};try{sessionStorage.setItem(configKey,JSON.stringify(next));}catch{setError('无法保存到本次浏览器会话');return;}setError('');setForm(false);setConfig(next);};
 const open=()=>{setKey(config?.key||'');setCode(config?.securityCode||'');setError('');setForm(true);};
 const restore=()=>{sessionStorage.removeItem(configKey);setConfig(null);setError('');setForm(false);};
 return <>{config?<AmapView {...props} keyValue={config.key} securityCode={config.securityCode} onError={setError}/>:<LeafletView {...props} onTileError={offline=>setError(old=>old|| (offline?'离线缓存缺少部分瓦片，底图可能留白；结束探索后联网浏览该位置，或改用高德地图。':'底图加载失败，当前网络可能无法连接 OpenStreetMap。可配置高德地图。'))}/>}
 <div className="map-provider"><button type="button" className="map-pill" onClick={open}>{config?'高德地图':'地图源：OSM'} ▾</button></div>
 {error&&<div className="map-provider-alert" role="alert">{error}<button type="button" onClick={config?restore:open}>{config?'恢复 OSM':'配置高德'}</button></div>}
 {form&&<div className="map-provider-shade" role="presentation" onClick={()=>setForm(false)}><form className="map-provider-form" onClick={event=>event.stopPropagation()} onSubmit={apply}><h2>地图来源</h2><p>当前使用 {config?'高德地图':'OpenStreetMap'}。高德需要你自己的 Web 端（JS API）Key 和安全密钥；只在当前浏览器会话保存，不会提交到 GitHub。高德官方建议生产环境用服务器保护密钥。</p><label>高德 Web 端 Key<input value={key} onChange={event=>setKey(event.target.value)} autoComplete="off" placeholder="Web 端（JS API）Key"/></label><label>安全密钥<input value={code} type="password" onChange={event=>setCode(event.target.value)} autoComplete="off" placeholder="securityJsCode"/></label>{error&&<p role="alert">{error}</p>}<div><button type="submit">使用高德地图</button><button type="button" onClick={restore}>使用 OSM</button><button type="button" onClick={()=>setForm(false)}>取消</button></div></form></div>}
 </>;
}
