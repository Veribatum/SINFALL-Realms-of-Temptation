import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {Realm} from '../src/world.js';
import * as M from '../src/model.js';

test('town, road and crypt scenes build finite geometry with accessible interactions',()=>{
 const prior=globalThis.document;const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};
 try{const hero=M.makeHero({name:'Scene tester',classId:'ranger',raceId:'elf',originId:'scholar'},9191);const realm=Object.create(Realm.prototype);Object.assign(realm,{hero,scene:new T.Scene(),materials:[],textures:[],quality:'low'});
  for(const type of['town','wilds','dungeon']){M.changeLocation(hero,type);realm.build();let meshes=0;realm.root.updateMatrixWorld(true);realm.root.traverse(o=>{if(o.isMesh){meshes++;assert(o.matrixWorld.elements.every(Number.isFinite));assert(o.geometry.attributes.position.array.every(Number.isFinite))}});assert(meshes>20);assert(realm.canMove(hero.position.x,hero.position.z));for(const e of realm.entities)assert(realm.canMove(e.x,e.z),e.name+' must be approachable');}
  realm.clearScene();
 }finally{globalThis.document=prior}
});
