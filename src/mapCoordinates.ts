import type {Coord} from './core';

// Game records and browser GPS use WGS84. Amap's China basemap uses GCJ-02.
const pi=Math.PI,a=6378245,ee=0.006693421622965943;
const inChina=({lat,lng}:Coord)=>lng>=72.004&&lng<=137.8347&&lat>=0.8293&&lat<=55.8271;
function latitudeOffset(x:number,y:number){let v=-100+2*x+3*y+.2*y*y+.1*x*y+.2*Math.sqrt(Math.abs(x));v+=(20*Math.sin(6*x*pi)+20*Math.sin(2*x*pi))*2/3;v+=(20*Math.sin(y*pi)+40*Math.sin(y/3*pi))*2/3;return v+(160*Math.sin(y/12*pi)+320*Math.sin(y*pi/30))*2/3;}
function longitudeOffset(x:number,y:number){let v=300+x+2*y+.1*x*x+.1*x*y+.1*Math.sqrt(Math.abs(x));v+=(20*Math.sin(6*x*pi)+20*Math.sin(2*x*pi))*2/3;v+=(20*Math.sin(x*pi)+40*Math.sin(x/3*pi))*2/3;return v+(150*Math.sin(x/12*pi)+300*Math.sin(x/30*pi))*2/3;}
export function toAmap(point:Coord):Coord{
 if(!inChina(point))return {...point};
 const rad=point.lat*pi/180,sin=Math.sin(rad),magic=1-ee*sin*sin,sqrt=Math.sqrt(magic),x=point.lng-105,y=point.lat-35;
 return {lat:point.lat+latitudeOffset(x,y)*180/((a*(1-ee))/(magic*sqrt)*pi),lng:point.lng+longitudeOffset(x,y)*180/(a/sqrt*Math.cos(rad)*pi)};
}
export function fromAmap(point:Coord):Coord{
 if(!inChina(point))return {...point};
 let guess={...point};for(let i=0;i<6;i++){const converted=toAmap(guess);guess={lat:guess.lat+point.lat-converted.lat,lng:guess.lng+point.lng-converted.lng};}
 return guess;
}
export const amapPair=(point:Coord):[number,number]=>{const p=toAmap(point);return [p.lng,p.lat];};
