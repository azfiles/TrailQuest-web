import test from 'node:test';
import assert from 'node:assert/strict';
import {distance} from '../src/core';
import {toAmap,fromAmap,amapPair} from '../src/mapCoordinates';

test('Shanghai browser GPS and Amap map clicks round-trip within one metre',()=>{
 const gps={lat:31.2304,lng:121.4737};const shifted=toAmap(gps);
 assert.ok(distance(gps,shifted)>100,'China map needs coordinate alignment');
 assert.ok(distance(gps,fromAmap(shifted))<1,'clicks restore WGS84 game geometry');
 assert.deepEqual(amapPair(gps),[shifted.lng,shifted.lat]);
});
test('outside-China game coordinates stay unchanged',()=>{
 const p={lat:52.37,lng:4.9};assert.deepEqual(toAmap(p),p);assert.deepEqual(fromAmap(p),p);
});
