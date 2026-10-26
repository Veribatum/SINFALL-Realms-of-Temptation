"use strict";
(function(){
const canvas=document.getElementById("view"),ctx=canvas.getContext("2d");let frame=0, last=0;
const npc=[{x:145,y:286,phase:0,c:"#73958b",name:"Mara the baker"},{x:370,y:292,phase:1.9,c:"#b5799a",name:"Town watch"},{x:530,y:310,phase:3.2,c:"#9b96c5",name:"Wandering pilgrim"}];
const chicken=[{x:246,y:334,phase:0},{x:460,y:343,phase:1.8},{x:88,y:359,phase:3}];
function poly(points,fill){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill()}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function ellipse(x,y,rx,ry,c){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=c;ctx.fill()}
function house(x,y,w,h,roof,wall,sign){rect(x,y,w,h,wall);poly([[x-18,y+3],[x+w/2,y-73],[x+w+18,y+3]],roof);rect(x+w*.39,y+h*.4,w*.23,h*.6,"#34252b");rect(x+14,y+18,25,33,"#e3a85c");rect(x+w-38,y+18,25,33,"#d99c58");rect(x+10,y+14,33,4,"#624348");rect(x+w-41,y+14,33,4,"#624348");if(sign){rect(x+w*.27,y+72,w*.46,25,"#45312d");ctx.fillStyle="#f9d59e";ctx.font="15px Georgia";ctx.textAlign="center";ctx.fillText(sign,x+w/2,y+90);ctx.textAlign="left"}}
function person(x,y,t,color){let sw=Math.sin(t)*4;ellipse(x,y+30,14,5,"#1a19224a");rect(x-5,y-1,10,24,color);ellipse(x,y-10,7,9,"#dfaa87");rect(x-6,y+22,4,9+sw*.2,"#272235");rect(x+2,y+22,4,9-sw*.2,"#272235");rect(x-9,y+2+sw,4,16,"#cbb09f");rect(x+5,y+2-sw,4,16,"#cbb09f");}
function bird(x,y,t){ellipse(x,y+13,10,3,"#16182055");ellipse(x,y,10,8,"#f3ede1");ellipse(x+7,y-7,5,5,"#fff3db");poly([[x+11,y-7],[x+17,y-5],[x+11,y-3]],"#dba043");rect(x-4,y+6,2,7,"#c58a4f");rect(x+4,y+6,2,7,"#c58a4f");ellipse(x+9,y-8,1,1,"#292127");if(Math.sin(t*4)>0.65)ellipse(x-5,y-3,8,4,"#e3decf")}
function draw(t){if(typeof hero==="undefined"||!hero||hero.mode!=="town"||document.getElementById("world").hidden||document.getElementById("adventure").hidden)return;
frame=t/1000;const w=640,h=400;ctx.clearRect(0,0,w,h);
const sky=ctx.createLinearGradient(0,0,0,270);sky.addColorStop(0,"#6b587c");sky.addColorStop(.65,"#bf8390");sky.addColorStop(1,"#e5ad8b");rect(0,0,w,400,sky);
ellipse(494,73,42,42,"#ffe3b4");for(let k=0;k<6;k++)poly([[k*130-45,230],[k*130+27,150+(k%3)*17],[k*130+110,235]],"#686078");
poly([[0,245],[125,185],[270,250],[417,188],[640,239],[640,400],[0,400]],"#4a4c5b");
rect(0,236,640,164,"#69785e");poly([[242,244],[395,244],[590,400],[58,400]],"#b8a38a");poly([[260,244],[380,244],[521,400],[132,400]],"#cabb9d");
house(26,194,171,133,"#493244","#988079","THE INN");
house(432,182,178,143,"#463542","#8d706b","SMITHY");
house(267,154,107,107,"#554051","#8a807f",null);
for(let k=0;k<9;k++){const x=k*82+18;rect(x,315+(k%3)*6,6,24,"#483c39");rect(x-7,319+(k%3)*6,19,5,"#5d4440")}
rect(295,191,36,70,"#332b37");poly([[289,192],[313,140],[339,192]],"#59445b");ctx.strokeStyle="#e4b276";ctx.lineWidth=3;ctx.strokeRect(301,207,24,34);
for(let i=0;i<8;i++){let x=(i*97+19)%640,y=280+(i%3)*13;ellipse(x,y,12,9,"#638363");ellipse(x+7,y-6,10,12,"#587759")}
npc.forEach((p,i)=>person(p.x+Math.sin(frame*.45+i)*38,p.y,frame*3+p.phase,p.c));
chicken.forEach((p,i)=>bird(p.x+Math.sin(frame*.9+p.phase)*23,p.y+Math.cos(frame*.5+i)*4,frame+i));
ctx.fillStyle="#120e20ab";ctx.fillRect(0,0,640,36);ctx.fillStyle="#ffe2b5";ctx.font="bold 16px Georgia";ctx.fillText("VELVET DOMINION  •  VILLAGE SQUARE",18,25);
}
function loop(t){if(t-last>=33){draw(t);last=t}requestAnimationFrame(loop)}requestAnimationFrame(loop);
canvas.addEventListener("click",e=>{if(typeof hero==="undefined"||!hero||hero.mode!=="town")return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*640,y=(e.clientY-r.top)/r.height*400;if(y<120)return;if(x<215)document.querySelector("#worldActions button:nth-child(3)")?.click();else if(x>410)document.querySelector("#worldActions button:nth-child(3)")?.click();else if(y>250&&typeof modal==="function")modal("VILLAGE LIFE","The Passing Crowd","A villager nods as chickens peck at the cobblestones. Somewhere behind the inn, a bell rings once.",[["Ask about rumors",()=>{if(typeof questStep==="function")questStep()}],["Continue walking",()=>{document.getElementById("modal").hidden=true}]]);});
})();
