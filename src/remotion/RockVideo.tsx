import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CoverVideoProps, LyricLine} from '../types';
import {clamp, ease, easeOut, hash, lerp} from './animation';
import {layoutRockLine} from '../lib/rock';

type C = CanvasRenderingContext2D;
type Pt = [number, number];
const R={black:'#101113',coal:'#202226',steel:'#50555c',silver:'#9da6a9',bone:'#e9e5dc',red:'#bd293d',darkRed:'#4b1724',yellow:'#e1cf55',skin:'#d3a382',skin2:'#a76e58'};
const TAU=Math.PI*2;
const seg=(t:number,a:number,b:number)=>clamp((t-a)/Math.max(.01,b-a));
// Illustrative rhythm, not automatic audio analysis or beat detection.
const sample=(t:number)=>Math.max(0,Math.sin(t*TAU*1.075))*.7;
const hitAt=(t:number)=>clamp((sample(t)-sample(t-.075))*5);

function poly(c:C,pts:Pt[],fill:string,stroke=R.black,w=4){
  c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  c.fillStyle=fill;c.fill();if(w){c.strokeStyle=stroke;c.lineWidth=w;c.lineJoin='round';c.stroke();}
}
function ln(c:C,pts:Pt[],color=R.silver,width=4){
  c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
}
function ellipse(c:C,x:number,y:number,rx:number,ry:number,fill:string,stroke=R.black,w=3){
  c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fillStyle=fill;c.fill();
  if(w){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}
}
function rect(c:C,x:number,y:number,w:number,h:number,fill:string,stroke=R.black,sw=3){
  c.fillStyle=fill;c.fillRect(x,y,w,h);if(sw){c.strokeStyle=stroke;c.lineWidth=sw;c.strokeRect(x,y,w,h);}
}
function camera(c:C,t:number,x=540,y=1040,zoom=1,rot=0){
  // Brief, bounded handheld response follows transients from the actual recording.
  const hit=hitAt(t),f=Math.floor(t*24);
  c.translate(540+(hash(f*3)-.5)*hit*11,960+(hash(f*3+1)-.5)*hit*8);
  c.rotate(rot);c.scale(zoom,zoom);c.translate(-x,-y);
}
function lightning(c:C,x:number,y:number,s:number,color=R.yellow){
  c.save();c.translate(x,y);c.scale(s,s);
  poly(c,[[15,-90],[-45,7],[-9,5],[-30,87],[54,-25],[12,-18]],color,R.black,3);c.restore();
}
function label(c:C,text:string,x:number,y:number,size:number,color=R.bone,angle=0,maxWidth=870){
  c.save();c.translate(x,y);c.rotate(angle);c.font=`${size}px Impact, 'Arial Narrow', sans-serif`;
  c.textAlign='center';c.textBaseline='middle';
  c.scale(Math.min(1,maxWidth/Math.max(1,c.measureText(text).width)),1);
  c.lineWidth=Math.max(2,size*.035);c.strokeStyle=R.black;c.strokeText(text,3,5);
  c.fillStyle=color;c.fillText(text,0,0);c.restore();
}

function amp(c:C,x:number,y:number,s:number,e:number){
  c.save();c.translate(x,y);c.scale(s,s);
  rect(c,-100,-390,200,385,R.coal,R.silver,4);
  rect(c,-90,-378,180,50,R.black);
  for(let i=0;i<6;i++)ellipse(c,-62+i*25,-350,4,4,i===0?R.red:R.silver,R.black,1);
  rect(c,-88,-315,176,294,'#36393d',R.black,3);
  for(let row=0;row<2;row++)for(const side of [-1,1]){
    const xx=side*44,yy=-244+row*140,r=39+e*3;
    ellipse(c,xx,yy,r,r,R.black,R.silver,2);ellipse(c,xx,yy,r*.57,r*.57,R.coal,R.steel,2);
  }
  for(let i=0;i<13;i++)ln(c,[[-85,-308+i*23],[85,-308+i*23]],'#72757522',1);
  rect(c,-82,-402,164,14,R.black,R.silver,2);c.restore();
}

function guitar(c:C,x:number,y:number,s:number,angle:number,strum:number,color=R.red){
  c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);
  // Double-cutaway body, neck, pickups, bridge, strings and tuners.
  poly(c,[[-78,-40],[-48,-92],[-14,-47],[16,-70],[27,-25],[65,3],[80,64],[53,106],[-10,114],[-67,77],[-84,19]],color,R.black,6);
  poly(c,[[-20,-27],[14,-23],[39,9],[28,63],[-40,65],[-48,11]],R.bone,R.black,3);
  rect(c,-14,-250,28,294,'#5d4840',R.silver,3);
  poly(c,[[-18,-252],[-11,-322],[22,-330],[24,-251]],R.bone,R.black,3);
  for(let i=0;i<6;i++)ln(c,[[i%2?-19:24,-268-Math.floor(i/2)*19],[i%2?-29:34,-268-Math.floor(i/2)*19]],R.silver,5);
  for(let i=0;i<11;i++)ln(c,[[-13,-235+i*22],[13,-235+i*22]],R.silver,1.5);
  rect(c,-22,6,44,13,R.black);rect(c,-22,35,44,13,R.black);rect(c,-22,73,44,10,R.silver);
  for(let i=0;i<6;i++)ln(c,[[-8+i*3,-315],[-8+i*3,79]],i%2?R.silver:R.bone,.7);
  ellipse(c,45,53,6,6,R.yellow,R.black,2);ellipse(c,51,77,6,6,R.silver,R.black,2);
  if(strum>.1){c.save();c.globalAlpha=strum*.6;
    for(let i=0;i<3;i++)ln(c,[[82+i*15,-40],[105+i*15,-10],[86+i*15,24]],R.yellow,2);c.restore();}
  c.restore();
}

function musician(c:C,x:number,y:number,s:number,t:number,e:number,role:'guitar'|'drums'|'vocal'='guitar',partner=false,raised=false){
  const phase=t*TAU*1.075+(partner?1.4:0),hit=hitAt(t);
  const nod=Math.sin(phase)*.07+hit*.08;
  const bounce=Math.abs(Math.sin(phase))*7+hit*7;
  const skin=partner?R.skin2:R.skin;
  c.save();c.translate(x,y);c.scale(s,s);c.translate(0,-bounce);c.rotate(role==='drums'?0:nod*.45);
  ellipse(c,0,6,115,13,'#00000055',R.black,0);
  // Wide stance, angled knees, heavy boots and ripped denim.
  for(const side of [-1,1]){
    const knee:Pt=[side*(51+Math.sin(phase)*4),-100],foot:Pt=[side*82,0];
    ln(c,[[side*30,-195],knee,foot],R.black,43);
    ln(c,[[side*30,-195],knee,foot],side<0?'#32363e':'#41464b',32);
    ln(c,[[knee[0]-12,knee[1]-8],[knee[0]+10,knee[1]-12]],R.silver,3);
    poly(c,[[foot[0]-28,-12],[foot[0]+22,-13],[foot[0]+43,12],[foot[0]-31,14]],R.black,R.silver,2);
    ln(c,[[foot[0]-15,-6],[foot[0]+10,-6]],R.silver,2);
  }
  poly(c,[[-56,-329],[45,-331],[65,-193],[-61,-191]],partner?R.red:R.coal,R.black,5);
  poly(c,[[-18,-326],[20,-326],[16,-208],[-18,-211]],R.black,R.silver,1);
  lightning(c,0,-265,.25,R.yellow);
  poly(c,[[-22,-326],[-38,-285],[-15,-267]],R.steel,R.silver,2);
  poly(c,[[24,-327],[36,-282],[20,-269]],R.steel,R.silver,2);
  ln(c,[[22,-264],[32,-205]],R.silver,2);rect(c,-44,-236,20,14,R.black,R.silver,1);
  for(let i=0;i<4;i++)ellipse(c,42-i*3,-318+i*8,2,2,R.silver,R.black,0);
  // Instrument-specific hands: fretting and strumming, sticks, or a microphone grip.
  let left:Pt=[-81,-260],right:Pt=[89,-227];
  if(role==='guitar'){left=[-90,-329+Math.sin(phase*.5)*10];right=[50,-229+Math.sin(phase*2)*15];}
  if(role==='drums'){left=[-102,-223-Math.max(0,Math.sin(phase))*90];right=[102,-223-Math.max(0,Math.sin(phase+Math.PI))*90];}
  if(role==='vocal'){left=[-91,-268];right=[35,-345];}
  if(raised){left=[-103,-435];right=[108,-425];}
  for(const [side,hand] of [[-1,left],[1,right]] as const){
    const elbow:Pt=[side*84,(hand[1]-306)/2];
    ln(c,[[side*45,-309],elbow,hand],R.black,30);
    ln(c,[[side*45,-309],elbow,hand],partner?R.red:R.coal,21);
    ellipse(c,hand[0],hand[1],13,16,skin,R.black,3);
    if(role==='drums')ln(c,[[hand[0],hand[1]],[hand[0]+side*22,hand[1]+61]],R.bone,5);
  }
  if(role==='guitar'&&!raised){
    ln(c,[[-40,-325],[45,-199]],R.black,17);
    guitar(c,5,-220,.65,-.68,Math.abs(Math.sin(phase*2)),partner?R.bone:R.red);
    ellipse(c,right[0],right[1],13,12,skin,R.black,3);
  }
  // Smaller, angular faces and weighty hair give the performance a different silhouette.
  c.save();c.translate(0,-367);c.rotate(role==='guitar'?nod:Math.sin(phase)*.035);
  rect(c,-11,12,22,31,skin,R.black,2);
  poly(c,[[-47,-63],[24,-71],[51,-39],[46,8],[22,35],[-25,29],[-49,4]],skin,R.black,4);
  if(partner){for(let i=0;i<8;i++)ellipse(c,Math.cos(Math.PI+i*Math.PI/7)*46,-38+Math.sin(Math.PI+i*Math.PI/7)*46,17,23,R.black,R.black,0);}
  else poly(c,[[-49,-15],[-61,-66],[-41,-87],[-24,-109],[-12,-87],[15,-104],[23,-83],[47,-92],[61,-42],[43,-26],[28,-55],[4,-44],[-19,-58],[-32,-21]],R.black,R.black,2);
  const blink=(t+(partner?1:0))%5>4.86;
  for(const side of [-1,1]){
    const xx=side*20;
    ln(c,[[xx-8,-34],[xx+8,-31-side*2]],R.black,4);
    if(blink)ln(c,[[xx-6,-21],[xx+6,-21]],R.black,3);
    else ellipse(c,xx,-21,4,6,R.black,R.black,0);
  }
  if(role==='vocal')ellipse(c,3,7,11,5+e*10,R.black,R.black,2);
  else ln(c,[[-8,10],[7,7],[14,9]],R.black,3);
  if(!partner){ln(c,[[-22,22],[-8,27]],'#6f493f',2);ln(c,[[14,23],[26,17]],'#6f493f',2);}
  c.restore();
  if(role==='vocal'){
    ln(c,[[32,-344],[72,-337]],R.black,14);ellipse(c,32,-344,15,12,R.silver,R.black,3);
    ln(c,[[75,-337],[90,-150],[50,80],[140,170]],R.black,3);
  }
  c.restore();
}

function kit(c:C,x:number,y:number,s:number,t:number,e:number){
  const hit=hitAt(t),p=t*TAU*1.075;
  c.save();c.translate(x,y);c.scale(s,s);
  for(const side of [-1,1]){
    ln(c,[[side*185,-270],[side*195,20]],R.silver,5);
    ln(c,[[side*195,20],[side*235,46]],R.silver,4);
    ln(c,[[side*195,20],[side*158,46]],R.silver,4);
    c.save();c.translate(side*185,-270);c.rotate(Math.sin(p+side)*(.02+hit*.08));
    ellipse(c,0,0,105,14,R.yellow,R.black,3);ln(c,[[-64,-2],[62,-2]],'#a89640',2);c.restore();
    rect(c,side*92-55,-192,110,88,R.red,R.black,4);ellipse(c,side*92,-192,55,17,R.bone,R.black,3);
    ln(c,[[side*92,-103],[side*126,24]],R.silver,5);
  }
  ellipse(c,0,-37,130*(1+hit*.035),130,R.red,R.black,6);
  ellipse(c,0,-37,113,113,R.black,R.silver,4);
  lightning(c,0,-37,.73,R.yellow);
  ellipse(c,68,17,19,19,R.coal,R.silver,2);
  for(let i=0;i<8;i++){const a=i*TAU/8;ellipse(c,Math.cos(a)*122,-37+Math.sin(a)*122,4,4,R.silver,R.black,0);}
  c.restore();
  if(e<0)return;
}

function venue(c:C,t:number,e:number,lights=true){
  c.fillStyle=R.black;c.fillRect(-300,-300,1680,2520);
  // Brick, steel trusses and cables form a real venue rather than a flat color field.
  for(let row=0;row<12;row++)for(let col=0;col<7;col++){
    const x=col*190+(row%2?-95:0),y=180+row*98;
    rect(c,x,y,185,90,row%3? '#252024':'#2f2026','#393034',2);
  }
  for(const x of [90,990]){
    ln(c,[[x-20,120],[x-20,1420]],R.steel,6);ln(c,[[x+20,120],[x+20,1420]],R.steel,6);
    for(let y=150;y<1400;y+=90)ln(c,[[x-20,y],[x+20,y+90],[x-20,y+90]],R.steel,3);
  }
  ln(c,[[-100,170],[1180,170]],R.steel,15);
  for(let i=0;i<5;i++){
    const x=170+i*185;
    rect(c,x-34,171,68,57,R.coal,R.silver,3);
    ellipse(c,x,231,27,10,i%2?R.red:R.yellow,R.black,2);
    if(lights){
      const aim=460+Math.sin(t*.45+i)*230;
      c.save();c.globalAlpha=.055+e*.04;
      poly(c,[[x-20,235],[x+20,235],[aim+250,1520],[aim-250,1520]],i%2?R.red:R.bone,R.black,0);c.restore();
    }
  }
  poly(c,[[-200,1430],[1280,1430],[1380,2180],[-300,2180]],'#292b2e',R.black,5);
  for(let i=0;i<10;i++)ln(c,[[540+(i-5)*55,1430],[(i-2)*190,2070]],'#48494b',2);
  ln(c,[[-200,1450],[1280,1450]],R.red,10);
  // Grounded ink smoke, a set of horizontal wisps below the performers.
  c.save();c.globalAlpha=.1;
  for(let i=0;i<9;i++){
    const x=((i*197+t*18)%1500)-180,y=1470+i*28;
    c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+70,y-25,x+190,y+17,x+320,y-14);
    c.strokeStyle=R.silver;c.lineWidth=20+i*2;c.stroke();
  }c.restore();
}

function scratchMarks(c:C,t:number,e:number){
  c.save();c.globalAlpha=.17;
  const frame=Math.floor(t*12);
  for(let i=0;i<10;i++){
    const x=hash(i+60)*1080,y=hash(i+41)*1920;
    ln(c,[[x,y],[x+10+hash(i+frame)*10,y-80-hash(i)*120]],R.bone,1);
  }
  c.restore();
  if(e>.65){c.save();c.globalAlpha=(e-.65)*.22;c.fillStyle=R.red;c.fillRect(0,0,8,1920);c.fillRect(1072,0,8,1920);c.restore();}
}

function entrance(c:C,t:number,u:number,e:number,title:string){
  const pre=u<0,progress=pre?ease(t/3):ease(u);
  c.save();camera(c,t,520,1030,lerp(.94,1.13,progress),-.025);
  venue(c,t,e,!pre||t>2.5);amp(c,175,1460,1.05,e);amp(c,918,1460,1.05,e);
  musician(c,pre?lerp(-160,510,easeOut(t/4.8)):510,1500,1.58,t,e,pre?'guitar':'vocal');
  if(!pre)guitar(c,280,1460,1,-.1,0);
  c.restore();
  if(pre){
    const fade=easeOut(t/.5)*(1-ease(seg(t,4.8,5.8)));
    c.save();c.globalAlpha=fade;
    poly(c,[[100,315],[970,270],[940,660],[118,710]],R.red,R.black,0);
    label(c,title.toUpperCase(),540,500,140,R.bone,-.065);
    label(c,'ROCK COVER',540,770,42,R.silver,-.025);c.restore();
  }
}

function reveal(c:C,t:number,u:number,e:number){
  const beat=seg(u,.75,.85),detail=seg(u,.3,.5)*(1-seg(u,.76,.94));
  c.save();camera(c,t,lerp(540,490,detail),lerp(1040,1150,detail),1+detail*.16,Math.sin(u*Math.PI)*-.04);
  venue(c,t,e);amp(c,125,1490,1.1,e);amp(c,970,1490,1.1,e);
  musician(c,720,1435,1.15,t,e,'drums',true);kit(c,720,1490,1.1,t,e);
  musician(c,345,1510,1.4,t,e,'guitar');
  if(u>.28&&u<.75){
    const close=seg(u,.28,.43)*(1-seg(u,.6,.75));
    c.save();c.globalAlpha=close;
    poly(c,[[130,900],[870,770],[950,1390],[210,1520]],R.darkRed,R.red,7);
    guitar(c,560,1210,1.46,-.72,hitAt(t));c.restore();
  }
  if(beat>0){c.save();c.globalAlpha=(1-seg(u,.85,1))*.6;
    for(let i=0;i<5;i++)ln(c,[[600+i*45,1190],[615+i*48,1140],[630+i*50,1195]],R.yellow,4);c.restore();}
  c.restore();
}

function reassemble(c:C,t:number,u:number,e:number){
  c.fillStyle=R.darkRed;c.fillRect(0,0,1080,1920);
  c.save();camera(c,t,540,1060,1.03,lerp(.065,0,ease(u)));
  const join=ease(seg(u,.1,.65));
  // Torn pieces of the venue become one stage during the line.
  for(let i=0;i<5;i++){
    const offset=(1-join)*(i%2?-1:1)*190,yy=(1-join)*(i%2?170:-100);
    c.save();c.translate(offset,yy);
    const x=70+i*187;
    poly(c,[[x,1150],[x+170,1120+(i%2?70:0)],[x+183,1570],[x-8,1620]],i%2?'#36383b':'#25272b',R.silver,4);
    for(let j=0;j<4;j++)ellipse(c,x+20,1200+j*90,4,4,R.silver,R.black,0);
    c.restore();
  }
  for(const side of [-1,1])amp(c,540+side*(330+(1-join)*130),1470,1,e);
  musician(c,lerp(235,430,join),1510,1.4,t,e,'guitar');
  musician(c,lerp(910,750,join),1400,1,t,e,'drums',true);kit(c,750,1500,.92,t,e);
  if(join>.9){
    const glow=(1-seg(u,.7,1))*e;
    c.save();c.globalAlpha=glow;
    for(let i=0;i<4;i++)ln(c,[[170+i*220,1600],[210+i*200,1400],[180+i*190,1310]],R.yellow,3);c.restore();
  }
  c.restore();
}

function hero(c:C,t:number,u:number,e:number){
  c.fillStyle=R.black;c.fillRect(0,0,1080,1920);
  // Poster-like hard cut: a close performer framed by scarred red LED panels.
  for(let i=0;i<5;i++){
    const x=80+i*195,h=700+sample(t-i*.03)*260;
    rect(c,x,1650-h,165,h,i%2?R.darkRed:R.red,R.black,8);
    for(let y=1660-h;y<1650;y+=29)ln(c,[[x+5,y],[x+160,y]],'#160d1266',5);
  }
  c.save();camera(c,t,550,1040,1+ease(u)*.1,-.025);
  musician(c,565,1570,1.88,t,e,'vocal');guitar(c,800,1490,1.03,.15,0,R.bone);
  for(const x of [70,1000])ln(c,[[x,1700],[x+80,1420],[x+100,1110]],R.steel,3);
  c.restore();
  audience(c,t,e,1720);
}

function audience(c:C,t:number,e:number,y:number){
  for(let i=0;i<10;i++){
    const x=i*126-20,yy=y+Math.sin(t*3+i)*10;
    ellipse(c,x,yy,43,49,R.black,R.steel,2);
    poly(c,[[x-46,yy+32],[x+48,yy+32],[x+72,yy+200],[x-70,yy+200]],R.black,R.steel,2);
    if(i%2===0){
      const hand:Pt=[x+(i%4?70:-70),yy-110-e*25];
      ln(c,[[x+30,yy+60],[x+65,yy-10],hand],R.black,23);
      ln(c,[[hand[0]-6,hand[1]],[hand[0]-10,hand[1]-20]],R.silver,4);
      ln(c,[[hand[0]+8,hand[1]],[hand[0]+13,hand[1]-23]],R.silver,4);
    }
  }
}

function stomp(c:C,t:number,u:number,e:number){
  c.save();camera(c,t,540+Math.sin(u*Math.PI*2)*24,1070,1.03,Math.sin(u*Math.PI*2)*.035);
  venue(c,t,e);amp(c,120,1470,1.18,e);amp(c,960,1470,1.18,e);
  for(let i=0;i<7;i++){
    const x=80+i*150,rise=(Math.max(0,Math.sin(t*TAU*1.075-i*.4))*34+hitAt(t)*30)*seg(u,0,.2);
    poly(c,[[x-60,1540-rise],[x+60,1530-rise],[x+75,1600-rise],[x-70,1610-rise]],i%2?R.coal:R.steel,R.silver,3);
    poly(c,[[x-70,1610-rise],[x+75,1600-rise],[x+75,1610],[x-70,1615]],R.red,R.black,2);
  }
  musician(c,370,1510-hitAt(t)*22,1.46,t,e,'guitar');
  musician(c,770,1410,1.1,t,e,'drums',true);kit(c,770,1530,1.02,t,e);
  // Jagged sound lines originate at the amps, rather than decorative notes.
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const x=side<0?235:850;
    c.save();c.globalAlpha=.13+e*.12;
    ln(c,[[x,1130+i*60],[x-side*30,1100+i*60],[x-side*45,1145+i*60],[x-side*80,1120+i*60]],i%2?R.red:R.yellow,3);c.restore();
  }
  c.restore();audience(c,t,e,1770);
}

function finalHit(c:C,t:number,u:number,e:number,title:string){
  c.save();camera(c,t,540,1040,lerp(1.16,.91,ease(u)),Math.sin(u*Math.PI)*-.04);
  venue(c,t,e);amp(c,120,1500,1.13,e);amp(c,975,1500,1.13,e);
  const outro=u>.75,raised=u>.9;
  musician(c,350,1530,1.5,t,e,outro?'guitar':'vocal',false,raised);
  if(!outro)guitar(c,210,1500,1,-.2,0);
  musician(c,770,1440,1.13,t,e,'drums',true,raised);kit(c,770,1550,1.03,t,e);
  c.restore();audience(c,t,e,1790);
}

function rockLyrics(c:C,l:LyricLine,section:number,t:number,end:number){
  const start=l.startTime??0;if(t<start||t>=end)return;
  const age=t-start,enter=easeOut(age/.14),fade=1-ease(seg(t,end-.12,end));
  let n=0;
  const rows=layoutRockLine(l.text);
  for(const [rowIndex,text] of rows.entries()){
    const row={text:text.toUpperCase(),size:rows.length>2?90:130,y:330+rowIndex*150,
      color:rowIndex===rows.length-1?R.yellow:R.bone,rot:(section%2?1:-1)*(rowIndex%2?.025:-.025)};
    c.save();c.translate(540,row.y+(1-enter)*-33);c.rotate(row.rot);c.globalAlpha=fade;
    c.font=`${row.size}px Impact, 'Arial Narrow', sans-serif`;
    const words=row.text.split(' '),widths=words.map(w=>c.measureText(w).width),space=c.measureText(' ').width;
    const total=widths.reduce((a,b)=>a+b,0)+(words.length-1)*space;
    c.scale(Math.min(1,850/Math.max(1,total)),1);let x=-total/2;
    words.forEach((text,j)=>{
      const tokenIndex=n++,token=l.tokens[tokenIndex];
      const onset=token?.startTime??start+(end-start)*tokenIndex/Math.max(1,l.tokens.length);
      const active=t>=onset,impact=active?Math.exp(-Math.max(0,t-onset)*15):0;
      c.save();c.translate(x+widths[j]/2,impact*-8);c.scale(1+impact*.035,1+impact*.06);
      c.textAlign='center';c.textBaseline='middle';
      // Torn strips and distressed ink replace rounded karaoke glow.
      if(active&&impact>.12){poly(c,[[-widths[j]/2-14,-row.size*.52],[widths[j]/2+10,-row.size*.47],[widths[j]/2+15,row.size*.5],[-widths[j]/2-9,row.size*.53]],R.red,R.black,0);}
      c.lineWidth=7;c.strokeStyle=R.black;c.strokeText(text,3,6);
      c.fillStyle=active?row.color:'#81817b';c.fillText(text,0,0);
      c.save();c.globalAlpha=.17;
      c.beginPath();c.rect(-widths[j]/2,-row.size*.39,widths[j],row.size*.8);c.clip();
      for(let i=0;i<3;i++)ln(c,[[-widths[j]/2,row.size*(hash(i+section*5)-.5)*.65],[widths[j]/2,row.size*(hash(i+section*5)-.5)*.65-2]],R.black,1);
      c.restore();c.restore();x+=widths[j]+space;
    });c.restore();
  }
}

export const RockVideo:React.FC<CoverVideoProps>=({project,audioSrc})=>{
  const canvas=useRef<HTMLCanvasElement>(null),grit=useRef<HTMLCanvasElement|null>(null);
  const frame=useCurrentFrame(),{fps}=useVideoConfig();
  useLayoutEffect(()=>{
    const c=canvas.current?.getContext('2d');if(!c)return;
    const t=frame/fps,e=(sample(t)+sample(t-.02)+sample(t-.04))/3;
    let section=0;project.lines.forEach((l,i)=>{if(l.startTime!==null&&t>=l.startTime)section=i;});
    const current=project.lines[section],start=current?.startTime??0,end=project.lines[section+1]?.startTime??project.renderSettings.duration;
    const u=t<start?-1:seg(t,start,end);
    c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;
    [entrance,reveal,reassemble,hero,stomp,finalHit][section%6](c,t,u,e,project.title);
    if(current)rockLyrics(c,current,section,t,Math.min(current.endTime??end,end));
    // A single shutter-like slash at cuts, with no repeated strobing.
    if(section>0&&t-start<.18){
      const p=easeOut((t-start)/.18),x=lerp(-300,1500,p);
      poly(c,[[x-180,-80],[x+180,-80],[x-220,2000],[x-580,2000]],R.red,R.black,0);
    }
    if(!grit.current){
      const g=document.createElement('canvas');g.width=1080;g.height=1920;const gc=g.getContext('2d')!;
      for(let i=0;i<23000;i++){
        gc.fillStyle=i%2?'#eee8d621':'#0000002b';
        gc.fillRect(hash(i*3)*1080,hash(i*3+1)*1920,1+hash(i)*3,1+hash(i+1)*5);
      }grit.current=g;
    }c.drawImage(grit.current,0,0);scratchMarks(c,t,e);
    const duration=project.renderSettings.duration;
    if(t>duration-.8){c.save();c.globalAlpha=ease(seg(t,duration-.8,duration));c.fillStyle=R.black;c.fillRect(0,0,1080,1920);c.restore();}
  },[frame,fps,project]);
  return <AbsoluteFill style={{background:R.black}}>
    {audioSrc?<Audio src={audioSrc}/>:null}
    <canvas ref={canvas} width={1080} height={1920} style={{width:'100%',height:'100%'}}/>
  </AbsoluteFill>;
};
