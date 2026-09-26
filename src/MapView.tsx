import {useEffect,useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {Coord,Point,Sample,kinds} from './core';
export function MapView({boundary,points,trail,position,onTap,focus,focusVersion}:{boundary:Coord[];points:Point[];trail:Sample[];position?:Coord;onTap?:(p:Coord)=>void;focus?:Coord;focusVersion:number}){
 const el=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),overlay=useRef<L.LayerGroup|null>(null),tap=useRef(onTap),fitted=useRef(false);tap.current=onTap;
 useEffect(()=>{if(!el.current)return;const m=L.map(el.current,{zoomControl:false}).setView([31.2304,121.4737],15);map.current=m;L.control.zoom({position:'bottomright'}).addTo(m);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin'}).addTo(m);overlay.current=L.layerGroup().addTo(m);m.on('click',e=>tap.current?.({lat:e.latlng.lat,lng:e.latlng.lng}));const ro=new ResizeObserver(()=>m.invalidateSize());ro.observe(el.current);return()=>{ro.disconnect();m.remove();map.current=null;};},[]);
 useEffect(()=>{const m=map.current,g=overlay.current;if(!m||!g)return;g.clearLayers();const coords=boundary.map(p=>[p.lat,p.lng] as [number,number]);if(coords.length>=3)L.polygon(coords,{color:'#24745e',fillColor:'#6aa681',fillOpacity:.13,weight:2,dashArray:'7 5',interactive:false}).addTo(g);else if(coords.length===2)L.polyline(coords,{color:'#24745e',interactive:false}).addTo(g);if(onTap)for(const p of boundary)L.circleMarker([p.lat,p.lng],{radius:4,color:'#fff',fillColor:'#24745e',fillOpacity:1,weight:2,interactive:false}).addTo(g);
 for(const p of points){const k=kinds[p.kind];L.circle([p.position.lat,p.position.lng],{radius:p.radius,color:k.color,fillOpacity:.07,weight:1,interactive:false}).addTo(g);const marker=L.marker([p.position.lat,p.position.lng],{icon:L.divIcon({className:'quest-marker',html:`<span style="background:${k.color}">${k.icon}</span>`,iconSize:[34,34],iconAnchor:[17,17]})});const content=document.createElement('div');content.textContent=p.name;marker.bindTooltip(content,{direction:'top'}).addTo(g);}
 const groups:Coord[][]=[];let segment:number|undefined;for(const sample of trail){if(sample.segment!==segment){groups.push([]);segment=sample.segment;}groups.at(-1)!.push(sample.position);}for(const group of groups)if(group.length>1)L.polyline(group.map(p=>[p.lat,p.lng]),{color:'#367bd4',weight:4,interactive:false}).addTo(g);
 if(position)L.circleMarker([position.lat,position.lng],{radius:8,color:'#fff',weight:3,fillColor:'#357edf',fillOpacity:1,interactive:false}).addTo(g);
 if(!fitted.current&&boundary.length>=3){m.fitBounds(coords,{padding:[55,55],maxZoom:17});fitted.current=true;}
 },[boundary,points,trail,position,onTap]);
 useEffect(()=>{if(focus)map.current?.setView([focus.lat,focus.lng],17,{animate:true});},[focusVersion,focus]);
 return <div ref={el} className="map-canvas" aria-label="探索地图"/>;
}
