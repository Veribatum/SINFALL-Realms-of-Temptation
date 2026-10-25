"use strict";
(()=> {
const $=id=>document.getElementById(id), N=7, STORE="sinfall-dungeon-v2";
let dungeon=null;
const rnd=n=>Math.floor(Math.random()*n), key=(x,y)=>y*N+x;
function build(floor=1){
 const cells=Array(N*N).fill("wall"),walk=[[1,1]],seen=new Set(["1,1"]);let x=1,y=1;
 for(let i=0;i<100;i++){const moves=[[0,-1],[0,1],[-1,0],[1,0]].filter(([dx,dy])=>x+dx>0&&x+dx<N-1&&y+dy>0&&y+dy<N-1);const [dx,dy]=moves[rnd(moves.length)];x+=dx;y+=dy;seen.add(x+","+y);walk.push([x,y])}
 const rooms=[...seen].map(a=>a.split(",").map(Number));for(const [a,b] of rooms)cells[key(a,b)]="floor";cells[key(1,1)]="start";
 const available=rooms.filter(([a,b])=>Math.abs(a-1)+Math.abs(b-1)>2);function place(type,count){for(let i=0;i<count&&available.length;i++){const j=rnd(available.length),[a,b]=available.splice(j,1)[0];cells[key(a,b)]=type}}
 place("exit",1);place("enemy",Math.min(5,2+floor));place("chest",3);place("shrine",1);
 return {hero:state.name,floor,cells,x:1,y:1,visited:[key(1,1)],cleared:[],enemy:null,steps:0,kills:0};
}
function active(){return state&& !$("game").hidden}
function load(){if(!active())return;try{const d=JSON.parse(localStorage.getItem(STORE));dungeon=d&&d.hero===state.name&&Array.isArray(d.cells)&&d.cells.length===49?d:build()}catch(_){dungeon=build()}save();draw()}
function save(){if(dungeon)localStorage.setItem(STORE,JSON.stringify(dungeon))}
function narrate(msg){$("dungeonMessage").textContent=msg}
function draw(){if(!active()||!dungeon)return;const e=$("dungeonMap");e.replaceChildren();const here=key(dungeon.x,dungeon.y);dungeon.visited=[...new Set([...dungeon.visited,here])];
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=key(x,y),c=document.createElement("div"),v=dungeon.visited.includes(i);c.className="tile "+(v?"revealed":"shrouded")+" "+(dungeon.cells[i]==="wall"?"stone":"path");
 const type=dungeon.cells[i];if(i===here){c.classList.add("current");c.textContent="♟";c.setAttribute("aria-label","Hero")}else if(v){c.textContent={wall:"",floor:"·",start:"⌂",chest:"◈",enemy:"☠",exit:"⇧",shrine:"✦"}[type]||"·";c.setAttribute("aria-label",type)}else c.textContent="";e.append(c)}
 $("floorLabel").textContent="FLOOR "+dungeon.floor+" · "+dungeon.kills+" SLAIN";
 $("battle").hidden=!dungeon.enemy;
 if(dungeon.enemy)battleView();save()}
function reveal(){for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){let x=dungeon.x+xx,y=dungeon.y+yy;if(x>=0&&y>=0&&x<N&&y<N)dungeon.visited.push(key(x,y))}}
function move(dx,dy){if(!active()||!dungeon||dungeon.enemy)return;const nx=dungeon.x+dx,ny=dungeon.y+dy;if(nx<0||ny<0||nx>=N||ny>=N||dungeon.cells[key(nx,ny)]==="wall"){narrate("Ancient stone blocks your path.");return}dungeon.x=nx;dungeon.y=ny;dungeon.steps++;reveal();const t=dungeon.cells[key(nx,ny)];if(t==="enemy"){const max=13+6*dungeon.floor;dungeon.enemy={name:["Crypt Ghoul","Ash Sentinel","Blood Hound","Grave Wraith"][rnd(4)],hp:max,max,attack:2+dungeon.floor};narrate("An enemy emerges from the gloom. Fight or flee.")}else if(t==="chest"){const gold=7+rnd(15)+dungeon.floor*4;state.gold+=gold;state.inventory.push({name:"Health Potion",type:"potion",qty:1});dungeon.cells[key(nx,ny)]="floor";addStory("You open a dusty chest and claim "+gold+" gold and a healing potion.");narrate("Treasure claimed: +"+gold+" gold and a potion!");render()}else if(t==="shrine"){state.hp=Math.min(state.maxHp,state.hp+9);state.mp=Math.min(state.maxMp,state.mp+5);dungeon.cells[key(nx,ny)]="floor";narrate("A moonlit shrine restores your vitality and mana.");render()}else if(t==="exit"){dungeon=build(dungeon.floor+1);reveal();state.xp+=25;addStory("You descend into another level of the cursed keep.");narrate("A deeper floor awaits. +25 XP.");render()}else narrate("You move deeper into the dungeon. Search for chests, enemies, shrines and the stairs.");persist();draw()}
function battleView(){const b=dungeon.enemy;$("enemyName").textContent="☠ "+b.name;$("enemyHealth").style.width=Math.max(0,b.hp/b.max*100)+"%";$("battleText").textContent=b.hp+" / "+b.max+" HP • enemy attack "+b.attack}
function fight(spell=false){if(!dungeon?.enemy)return;const b=dungeon.enemy;if(state.hp<=0){narrate("You are too wounded. Rest at camp.");return}if(spell&&state.mp<4){narrate("Not enough mana. Use a weapon.");return}if(spell)state.mp-=4;
 const bonus=classData[state.cls].stats[spell?"Arcana":"Might"],roll=1+rnd(20),hit=roll>=2&&(roll+bonus>=9);
 const damage=hit?rnd(7)+3+bonus+(spell?3:0):0;b.hp-=damage;
 $("die").textContent=roll;$("rollOutcome").textContent=hit?"HIT: "+damage+" DAMAGE":"MISSED";$("rollDetails").textContent="D20 "+roll+" + "+bonus+" vs 9";
 if(b.hp<=0){const earned=20+5*dungeon.floor;reward(true);state.gold+=earned;dungeon.kills++;dungeon.cells[key(dungeon.x,dungeon.y)]="floor";dungeon.enemy=null;addStory("You defeat "+b.name+" in battle and collect "+earned+" gold.");narrate("Victory! +"+earned+" gold, XP gained.");render()}else{const retaliation=Math.max(1,b.attack+rnd(3)-1);state.hp=Math.max(0,state.hp-retaliation);narrate((hit?"You strike for "+damage+". ":"Your attack misses. ")+b.name+" deals "+retaliation+" damage.");if(state.hp===0){dungeon.enemy=null;state.hp=Math.ceil(state.maxHp/2);state.gold=Math.max(0,state.gold-10);dungeon.x=1;dungeon.y=1;narrate("You fall in battle and awaken at the dungeon entrance, poorer but alive.");addStory("Defeated in the crypt, you are carried to safety.")}render()}persist();draw()}
function flee(){if(!dungeon?.enemy)return;const roll=1+rnd(20);if(roll>=8){dungeon.enemy=null;dungeon.x=1;dungeon.y=1;narrate("You escape to the floor entrance.")}else{state.hp=Math.max(1,state.hp-3);narrate("You stumble away, taking 3 damage. Try again.")}persist();render();draw()}
function interact(){if(!dungeon)return;if(dungeon.enemy){fight(false);return}const arr=[[0,-1],[1,0],[0,1],[-1,0]];const next=arr.find(([dx,dy])=>{const x=dungeon.x+dx,y=dungeon.y+dy;return x>=0&&y>=0&&x<N&&y<N&&["chest","shrine","exit"].includes(dungeon.cells[key(x,y)])});if(next)move(...next);else narrate("Nothing within reach. Explore the corridors.")}
[["moveUp",0,-1],["moveLeft",-1,0],["moveRight",1,0],["moveDown",0,1]].forEach(([id,dx,dy])=>$(id).addEventListener("click",()=>move(dx,dy)));
$("interact").addEventListener("click",interact);$("attack").addEventListener("click",()=>fight(false));$("cast").addEventListener("click",()=>fight(true));$("flee").addEventListener("click",flee);
document.addEventListener("keydown",e=>{if(!active()||!dungeon||["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName))return;const dirs={ArrowUp:[0,-1],w:[0,-1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowDown:[0,1],s:[0,1]};if(dirs[e.key]){e.preventDefault();move(...dirs[e.key])}});
const observer=new MutationObserver(()=>{if(active()&&(!dungeon||dungeon.hero!==state.name))load()});observer.observe($("game"),{attributes:true,attributeFilter:["hidden"]});$("begin").addEventListener("click",()=>{dungeon=build();reveal();draw()});$("newHero").addEventListener("click",()=>{dungeon=null;localStorage.removeItem(STORE)});
if(active())load();
})();