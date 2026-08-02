"use strict";
/* ============================================================
   3. DOM
   ============================================================ */
const $ = s => document.querySelector(s);
const shelvesEl=$("#shelves"), vfd=$("#vfd"), fx=$("#fxglass"), stage=$("#stage");
const glassEl=$("#glass");
const doorEl=$("#door"), bayItem=$("#bayitem");
const coinTray=$("#cointray"), lcd=$("#lcd"), lcdStatus=$("#lcdstatus");
const machineEl=$("#machine"), fxRear=$("#fxrear"), fxFront=$("#fxfront");
const stickerZoom=$("#stickerzoom"), stickerZoomCard=$("#stickerzoomcard");
const collectionEl=$("#collection"),collectionPanel=$("#collectionpanel"),collectionGrid=$("#collectiongrid");
const achievementsEl=$("#achievements"),achievementPanel=$("#achievementpanel"),achievementList=$("#achievementlist");
const roomEl=$("#room");
let collectionSuppressed=false;
let scale=1;

glassEl.addEventListener("click",recordGlassStrike,true);
glassEl.addEventListener("selectstart",e=>e.preventDefault());
glassEl.addEventListener("dragstart",e=>e.preventDefault());

const ROOM_THEME_KEY="vending-machine-room-theme-v1";
const ROOM_THEMES=[
  ["room-original","Original basement"],
  ["room-cinder","Cinder block wall and tile floor"],
  ["room-mold","Moldy green wall and stained grey floor"],
  ["room-redbrick","Red brick wall and wood plank floor"],
  ["room-cabin","Dark log cabin with a red rug"]
];
let roomThemeIndex=0;
function setRoomTheme(index,persist=true){
  roomThemeIndex=(index+ROOM_THEMES.length)%ROOM_THEMES.length;
  roomEl.classList.remove(...ROOM_THEMES.map(theme=>theme[0]));
  const [className,name]=ROOM_THEMES[roomThemeIndex];roomEl.classList.add(className);
  roomEl.dataset.roomTheme=name;roomEl.setAttribute("aria-label","Vending machine room background. Current: "+name);
  roomEl.title=className==="room-mold"?name+" — drag the exposed wall or floor to paint slime; press B to change room":name+" — press B to change the room";
  visitRoomTheme(className);
  if(persist)try{localStorage.setItem(ROOM_THEME_KEY,String(roomThemeIndex));}catch(e){}
}
function cycleRoomTheme(){setRoomTheme(roomThemeIndex+1);}
try{
  const savedRoomTheme=Number(localStorage.getItem(ROOM_THEME_KEY));
  if(Number.isInteger(savedRoomTheme)&&savedRoomTheme>=0&&savedRoomTheme<ROOM_THEMES.length)
    roomThemeIndex=savedRoomTheme;
}catch(e){}
setRoomTheme(roomThemeIndex,false);

/* Agent/trail slime-mold renderer adapted from procedural-slime-mold-wall-demo.html. */
const SLIME_PAINT_ACHIEVEMENT_MS=2000;
let slimePaintSessionMs=0;
function recordSlimePainting(elapsed){
  if(ACHIEVEMENTS.unlocked["event:slime-painter"])return;
  slimePaintSessionMs+=elapsed;
  if(slimePaintSessionMs>=SLIME_PAINT_ACHIEVEMENT_MS)unlockAchievement("event:slime-painter");
}
function initSlimeMoldSurface(selector,{floorSurface=false,seed=0x51a7e31d,palette}){
  const canvas=$(selector);
  const ctx=canvas.getContext("2d");
  const simCanvas=document.createElement("canvas");
  const simCtx=simCanvas.getContext("2d");
  const TAU=Math.PI*2;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  let W=260,H=210,N=0,trail,nextTrail,activity,moisture,cracks,wallNoise,imageData;
  let agents=[],recycleCursor=0,steps=0,raf=0,resizeTimer=0,rngState=seed,lastTick=0,paintAwakeUntil=0;
  let pointerDown=false,lastPointerAt=0,lastPointerX=0,lastPointerY=0,lastPlantAt=0;
  const maxAgents=floorSurface?3200:6800;
  const random=()=>{
    rngState^=rngState<<13;rngState^=rngState>>>17;rngState^=rngState<<5;
    return (rngState>>>0)/4294967296;
  };
  const idx=(x,y)=>((y+H)%H)*W+((x+W)%W);
  function hash2(x,y,seed=0){
    let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1442695041);
    n=Math.imul(n^(n>>>13),1274126177);
    return ((n^(n>>>16))>>>0)/4294967295;
  }
  function smoothNoise(x,y,scale,seed=0){
    const gx=x/scale,gy=y/scale,x0=Math.floor(gx),y0=Math.floor(gy);
    const tx=gx-x0,ty=gy-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);
    const a=hash2(x0,y0,seed),b=hash2(x0+1,y0,seed);
    const c=hash2(x0,y0+1,seed),d=hash2(x0+1,y0+1,seed);
    return (a*(1-sx)+b*sx)*(1-sy)+(c*(1-sx)+d*sx)*sy;
  }
  function fractalNoise(x,y,seed=0){
    let value=0,amp=.55,scale=72,total=0;
    for(let octave=0;octave<4;octave++){
      value+=smoothNoise(x,y,scale,seed+octave*19)*amp;total+=amp;amp*=.5;scale*=.48;
    }
    return value/total;
  }
  function generateWall(){
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const i=y*W+x,n=fractalNoise(x,y,31),fine=smoothNoise(x,y,4.5,99);
      const bottomDamp=Math.pow(y/H,floorSurface?1.35:2.35);
      const patches=smoothNoise(x,y,62,402)*.55+smoothNoise(x,y,29,721)*.45;
      const nx=x/W;
      const cabinetDamp=Math.exp(-Math.pow((nx-.12)/.095,2))*.34+
        Math.exp(-Math.pow((nx-.88)/.085,2))*.28+
        (floorSurface?Math.exp(-Math.pow((nx-.54)/.24,2))*.18:0);
      wallNoise[i]=n*.8+fine*.2;
      moisture[i]=clamp(.08+bottomDamp*.48+Math.max(0,patches-.5)*1.05+cabinetDamp*(.28+bottomDamp*.72));
    }
    for(let c=0;c<15;c++){
      let x=(.07+random()*.86)*W,y=(.38+random()*.58)*H,angle=random()*TAU;
      const length=18+random()*70;
      for(let s=0;s<length;s++){
        const xi=Math.floor(x),yi=Math.floor(y);
        for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
          const distance=Math.hypot(ox,oy),p=idx(xi+ox,yi+oy);
          cracks[p]=Math.max(cracks[p],Math.max(0,1-distance/2.4));
          moisture[p]=clamp(moisture[p]+Math.max(0,.22-distance*.065));
        }
        angle+=(random()-.5)*.38;
        if(random()<.04)angle+=(random()-.5)*1.45;
        x+=Math.cos(angle)*1.1;y+=Math.sin(angle)*1.1;
        if(x<1||x>W-2||y<1||y>H-2)break;
      }
    }
  }
  function addColony(cx,cy,count){
    const radius=Math.min(W,H)*(.018+random()*.017);
    for(let i=0;i<count;i++){
      const angle=random()*TAU,radiusAtPoint=Math.sqrt(random())*radius;
      const x=clamp(cx+Math.cos(angle)*radiusAtPoint,1,W-2);
      const y=clamp(cy+Math.sin(angle)*radiusAtPoint,1,H-2);
      if(agents.length<maxAgents)agents.push({x,y,a:random()*TAU,age:random()*500});
      else{
        const agent=agents[recycleCursor];
        recycleCursor=(recycleCursor+1)%agents.length;
        agent.x=x;agent.y=y;agent.a=random()*TAU;agent.age=0;
      }
      const p=idx(Math.floor(x),Math.floor(y));
      trail[p]=Math.min(8,trail[p]+1.5);activity[p]=Math.min(4,activity[p]+1);
    }
  }
  function initialize(){
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.floor(rect.width*dpr));canvas.height=Math.max(1,Math.floor(rect.height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    H=floorSurface?64:140;
    W=Math.max(220,Math.min(320,Math.round(H*rect.width/Math.max(1,rect.height))));N=W*H;
    simCanvas.width=W;simCanvas.height=H;imageData=simCtx.createImageData(W,H);
    trail=new Float32Array(N);nextTrail=new Float32Array(N);activity=new Float32Array(N);
    moisture=new Float32Array(N);cracks=new Float32Array(N);wallNoise=new Float32Array(N);
    agents=[];recycleCursor=0;steps=0;lastTick=0;rngState=seed;generateWall();
    if(floorSurface){
      addColony(W*.105,H*.32,420);addColony(W*.905,H*.57,310);addColony(W*.54,H*.86,210);
    }else{
      addColony(W*.105,H*.72,820);addColony(W*.895,H*.63,680);addColony(W*.52,H*.91,360);
    }
    for(let i=0;i<N;i++){trail[i]*=.25;activity[i]*=.45;}
  }
  function sense(agent,offsetAngle){
    const angle=agent.a+offsetAngle;
    const x=Math.floor(agent.x+Math.cos(angle)*5.8),y=Math.floor(agent.y+Math.sin(angle)*5.8),p=idx(x,y);
    return trail[p]*.88+moisture[p]*2.15+cracks[p]*1.35+(wallNoise[p]-.5)*.18;
  }
  function simulateAgents(){
    const sensorAngle=31*Math.PI/180;
    for(let n=0;n<agents.length;n++){
      const agent=agents[n],forward=sense(agent,0),left=sense(agent,-sensorAngle),right=sense(agent,sensorAngle);
      if(forward<left&&forward<right)agent.a+=(random()<.5?-1:1)*.28;
      else if(left>right)agent.a-=.28;else if(right>left)agent.a+=.28;
      agent.a+=(random()-.5)*.095+Math.sin(agent.age*.009)*.0025;
      agent.x+=Math.cos(agent.a)*.92;agent.y+=Math.sin(agent.a)*.92+.012;
      if(agent.x<1||agent.x>=W-1||agent.y<1||agent.y>=H-1){
        agent.x=clamp(agent.x,1,W-2);agent.y=clamp(agent.y,1,H-2);agent.a+=Math.PI*(.75+random()*.5);
      }
      const p=idx(Math.floor(agent.x),Math.floor(agent.y)),dampBoost=.65+moisture[p]*.8;
      trail[p]=Math.min(10,trail[p]+.72*dampBoost);activity[p]=Math.min(5,activity[p]+.82);agent.age++;
    }
  }
  function diffuseField(){
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      const i=y*W+x,cardinal=trail[i-1]+trail[i+1]+trail[i-W]+trail[i+W];
      const diagonal=trail[i-W-1]+trail[i-W+1]+trail[i+W-1]+trail[i+W+1];
      nextTrail[i]=(trail[i]*.52+cardinal*.095+diagonal*.025)*.99;activity[i]*=.955;
    }
    [trail,nextTrail]=[nextTrail,trail];
  }
  function render(){
    const pixels=imageData.data;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const i=y*W+x,p=i*4,t=trail[i],active=activity[i];
      const near=trail[idx(x-2,y)]+trail[idx(x+2,y)]+trail[idx(x,y-2)]+trail[idx(x,y+2)];
      const halo=clamp(near*.05-t*.075),body=clamp((t-.045)*.5),thick=clamp((t-.78)*.3),front=clamp(active*.68);
      if(body<=0&&halo<=.015){pixels[p]=pixels[p+1]=pixels[p+2]=pixels[p+3]=0;continue;}
      const cell=Math.sin(x*.42+Math.sin(y*.19))*Math.sin(y*.38+Math.cos(x*.17));
      const pore=cell*.5+.5;
      const ridge=clamp((Math.abs(trail[idx(x+1,y)]-trail[idx(x-1,y)])+
        Math.abs(trail[idx(x,y+1)]-trail[idx(x,y-1)]))*.1+thick*.18);
      let r=palette.base[0]+thick*palette.thick[0]+front*palette.front[0]+pore*palette.pore[0]+ridge*palette.ridge[0];
      let g=palette.base[1]+thick*palette.thick[1]+front*palette.front[1]+pore*palette.pore[1]+ridge*palette.ridge[1];
      let b=palette.base[2]+thick*palette.thick[2]+front*palette.front[2]+pore*palette.pore[2]+ridge*palette.ridge[2];
      pixels[p]=clamp(r,0,255);pixels[p+1]=clamp(g,0,255);pixels[p+2]=clamp(b,0,255);
      pixels[p+3]=Math.round(255*clamp(halo*.22+body*(.72+thick*.2)));
    }
    simCtx.putImageData(imageData,0,0);ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    ctx.imageSmoothingEnabled=true;ctx.drawImage(simCanvas,0,0,W,H,0,0,canvas.clientWidth,canvas.clientHeight);
  }
  function step(timestamp){
    const ambientGrowthActive=steps<170;
    const paintedGrowthActive=timestamp<paintAwakeUntil; // later strokes restart growth after ambient growth ends
    if(roomEl.classList.contains("room-mold")&&(ambientGrowthActive||paintedGrowthActive)&&timestamp-lastTick>=50){
      simulateAgents();diffuseField();steps++;lastTick=timestamp;
      render();
    }
    raf=requestAnimationFrame(step);
  }
  function pointerToSim(event){
    const rect=canvas.getBoundingClientRect();
    return {x:(event.clientX-rect.left)/rect.width*W,y:(event.clientY-rect.top)/rect.height*H};
  }
  function plant(event,amount){
    if(!roomEl.classList.contains("room-mold"))return;
    const point=pointerToSim(event);addColony(point.x,point.y,amount);
    paintAwakeUntil=performance.now()+3500;render();
  }
  function finishPainting(event){
    if(!pointerDown)return;
    pointerDown=false;
    if(event?.pointerId!==undefined&&canvas.hasPointerCapture?.(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  }
  canvas.addEventListener("pointerdown",event=>{
    if(!roomEl.classList.contains("room-mold")||event.button!==0)return;
    event.preventDefault();event.stopPropagation();pointerDown=true;
    lastPointerAt=lastPlantAt=performance.now();lastPointerX=event.clientX;lastPointerY=event.clientY;
    canvas.setPointerCapture(event.pointerId);plant(event,floorSurface?240:520);
  });
  canvas.addEventListener("pointermove",event=>{
    if(!pointerDown||!roomEl.classList.contains("room-mold"))return;
    const now=performance.now(),distance=Math.hypot(event.clientX-lastPointerX,event.clientY-lastPointerY);
    if(distance<.5)return;
    event.preventDefault();event.stopPropagation();recordSlimePainting(Math.min(160,Math.max(0,now-lastPointerAt)));
    lastPointerAt=now;lastPointerX=event.clientX;lastPointerY=event.clientY;
    if(now-lastPlantAt>=70){plant(event,floorSurface?42:78);lastPlantAt=now;}
  });
  canvas.addEventListener("pointerup",finishPainting);
  canvas.addEventListener("pointercancel",finishPainting);
  canvas.addEventListener("lostpointercapture",()=>{pointerDown=false;});
  canvas.addEventListener("click",event=>{
    if(roomEl.classList.contains("room-mold")){event.preventDefault();event.stopPropagation();}
  });
  addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(initialize,140);},{passive:true});
  initialize();step();
  return()=>{cancelAnimationFrame(raf);clearTimeout(resizeTimer);};
}
initSlimeMoldSurface("#slime-mold-wall",{
  seed:0x51a7e31d,
  palette:{base:[153,116,18],thick:[38,34,8],front:[18,16,3],pore:[13,11,2],ridge:[30,25,7]}
});
initSlimeMoldSurface("#slime-mold-floor",{
  floorSurface:true,seed:0x73c42a19,
  palette:{base:[14,73,8],thick:[17,54,9],front:[10,29,4],pore:[8,20,2],ridge:[16,37,5]}
});

function setMode(mode){
  S.mode=mode;S.busy=!["idle","transaction","awaitingPickup"].includes(mode);renderHUD();
  syncCascade();
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
class EffectScope{
  constructor(){this.nodes=[];this.classes=[];this.cleanups=[];this.cancelled=false;}
  node(parent,el){parent.appendChild(el);this.nodes.push(el);return el;}
  cls(el,name){el.classList.add(name);this.classes.push([el,name]);}
  cleanup(){if(this.cancelled)return;this.cancelled=true;
    this.cleanups.reverse().forEach(fn=>{try{fn();}catch(e){}});
    this.classes.reverse().forEach(([el,name])=>el.classList.remove(name));
    this.nodes.reverse().forEach(el=>el.remove());}
}

/* ============================================================
   BAMBOO SPRIG — thin stems carrying fans of lance-shaped leaves
   ============================================================ */
function bLeaf(len,wid,shade){
  // base at 0,0 → long tapered point at len,0; widest around 38%
  const d=`M0 0 C ${len*.20} ${-wid*.72} ${len*.46} ${-wid} ${len*.78} ${-wid*.52}`+
          ` C ${len*.9} ${-wid*.28} ${len*.97} ${-wid*.1} ${len} 0`+
          ` C ${len*.97} ${wid*.1} ${len*.9} ${wid*.28} ${len*.78} ${wid*.52}`+
          ` C ${len*.46} ${wid} ${len*.20} ${wid*.72} 0 0 Z`;
  let veins="";
  for(let k=-3;k<=3;k++){
    if(!k) continue;
    const o=wid*(k/4);
    veins+=`<path d="M${len*.09} ${o*.30} Q ${len*.52} ${o*.98} ${len*.93} ${o*.14}"
             stroke="#3f6a1c" stroke-width=".5" fill="none" opacity=".30"/>`;
  }
  return `<path d="${d}" fill="url(#lf${shade})"/>`+
         `<path d="M${len*.02} 0 Q ${len*.55} ${wid*.06} ${len} 0" stroke="#3f6a1c"
            stroke-width="1" fill="none" opacity=".45"/>`+veins;
}
function bFan(x,y,leaves){
  return `<g transform="translate(${x},${y})">` +
    leaves.map(([len,wid,rot,shade])=>
      `<g transform="rotate(${rot})">${bLeaf(len,wid,shade)}</g>`).join("") + `</g>`;
}
(function drawBamboo(){
  const g=document.getElementById("bambooart"); if(!g) return;
  const stem=(d)=>`<path d="${d}" stroke="#4c7526" stroke-width="1.3" fill="none"
     stroke-linecap="round"/>`;
  // bamboo blades run roughly 13:1, so derive half-width from length. Each node
  // opens a wide fan; the spread is biased away from whichever edge is nearer, so
  // the print fills the panel band without clipping.
  const fan=(x,y,spec)=>bFan(x,y,spec.map(([len,rot,shade])=>[len,len/13,rot,shade]));
  g.innerHTML =
    stem("M2 62 C 110 58, 250 50, 438 38") +
    stem("M80 57 C 104 50, 126 44, 148 38") +
    stem("M224 50 C 250 57, 274 62, 300 66") +
    stem("M296 46 C 322 40, 346 36, 370 32") +
    fan(10,60, [[76,-52,"B"],[70,-30,"A"],[62,-8,"C"],[54,14,"A"]]) +
    fan(80,57, [[76,-48,"A"],[72,-26,"C"],[64,-4,"B"],[56,18,"C"]]) +
    fan(148,38,[[70,-30,"C"],[62,-8,"A"],[54,16,"B"]]) +
    fan(152,54, [[76,-44,"C"],[70,-20,"B"],[62,4,"A"],[54,28,"B"]]) +
    fan(224,50, [[74,-40,"A"],[68,-16,"C"],[60,8,"B"],[52,32,"A"]]) +
    fan(300,66,[[68,-8,"B"],[60,16,"A"],[52,36,"C"]]) +
    fan(296,46, [[76,-34,"B"],[70,-10,"A"],[62,14,"C"],[54,38,"B"]]) +
    fan(370,32,[[66,-14,"A"],[58,10,"B"],[50,32,"C"]]) +
    fan(368,42, [[74,-26,"C"],[68,-2,"B"],[60,22,"A"],[52,46,"C"]]) +
    fan(430,38, [[68,-22,"A"],[60,2,"C"],[52,26,"B"]]);
  // fit the viewBox to the ink itself, so the print fills its panel exactly and
  // stays centred however the sprig is laid out
  const fitInk=()=>{
    try{
      const b=g.getBBox(), m=2;
      if(b.width<1||b.height<1) return false;
      g.ownerSVGElement.setAttribute("viewBox",
        `${(b.x-m).toFixed(1)} ${(b.y-m).toFixed(1)} `+
        `${(b.width+2*m).toFixed(1)} ${(b.height+2*m).toFixed(1)}`);
      return true;
    }catch(e){ return false; }
  };
  if(!fitInk()) setTimeout(fitInk,60);
})();

/* Vend coils. A wide slot carries a **pair** of helices, as real snack rows do;
   a narrow candy slot gets one larger helix centred on the pack. Either way the
   product nests inside, so only the nearest turn is drawn in front of it. */
function buildCoil(it){
  const wide = it.w>70;
  const twin = wide;                            // wide rows: two coils per item
  const n  = 4;                                 // turns per helix
  const d  = twin ? 34 : 40;                    // diameter of the front turn
  // the axis runs almost perpendicular to the glass, so the turns recede nearly
  // concentrically — depth comes from scale and dimming, not from sliding sideways
  const px = 2, py = -2.5;
  // place each helix by its FRONT turn (the only one seen when the slot is full),
  // not by the helix centre: the front turn sits -c*px from that centre.
  const c = (n-1)/2;
  const at = twin ? [-Math.round(it.w*.23), Math.round(it.w*.23)] : [0];
  const shifts = at.map(x=>x+c*px);
  const layer=(indices,cls)=>{
    const coil=document.createElement("div"); coil.className="coil "+cls;
    for(const sh of shifts){
      const wrap=document.createElement("div"); wrap.className="coilwrap";
      wrap.style.setProperty("--n",n-1);
      wrap.style.setProperty("--c",(n-1)/2);
      wrap.style.setProperty("--shift",sh+"px");
      for(const i of indices){
        const t=document.createElement("span");
        t.className="turn";
        t.style.cssText=`--i:${i};--d:${d}px;--px:${px}px;--py:${py}px`;
        t.innerHTML='<i class="ring"></i>';
        wrap.appendChild(t);
      }
      coil.appendChild(wrap);
    }
    return coil;
  };
  const backIdx=[]; for(let i=n-1;i>=1;i--) backIdx.push(i);   // far turns first
  return {back:layer(backIdx,"back"), front:layer([0],"front")};
}

function fitEnginePackage(root,targetWidth,targetHeight,rotation=0){
  const pk=root?.matches?.(".spe-package")?root:root?.querySelector?.(".spe-package");
  if(!pk||!globalThis.SnackPackagingEngine)return;
  const layout=()=>{
    if(!pk.isConnected)return;
    const nativeWidth=Number(pk.dataset.width)||pk.offsetWidth;
    const nativeHeight=Number(pk.dataset.height)||pk.offsetHeight;
    const host=pk.parentElement;
    const availableWidth=targetWidth||host?.clientWidth||nativeWidth;
    const availableHeight=targetHeight||host?.clientHeight||nativeHeight;
    const displayScale=Math.min(availableWidth/nativeWidth,availableHeight/nativeHeight);
    pk.classList.add("spe-fitted");
    pk.style.setProperty("--spe-native-width",nativeWidth+"px");
    pk.style.setProperty("--spe-native-height",nativeHeight+"px");
    pk.style.setProperty("--spe-display-scale",String(displayScale));
    pk.style.setProperty("--spe-display-rotation",rotation+"deg");
    SnackPackagingEngine.fitText(pk);
  };
  layout();requestAnimationFrame(()=>{layout();requestAnimationFrame(layout);});
}

/* ---- build the shelves ---- */
SHELVES.forEach((row,ri)=>{
  const sh=document.createElement("div"); sh.className="shelf";
  sh.innerHTML=`<div class="lit"></div>`;
  const slots=document.createElement("div"); slots.className="slots";
  const rail=document.createElement("div"); rail.className="rail";
  row.forEach(it=>{
    const slot=document.createElement("div"); slot.className="slot"; slot.dataset.code=it.code;
    const holder=document.createElement("div");
    holder.className="itemholder";
    holder.style.cssText=
      `position:relative;width:${it.w}px;height:min(${it.h}px,100%);max-width:94%;flex:0 0 auto`;
    holder.innerHTML=it.art();
    holder.firstChild.style.width="100%"; holder.firstChild.style.height="100%";
    fitEnginePackage(holder);
    const coil=buildCoil(it);
    slot.appendChild(coil.back);
    slot.appendChild(holder);
    slot.appendChild(coil.front);
    slots.appendChild(slot);

    const tag=document.createElement("div"); tag.className="tag"; tag.dataset.tag=it.code;
    tag.innerHTML=`<span class="sel"><span class="code">${it.code}</span>
      <span class="price">${(it.price/100).toFixed(2)}</span></span>`;
    rail.appendChild(tag);
  });
  sh.appendChild(slots); sh.appendChild(rail); shelvesEl.appendChild(sh);
});
const slotEl = code => shelvesEl.querySelector(`.slot[data-code="${code}"]`);
const tagEl  = code => shelvesEl.querySelector(`.tag[data-tag="${code}"]`);

/* ============================================================
   5. VFD
   ============================================================ */
let vfdHold=null, idleFlip=0;
function setVFD(txt,holdMs,alert){
  vfd.textContent=txt;
  if(alert){ vfd.classList.remove("alert"); void vfd.offsetWidth; vfd.classList.add("alert"); }
  clearTimeout(vfdHold);
  if(holdMs) vfdHold=setTimeout(()=>{vfdHold=null;refreshVFD();syncCascade();},holdMs);
  else vfdHold=null;
}
function refreshVFD(){
  if(vfdHold) return;
  if(S.mode==="secretEvent") return;
  if(S.mode==="broken"){vfd.textContent="OUT OF ORDER\nGLASS BROKEN";return;}
  if(S.trayItem){ vfd.textContent="PUSH TRAY\nTAKE ITEM"; return; }
  if(S.entry){
    vfd.textContent = "SELECT " + S.entry.padEnd(3,"_") +
      (S.cardSession?"\nCARD OK":"\nCREDIT "+money(S.credit));
    return;
  }
  if(S.cardSession){ vfd.textContent="CARD ACCEPTED\nMAKE SELECTION"; return; }
  if(S.credit>0){ vfd.textContent="CREDIT "+money(S.credit)+"\nMAKE SELECTION"; return; }
  if(META.discovered.length&&idleFlip>0&&idleFlip%7===6){
    const code=META.discovered[META.replay%META.discovered.length];META.replay++;saveMeta();
    vfd.textContent=(CLUES[code]||"").replace(/<br>/g,"\n");return;
  }
  vfd.textContent = (idleFlip%2===0) ? "READY" : "MAKE YOUR\nSELECTION";
}
setInterval(()=>{ if(S.mode==="idle"&&!vfdHold && !S.entry && !S.credit && !S.cardSession && !S.trayItem){
  idleFlip++; refreshVFD(); } }, 2200);
refreshVFD();

/* ============================================================
   6. LIGHT CASCADE  (1 → 2 → keypad rows → OK → 3, hold, repeat)
   ============================================================ */
const light1=$("#light1"), light2=$("#light2"), light3=$("#light3");
const keys=[...document.querySelectorAll(".key")], okKey=$("#okkey");
const keypadRows=[keys.slice(0,3),keys.slice(3,6),keys.slice(6,9),keys.slice(9,12)];
const cascade=[[light1],[light2],...keypadRows,[okKey],[light3]];
let ci=0,holding=false,cascadePaused=false,cascadeResetTimer=null;
const cascadeIsIdle=()=>S.mode==="idle"&&!S.entry&&!S.credit&&!S.cardSession&&!S.trayItem&&!vfdHold;
function darkenCascade(){
  clearTimeout(cascadeResetTimer);cascadeResetTimer=null;
  cascade.flat().forEach(e=>e.classList.remove("lit"));ci=0;holding=false;
}
function pauseCascadeForInput(){cascadePaused=true;darkenCascade();}
function syncCascade(){
  if(!cascadeIsIdle()){darkenCascade();return;}
  if(cascadePaused)cascadePaused=false;
}
function lightPressedControl(el){
  if(!cascadePaused||!el)return;
  el.classList.add("lit");setTimeout(()=>{if(cascadePaused)el.classList.remove("lit");},180);
}
function stepCascade(){
  if(cascadePaused||holding||!cascadeIsIdle()) return;
  if(ci<cascade.length){
    cascade[ci].forEach(e=>e.classList.add("lit")); ci++;
    if(ci===cascade.length){ holding=true;
      cascadeResetTimer=setTimeout(()=>{darkenCascade();},1300); }
  }
}
setInterval(stepCascade,430);

const STANDALONE_LAUNCH_SEQUENCE=["3","2","1","OK","OK","OK"];
let standaloneLaunchProgress=0,standaloneLaunched=false;
function resetStandaloneLaunchSequence(){standaloneLaunchProgress=0;}
function recordStandaloneLaunchInput(token){
  if(standaloneLaunched||machineVanished||S.busy)return false;
  const consumeOK=token==="OK"&&standaloneLaunchProgress>=3;
  if(token===STANDALONE_LAUNCH_SEQUENCE[standaloneLaunchProgress])standaloneLaunchProgress++;
  else standaloneLaunchProgress=token===STANDALONE_LAUNCH_SEQUENCE[0]?1:0;
  if(standaloneLaunchProgress===STANDALONE_LAUNCH_SEQUENCE.length)launchStandaloneMachine();
  return consumeOK;
}
async function launchStandaloneMachine(){
  if(standaloneLaunched)return;
  standaloneLaunched=true;standaloneLaunchProgress=0;rapidClearPresses=[];
  unlockAchievement("event:machine-launch");
  closePop();S.entry="";highlight();setMode("launching");darkenCascade();
  setVFD("LAUNCH SEQUENCE\nARMED");
  const reverseCascade=[...cascade].reverse();
  for(let i=0;i<reverseCascade.length;i++){
    reverseCascade[i].forEach(el=>el.classList.add("launch-red"));
    tone(760-i*58,.075,"square",.035);
    await delay(125);
  }
  await delay(250);
  setVFD("LIFTOFF");
  machineEl.classList.add("fx-standalone-ignition");
  noise(3.9,.085,105);tone(74,3.8,"sawtooth",.055,-18);
  await delay(650);
  machineEl.classList.add("fx-standalone-launch");
  const finishLaunch=()=>machineEl.classList.add("fx-standalone-gone");
  const finishOnAnimationEnd=e=>{
    if(e.animationName!=="standaloneblastoff")return;
    machineEl.removeEventListener("animationend",finishOnAnimationEnd);finishLaunch();
  };
  machineEl.addEventListener("animationend",finishOnAnimationEnd);
  setTimeout(finishLaunch,3500);
}
[[light3,"3"],[light2,"2"],[light1,"1"]].forEach(([button,token])=>{
  button.addEventListener("click",()=>{
    if(standaloneLaunched||machineVanished||S.busy)return;
    pauseCascadeForInput();lightPressedControl(button);sfx.key();recordStandaloneLaunchInput(token);
  });
});

/* ============================================================
   7. HUD
   ============================================================ */
const hud={cash:$("#hudcash"),card:$("#hudcard"),credit:$("#hudcredit"),bought:$("#hudbought"),
           den:$("#hudden")};
const DEN=[[500,"$5"],[100,"$1"],[25,"25¢"],[10,"10¢"],[5,"5¢"]];
function renderHUD(){
  hud.cash.textContent=money(cashTotal());
  hud.card.textContent=money(S.card);
  hud.credit.textContent=money(S.credit);
  hud.bought.textContent=S.bought;
  hud.den.innerHTML="";
  DEN.forEach(([d,l])=>{
    const n=S.cash[d]||0;
    const b=document.createElement("button");
    b.className = d>=100?"bill":"";
    b.textContent=`${l} ×${n}`;
    b.disabled=!n||S.busy;
    b.onclick=()=>insert(d);
    hud.den.appendChild(b);
  });
}
function openWallet(){closePop();$("#hud").classList.remove("hidden");}
function closeWallet(returnFocus=true){
  $("#hud").classList.add("hidden");
  if(returnFocus)$("#hudtoggle").focus();else document.activeElement?.blur();
}
function toggleWallet(returnFocus=true){if($("#hud").classList.contains("hidden"))openWallet();else closeWallet(returnFocus);}
$("#hudhide").onclick=closeWallet;
$("#hud").classList.add("hidden");   // keep the machine unobstructed on initial load
$("#hudtoggle").onclick=openWallet;

function renderCollection(){
  collectionGrid.innerHTML="";
  Object.entries(COLLECTION.items)
    .map(([id,saved])=>({id,saved,it:ITEMS[saved.code]||Object.values(ITEMS).find(it=>it.id===id)}))
    .filter(entry=>entry.it&&entry.saved.count>0)
    .sort((a,b)=>a.it.code.localeCompare(b.it.code))
    .forEach(({id,saved,it})=>{
      const card=document.createElement("article");card.className="collection-card";
      card.setAttribute("role","button");card.setAttribute("tabindex","0");
      card.setAttribute("aria-label","Magnify "+it.name);
      const trash=document.createElement("button");trash.className="collection-trash";trash.type="button";
      trash.setAttribute("aria-label","Remove one "+it.name+" from collection");
      trash.title="Remove one";
      trash.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>';
      trash.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();removeCollectionItem({id});});
      trash.addEventListener("keydown",e=>e.stopPropagation());
      const art=document.createElement("div");art.className="collection-art";art.innerHTML=it.art();
      const pk=art.firstElementChild;
      const enginePk=pk.matches(".spe-package");
      const artScale=Math.min(112/it.w,142/it.h),gw=it.w*artScale,gh=it.h*artScale;
      if(!enginePk)pk.classList.add("gallery-empty");
      pk.style.setProperty("--gallery-w",gw+"px");
      pk.style.setProperty("--gallery-h",gh+"px");pk.style.setProperty("--u",artScale+"px");
      fitEnginePackage(pk,gw,gh);
      // Every collected package is shown torn open; only the ones carrying a
      // secret code have it printed inside the opening.
      const secret=it.clueId?SECRET_CODES[it.clueId]:"";
      if(enginePk)SnackPackagingEngine.open(pk,secret);
      else{
        const opening=document.createElement("i");opening.className="empty-opening";
        if(secret){
          const code=document.createElement("b");code.className="secret-code";code.textContent=secret;
          opening.appendChild(code);
        }
        pk.appendChild(opening);
      }
      const name=document.createElement("div");name.className="name";name.textContent=it.name;
      const count=document.createElement("div");count.className="count";
      count.textContent=saved.count===1?"1 EMPTY PACKAGE":saved.count+" EMPTY PACKAGES";
      card.append(trash,art,name,count);
      card.addEventListener("click",()=>openCollectionItem(card));
      card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){
        e.preventDefault();e.stopPropagation();openCollectionItem(card);
      }});
      collectionGrid.appendChild(card);
    });
}
function openCollectionItem(card){
  if(!card)return;
  stickerSource=card;stickerZoomCard.innerHTML="";
  const clone=card.cloneNode(true);clone.classList.add("collection-card-zoom");
  clone.querySelector(".collection-trash")?.remove();
  clone.removeAttribute("role");clone.removeAttribute("tabindex");clone.removeAttribute("aria-label");
  clone.setAttribute("aria-hidden","true");stickerZoomCard.appendChild(clone);
  stickerZoom.classList.add("on");
  const zoom=Math.max(1.25,Math.min(3,(innerWidth*.72)/clone.offsetWidth,(innerHeight*.68)/clone.offsetHeight));
  clone.style.setProperty("--collection-zoom",zoom.toFixed(2));stickerZoom.focus();
}
function openCollection(){
  if(collectionSuppressed)return;
  closePop();renderCollection();collectionEl.classList.add("on");collectionEl.focus();
}
function closeCollection(returnFocus=true){
  if(!collectionEl.classList.contains("on"))return;
  collectionEl.classList.remove("on");
  if(returnFocus)$("#collectiontoggle").focus();else document.activeElement?.blur();
}
$("#collectiontoggle").onclick=openCollection;
$("#collectionclose").onclick=closeCollection;
collectionPanel.addEventListener("click",e=>e.stopPropagation());
collectionEl.addEventListener("click",closeCollection);

function achievementIconSvg(achievement){
  if(achievement.type==="code"){
    const hue=hash(achievement.id)%360;
    return `<svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="7" y="6" width="50" height="52" rx="8" fill="hsl(${hue} 36% 25%)" stroke="#e9c453" stroke-width="2"/>
      <rect x="12" y="12" width="40" height="15" rx="3" fill="#101410" stroke="#73866a"/>
      <text x="32" y="23" text-anchor="middle" fill="#9dff87" font-size="11" font-weight="900" font-family="monospace">${achievement.code}</text>
      <g fill="#d7c99e" stroke="#6b5d35">${[0,1,2,3,4,5].map(i=>`<circle cx="${20+(i%3)*12}" cy="${36+Math.floor(i/3)*12}" r="4"/>`).join("")}</g>
      <path d="m49 42 1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="#ffd85a"/>
    </svg>`;
  }
  const icons={
    glass:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 7h44v50H10z" fill="#9bd8ec" fill-opacity=".3" stroke="#dff7ff" stroke-width="3"/><circle cx="34" cy="30" r="4" fill="#fff"/><path d="m34 30-17-13m17 13 18-11M34 30l-18 8m18-8 16 13M34 30l-6 24m6-24 4-15M17 17l8 5-2 9m29-12-10 7 4 8M16 38l10-1 4 8m20-2-10-5-3 9" fill="none" stroke="#eafcff" stroke-width="2"/></svg>`,
    launch:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M33 5c11 8 16 20 13 34l-13 8-13-8C17 25 22 13 33 5Z" fill="#ddd9cb" stroke="#342d24" stroke-width="2"/><circle cx="33" cy="24" r="7" fill="#64d9e9" stroke="#173a42" stroke-width="2"/><path d="m20 34-9 11 12-2m23-9 9 11-12-2" fill="#c33b32" stroke="#4d1612" stroke-width="2"/><path d="m27 46 6 14 6-14-6 5z" fill="#ffca30" stroke="#e84718" stroke-width="2"/></svg>`,
    vortex:`<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="achievementVortex" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#69d7ff"/><stop offset=".5" stop-color="#9f59ed"/><stop offset="1" stop-color="#ffcc4b"/></linearGradient></defs><path d="M9 17c12-14 40-11 44 7 4 17-18 31-34 21C4 36 16 17 31 20c13 3 10 19 0 20-9 1-14-9-8-15" fill="none" stroke="url(#achievementVortex)" stroke-width="6" stroke-linecap="round"/><circle cx="29" cy="30" r="4" fill="#090909"/></svg>`,
    paint:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 12h48v40H8z" fill="#756f2b" stroke="#211d0a" stroke-width="3"/><path d="M12 45c8-12 8-25 18-25 8 0 5 12 13 12 5 0 7-6 9-12v28H12z" fill="#b8a21e"/><path d="M13 38c8-8 10-19 18-15 6 3 4 12 12 11 5-1 6-5 9-9" fill="none" stroke="#e4cf3b" stroke-width="6" stroke-linecap="round"/><path d="m21 8 8 5-12 24-8-5z" fill="#b77935" stroke="#3c2512" stroke-width="2"/><path d="m17 37-8-5-2 10z" fill="#d9cfc0" stroke="#3c2512" stroke-width="2"/><circle cx="42" cy="17" r="4" fill="#584a0f"/><circle cx="49" cy="40" r="3" fill="#5d5113"/></svg>`,
    "all-items":`<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="7" y="8" width="50" height="48" rx="6" fill="#26303a" stroke="#f0c958" stroke-width="3"/><g fill="#f0c958"><rect x="13" y="15" width="9" height="12" rx="2"/><rect x="27" y="15" width="9" height="12" rx="2"/><rect x="41" y="15" width="9" height="12" rx="2"/><rect x="13" y="33" width="9" height="12" rx="2"/><rect x="27" y="33" width="9" height="12" rx="2"/><rect x="41" y="33" width="9" height="12" rx="2"/></g><path d="m48 42 2.4 4.8 5.3.8-3.8 3.7.9 5.2-4.8-2.5-4.8 2.5.9-5.2-3.8-3.7 5.3-.8z" fill="#fff2a1" stroke="#8b6212"/></svg>`,
    rooms:`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M7 13h50v39H7z" fill="#d8c49a" stroke="#221b14" stroke-width="3"/><path d="M7 36h50v16H7z" fill="#74452b"/><path d="M32 13v39M7 36h50" stroke="#221b14" stroke-width="2"/><path d="M12 18h14v13H12z" fill="#7c9fbd"/><path d="M38 18h14v13H38z" fill="#8caa5c"/><path d="M12 40h14v8H12z" fill="#8d2e2b"/><path d="M38 40h14v8H38z" fill="#c58a3a"/></svg>`
  };
  return icons[achievement.icon]||icons.rooms;
}
function fillAchievementIcon(icon,achievement,maxWidth=46,maxHeight=54){
  if(achievement.type==="item"){
    icon.innerHTML=achievement.item.art();const pk=icon.firstElementChild;
    const artScale=Math.min(maxWidth/achievement.item.w,maxHeight/achievement.item.h);
    pk.style.width=achievement.item.w*artScale+"px";pk.style.height=achievement.item.h*artScale+"px";
    pk.style.setProperty("--u",artScale+"px");
    fitEnginePackage(pk,achievement.item.w*artScale,achievement.item.h*artScale);
  }else icon.innerHTML=achievementIconSvg(achievement);
}
function showAchievementToast(id){
  const achievement=achievementCatalog().find(item=>item.id===id),host=$("#achievementtoasts");
  if(!achievement||!host)return;
  const toast=document.createElement("div");toast.className="achievement-toast";toast.setAttribute("role","status");
  const icon=document.createElement("div");icon.className="achievement-icon";fillAchievementIcon(icon,achievement,38,44);
  const copy=document.createElement("div"),label=document.createElement("b"),title=document.createElement("strong");
  label.textContent="ACHIEVEMENT EARNED";title.textContent=achievement.title;copy.append(label,title);toast.append(icon,copy);
  host.appendChild(toast);
  const remove=()=>toast.remove();toast.addEventListener("animationend",remove,{once:true});setTimeout(remove,3500);
}
function renderAchievements(){
  updateAchievementSummary();achievementList.innerHTML="";
  achievementCatalog().filter(item=>ACHIEVEMENTS.unlocked[item.id])
    .sort((a,b)=>Number(ACHIEVEMENTS.unlocked[b.id])-Number(ACHIEVEMENTS.unlocked[a.id])).forEach(achievement=>{
      const card=document.createElement("article");card.className="achievement-card";
      const icon=document.createElement("div");icon.className="achievement-icon";
      fillAchievementIcon(icon,achievement);
      const copy=document.createElement("div");copy.className="achievement-copy";
      const title=document.createElement("h3");title.textContent=achievement.title;
      const description=document.createElement("p");description.textContent=achievement.description;copy.append(title,description);
      const unlockedAt=Number(ACHIEVEMENTS.unlocked[achievement.id]);
      const date=document.createElement("time");date.className="achievement-date";
      date.dateTime=new Date(unlockedAt).toISOString();
      date.textContent="UNLOCKED "+new Date(unlockedAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}).toUpperCase();
      card.append(icon,copy,date);achievementList.appendChild(card);
    });
}
function openAchievements(){
  closePop();closeCollection(false);renderAchievements();achievementsEl.classList.add("on");achievementsEl.focus();
}
function closeAchievements(returnFocus=true){
  if(!achievementsEl.classList.contains("on"))return;
  achievementsEl.classList.remove("on");
  if(returnFocus)$("#achievementtoggle").focus();else document.activeElement?.blur();
}
$("#achievementtoggle").onclick=openAchievements;
$("#achievementclose").onclick=closeAchievements;
achievementPanel.addEventListener("click",e=>e.stopPropagation());
achievementsEl.addEventListener("click",closeAchievements);

/* ============================================================
   8. MONEY IN
   ============================================================ */
function insert(den){
  if(S.busy) return;
  if(!(S.cash[den]>0)){ setVFD("NO "+money(den)+"\nIN WALLET",1400,1); return; }
  if(S.cardSession) endCard();          // cash overrides an idle card session
  S.cash[den]--; S.credit+=den;
  setMode("transaction");
  if(den>=100){ sfx.bill(); flashBill(); } else sfx.coin();
  setVFD("CREDIT "+money(S.credit)+(S.entry?"\nSELECT "+S.entry:"\nMAKE SELECTION"),1200);
  renderHUD();
  if(S.entry.length===3) maybeAutoVend();
}
function flashBill(){
  const led=$("#billled");
  led.style.background="#7dff9a"; led.style.boxShadow="0 0 12px #7dff9a";
  setTimeout(()=>{led.style.background="#4af";led.style.boxShadow="0 0 7px #4af";},600);
}

/* popup helper ------------------------------------------------ */
let openPop=null,openPopAnchor=null;
function popup(anchor,title,rows,{stayOpen=false}={}){
  closePop();
  const p=document.createElement("div"); p.className="popup";
  p.innerHTML=`<h4>${title}</h4>`;
  const refreshers=[];
  rows.forEach(r=>{
    const b=document.createElement("button");
    if(r.wide) b.className="wide";
    const label=document.createElement("span"),note=document.createElement("small");label.textContent=r.label;b.appendChild(label);
    const refresh=()=>{
      const noteValue=typeof r.note==="function"?r.note():r.note;
      note.textContent=noteValue||"";note.hidden=!noteValue;if(note.parentNode!==b)b.appendChild(note);
      b.disabled=!!(typeof r.disabled==="function"?r.disabled():r.disabled);
    };
    refreshers.push(refresh);refresh();
    b.onclick=e=>{
      e.stopPropagation();
      if(!stayOpen)closePop();
      r.act();
      if(stayOpen&&openPop===p)refreshers.forEach(update=>update());
    };
    p.appendChild(b);
  });
  const c=document.createElement("button"); c.className="close"; c.textContent="cancel";
  c.onclick=e=>{e.stopPropagation();closePop();}; p.appendChild(c);
  document.body.appendChild(p);
  const r=anchor.getBoundingClientRect(), pr=p.getBoundingClientRect();
  let left=r.left-pr.width-12; if(left<8) left=Math.min(r.right+12,innerWidth-pr.width-8);
  if(left+pr.width>innerWidth-8) left=innerWidth-pr.width-8;
  let top=Math.min(Math.max(8,r.top),innerHeight-pr.height-8);
  p.style.left=left+"px"; p.style.top=top+"px";
  openPop=p;openPopAnchor=anchor;
}
function closePop(){ if(openPop){openPop.remove();openPop=null;openPopAnchor=null;} }
addEventListener("pointerdown",e=>{
  if(openPop&&!openPop.contains(e.target)&&!openPopAnchor?.contains(e.target))closePop();
},true);

/* bill slot --------------------------------------------------- */
$("#billunit").addEventListener("click",()=>{
  if(S.busy) return;
  popup($("#billunit"),"INSERT BILL",[
    {label:"$5 bill",note:`×${S.cash[500]||0}`,disabled:!S.cash[500],act:()=>insert(500)},
    {label:"$1 bill",note:`×${S.cash[100]||0}`,disabled:!S.cash[100],act:()=>insert(100)}
  ]);
});
/* coin slot --------------------------------------------------- */
$("#coinslot").addEventListener("click",()=>{
  if(S.busy) return;
  popup($("#coinslot"),"INSERT COIN",[
    {label:"Quarter — 25¢",note:()=>`×${S.cash[25]||0}`,disabled:()=>!S.cash[25],act:()=>insert(25)},
    {label:"Dime — 10¢",note:()=>`×${S.cash[10]||0}`,disabled:()=>!S.cash[10],act:()=>insert(10)},
    {label:"Nickel — 5¢",note:()=>`×${S.cash[5]||0}`,disabled:()=>!S.cash[5],act:()=>insert(5)}
  ],{stayOpen:true});
});

/* ============================================================
   9. CARD READER
   ============================================================ */
/* the instructional loop: tap → insert → cards accepted */
const scenes=[...lcd.querySelectorAll(".scene")];
let si=0;
function showScene(i){ scenes.forEach((s,n)=>s.classList.toggle("on",n===i)); }
showScene(0);
setInterval(()=>{ si=(si+1)%scenes.length; showScene(si); },3000);

function lcdMsg(t,ms){
  lcdStatus.innerHTML=t; lcd.classList.add("busy");
  if(ms) setTimeout(()=>{ lcd.classList.remove("busy"); },ms);
}
$("#reader").addEventListener("click",()=>{
  if(S.busy) return;
  if(S.cardSession){
    popup($("#reader"),"CARD READER",[
      {label:"Cancel card payment",wide:1,act:()=>{endCard();setVFD("CARD CANCELLED",1200);}}
    ]); return;
  }
  popup($("#reader"),"PAY BY CARD",[
    {label:"Tap card / phone",note:money(S.card),disabled:S.card<125,act:()=>useCard("tap")},
    {label:"Insert chip card",note:money(S.card),disabled:S.card<125,act:()=>useCard("chip")}
  ]);
});
function useCard(mode){
  if(S.card<125){ setVFD("CARD DECLINED\nLOW BALANCE",1800,1); return; }
  setMode("payment");
  sfx.card();
  lcdMsg(mode==="tap"?"● TAP DETECTED<br>READING…":"CARD INSERTED<br>READING CHIP…");
  setVFD(mode==="tap"?"READING CARD":"READING CHIP");
  setTimeout(()=>{
    lcdMsg("APPROVED ✓<br>MAKE SELECTION",2600);
    S.cardSession=true; S.cardInserted=(mode==="chip");setMode("transaction");
    sfx.ok();refreshVFD();
    if(S.entry.length===3) maybeAutoVend();
    // a real reader times its session out
    clearTimeout(cardTimer);
    cardTimer=setTimeout(()=>{ if(S.cardSession && !S.busy){ endCard();
      lcdMsg("SESSION ENDED",1600); setVFD("CARD SESSION\nTIMED OUT",1600); } },30000);
  },1100);
}
let cardTimer=null;
function endCard(){
  S.cardSession=false; S.cardInserted=false; clearTimeout(cardTimer);
  if(!S.credit&&!S.trayItem)setMode("idle");refreshVFD();
}

/* ============================================================
   10. KEYPAD
   ============================================================ */
function press(el){ el.classList.add("press"); setTimeout(()=>el.classList.remove("press"),110); }
const RAPID_CLEAR_COUNT=10, RAPID_CLEAR_WINDOW=3000;
let rapidClearPresses=[], machineVanished=false;
function recordRapidClearPress(){
  if(machineVanished) return true;
  const now=performance.now();
  rapidClearPresses=rapidClearPresses.filter(time=>now-time<=RAPID_CLEAR_WINDOW);
  rapidClearPresses.push(now);
  if(rapidClearPresses.length<RAPID_CLEAR_COUNT) return false;
  rapidClearPresses=[]; machineVanished=true;
  unlockAchievement("event:keypad-vortex");
  S.busy=true; S.mode="vanished"; S.entry=""; highlight();
  machineEl.classList.add("fx-keypad-vanish");
  const finishVanishing=()=>machineEl.classList.add("fx-keypad-gone");
  const finishOnAnimationEnd=e=>{
    if(e.animationName!=="keypadvanish") return;
    machineEl.removeEventListener("animationend",finishOnAnimationEnd);
    finishVanishing();
  };
  machineEl.addEventListener("animationend",finishOnAnimationEnd);
  setTimeout(finishVanishing,2700);
  noise(1.2,.045,850);
  tone(690,.45,"sawtooth",.055,-260);
  setTimeout(()=>tone(170,1.1,"sawtooth",.05,-120),280);
  return true;
}
keys.forEach(k=>k.addEventListener("click",()=>{
  press(k);
  if(k.dataset.k==="C"){
    if(recordRapidClearPress()) return;
  }else{
    rapidClearPresses=[];
  }
  keyIn(k.dataset.k);
}));
okKey.addEventListener("click",()=>{
  lightPressedControl(okKey);sfx.ok();
  if(recordStandaloneLaunchInput("OK"))return;
  doOK();
});

function keyIn(k){
  if(S.busy) return;
  resetStandaloneLaunchSequence();
  pauseCascadeForInput();
  lightPressedControl(keys.find(key=>key.dataset.k===k));
  if(k==="C"){ S.entry=""; sfx.key(); highlight(); setVFD("CLEARED",700); return; }
  if(k==="R"){ coinReturn(); return; }
  sfx.key();
  if(S.entry.length>=3) S.entry="";
  S.entry+=k; highlight();
  if(S.entry.length===3){ maybeAutoVend(true); } else refreshVFD();
}
function highlight(){
  shelvesEl.querySelectorAll(".tag").forEach(t=>t.classList.remove("active"));
  if(S.entry.length===3){ const t=tagEl(S.entry); if(t) t.classList.add("active"); }
}
/* 3 digits typed: show the price / prompt, but wait for OK (like the real thing) */
function maybeAutoVend(justTyped){
  const it=ITEMS[S.entry];
  if(!it&&discoveredSecretCommand(S.entry)&&!S.credit&&!S.cardSession){
    setVFD("CODE "+S.entry+"\nPRESS OK");return;
  }
  if(!it){ if(justTyped) setVFD("INVALID\nSELECTION",1500,1), sfx.bad(); return; }
  if(it.stock<=0){ setVFD("SOLD OUT\nMAKE ANOTHER",1800,1); sfx.bad(); return; }
  const need=it.price-(S.cardSession?it.price:S.credit);
  if(S.cardSession) setVFD("SELECT "+S.entry+"\nPRESS OK "+money(it.price));
  else if(need>0)   setVFD("PRICE "+money(it.price)+"\nADD "+money(need));
  else              setVFD("SELECT "+S.entry+"\nPRESS OK");
}
function doOK(){
  if(S.busy) return;
  if(S.trayItem){ setVFD("TAKE ITEM\nFROM TRAY",1500,1); return; }
  if(S.entry.length<3){ setVFD("ENTER 3 DIGIT\nCODE",1500,1); sfx.bad(); return; }
  if(S.mode==="idle"&&!openPop&&!S.credit&&!S.cardSession&&discoveredSecretCommand(S.entry)){
    runSecretCommand(S.entry);return;
  }
  const it=ITEMS[S.entry];
  if(!it){ setVFD("INVALID\nSELECTION",1600,1); sfx.bad(); S.entry=""; highlight(); return; }
  if(it.stock<=0){ setVFD("SOLD OUT",1600,1); sfx.bad(); return; }

  if(S.cardSession){
    if(S.card<it.price){ setVFD("CARD DECLINED",1800,1); sfx.bad(); endCard(); return; }
    S.card-=it.price; lcdMsg("CHARGED "+money(it.price)+"<br>"+
      (S.cardInserted?"REMOVE CARD":"THANK YOU"),3000);
    endCard(); vend(it,0);
    return;
  }
  if(S.credit<it.price){
    setVFD("PRICE "+money(it.price)+"\nADD "+money(it.price-S.credit),2000,1); sfx.bad(); return;
  }
  const change=S.credit-it.price;
  S.credit=0;
  vend(it,change);
}

/* ============================================================
   11. VENDING
   ============================================================ */
async function vend(it,change){
  setMode("vending");
  setVFD("VENDING…");sfx.motor();
  const slot=slotEl(it.code);
  const holder=slot.querySelector(".itemholder");
  const coils=[...slot.querySelectorAll(".coil")];
  const active={item:it,change,scope:new EffectScope(),skipPackageFall:false,afterRelease:null,
    trayArt:it.trayArt||it.art};
  S.activeVend=active;
  const ctx=effectContext(active,slot,holder);
  // the coil turns and its thread marches forward, walking the product out
  coils.forEach(c=>c.classList.add("spin"));
  holder.style.transition="transform .9s cubic-bezier(.4,.1,.8,.6)";
  holder.classList.add("pushing");
  await delay(900);
  try{
    coils.forEach(c=>c.classList.remove("spin"));
    holder.classList.remove("pushing"); holder.style.transition="";
    const effect=EFFECTS[it.effectId]||EFFECTS.default;
    if(effect.preFall){
      try{await effect.preFall(ctx);}catch(err){console.error("Product effect failed:",it.effectId,err);active.skipPackageFall=false;}
    }
    // the pack tips out of its coil and falls behind the glass; once it passes the
    // bottom of the display case the cabinet body hides it, and it lands in the bin
    let clone=null;
    if(!active.skipPackageFall){
      clone=holder.cloneNode(true);
      clone.classList.remove("fx-scared","fx-faint","fx-puff","pushing");
      clone.querySelectorAll(".fx-fright,.fx-sweat").forEach(el=>el.remove());
      const r=holder.getBoundingClientRect(), gr=glassEl.getBoundingClientRect();
      const w=r.width/scale, h=r.height/scale;
      const drop=(gr.bottom-r.top)/scale + h*0.6;
      clone.style.cssText=`position:absolute;left:${(r.left-gr.left)/scale}px;
        top:${(r.top-gr.top)/scale}px;width:${w}px;height:${h}px;
        --dx:${(Math.random()*12-6).toFixed(1)}px;--dy:${drop.toFixed(1)}px;
        --rot:${(Math.random()*46-23).toFixed(1)}deg;
        animation:vendfall .8s cubic-bezier(.32,.02,.72,1) forwards`;
      fx.appendChild(clone);
      if(active.afterRelease)active.afterRelease();
      setTimeout(()=>sfx.thud(),680);await delay(820);clone.remove();
      if(active.postFallDelay)await delay(active.postFallDelay);
    }else{
      if(active.afterRelease)active.afterRelease();
      setTimeout(()=>sfx.thud(),180);await delay(420);
    }
    active.scope.cleanup();
    it.stock--;
    if(it.stock<=0){
      holder.remove(); slot.querySelectorAll(".coil").forEach(c=>c.style.opacity=".55");
      const g=document.createElement("div"); g.className="soldout"; g.textContent="SOLD OUT";
      slot.insertBefore(g,slot.firstChild);tagEl(it.code).classList.add("out");
    }
    bayItem.innerHTML=active.trayArt();
    const pk=bayItem.firstElementChild;
    const bw=Math.min(it.w*1.15,150);
    pk.style.width=bw+"px"; pk.style.height=(bw*it.h/it.w)+"px";
    pk.style.setProperty("--u",(bw/it.w)+"px");pk.style.transform="rotate(-6deg)";
    fitEnginePackage(pk,bw,bw*it.h/it.w,-6);
    bayItem.classList.add("show");S.trayItem=it.code;
    doorEl.classList.add("ready");
    if(change>0)dropChange(change);
    S.entry="";highlight();S.bought++;discoverClue(it);recordItemPurchase(it);
    if(isSpecialItem(it))unlockAchievement("item:"+it.id);
    setMode("awaitingPickup");
    setVFD(change>0?"CHANGE "+money(change)+"\nPUSH TRAY":"THANK YOU\nPUSH TRAY",2600);
    setTimeout(refreshVFD,2700);
  }catch(err){
    console.error("Vend lifecycle failed",err);active.scope.cleanup();coils.forEach(c=>c.classList.remove("spin"));
    holder.classList.remove("pushing","fx-scared","fx-faint","fx-puff");holder.style.transition="";
    S.activeVend=null;S.entry="";highlight();setMode("idle");setVFD("VEND ERROR\nTRY AGAIN",1800,1);
  }
}

/* ---- change ---- */
function coinFace(den){
  const faces={
    100:`<svg viewBox="0 0 100 100" aria-hidden="true">
      <path class="coin-relief" d="M16 54C29 35 39 30 50 44c11-14 21-9 34 10-14-7-23-5-29 2l7 17-12-9-12 9 7-17c-6-7-15-9-29-2Z"/>
      <path class="coin-line" d="M22 65c18 11 38 11 56 0M50 30v34M43 30l7-9 7 9"/></svg>`,
    25:`<svg viewBox="0 0 100 100" aria-hidden="true">
      <path class="coin-relief" d="M61 18c-15 2-25 12-26 28-1 9 3 14 1 21l-9 14h46l-8-13c-3-5 4-10 3-18-1-6-7-7-5-13 2-7 2-13-2-19Z"/>
      <path class="coin-line" d="M58 31c-8 2-11 8-10 15l-5 5 7 2c1 8 6 12 14 13M31 81c10-8 27-11 39 0"/></svg>`,
    10:`<svg viewBox="0 0 100 100" aria-hidden="true">
      <path class="coin-relief" d="M44 22h12l-2 12 7 9-6 7v28H45V50l-6-7 7-9-2-12Z"/>
      <path class="coin-line" d="M34 69C22 60 21 45 29 34m37 35c12-9 13-24 5-35M28 60l-8-3m11-7-9-5m48 15 8-3m-11-7 9-5"/></svg>`,
    5:`<svg viewBox="0 0 100 100" aria-hidden="true">
      <path class="coin-relief" d="M18 43h64v9H18zM23 56h54v22H23zM14 80h72v7H14zM30 55h7v24h-7zm17 0h7v24h-7zm16 0h7v24h-7z"/>
      <path class="coin-line" d="M17 42 50 22l33 20M28 36h44"/></svg>`,
    1:`<svg viewBox="0 0 100 100" aria-hidden="true">
      <path class="coin-relief" d="M59 18c-14 3-23 14-22 29 0 9 5 15 3 22L29 82h44L63 68c-3-5 3-9 2-16-1-5-6-7-4-12 3-8 3-15-2-22Z"/>
      <path class="coin-line" d="M55 31c-7 3-9 9-8 15l-4 5 6 2c1 7 6 11 13 12M33 81c9-7 25-10 36 0"/></svg>`
  };
  return faces[den]||faces[25];
}
function makeChangeCoin(den){
  const coin=document.createElement("div");
  coin.className="coin c"+String(den).padStart(2,"0");
  coin.dataset.den=den;
  coin.innerHTML=coinFace(den);coin.setAttribute("role","img");
  coin.setAttribute("aria-label",den===100?"One dollar coin":`${den} cent coin`);
  return coin;
}
function trayWouldOverflow(incoming){
  const coins=[...coinTray.children].filter(coin=>coin!==incoming);
  const style=getComputedStyle(coinTray);
  const gap=parseFloat(style.columnGap)||0;
  const padding=(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0);
  const occupied=coins.reduce((total,coin)=>total+coin.offsetWidth,0)+gap*Math.max(0,coins.length-1);
  return occupied+(coins.length?gap:0)+incoming.offsetWidth>coinTray.clientWidth-padding+.5;
}
function spillTrayCoin(coin){
  if(!coin.isConnected||coin.parentElement!==coinTray)return;
  const coins=[...coinTray.children],changeIndex=coins.indexOf(coin);
  if(changeIndex<0)return;
  const den=Number(coin.dataset.den)||S.change[changeIndex];
  const rect=coin.getBoundingClientRect(),stageRect=stage.getBoundingClientRect();
  const spill=coin.cloneNode(true);
  spill.classList.add("fx-change-spill");
  spill.setAttribute("aria-hidden","true");spill.removeAttribute("role");
  spill.style.left=((rect.left-stageRect.left)/scale)+"px";
  spill.style.top=((rect.top-stageRect.top)/scale)+"px";
  spill.style.width=(rect.width/scale)+"px";
  spill.style.height=(rect.height/scale)+"px";
  spill.style.setProperty("--spill-x",(-54-Math.random()*30).toFixed(1)+"px");
  spill.style.setProperty("--spill-y",Math.max(90,DH-(rect.top-stageRect.top)/scale-rect.height/scale+26).toFixed(1)+"px");
  spill.style.setProperty("--spill-rot",(-115-Math.random()*95).toFixed(1)+"deg");
  fxFront.appendChild(spill);
  coin.remove();S.change.splice(changeIndex,1);
  if(!S.change.length)coinTray.classList.remove("has");
  let returned=false;
  const returnToWallet=()=>{
    if(returned)return;returned=true;
    S.cash[den]=(S.cash[den]||0)+1;
    spill.remove();renderHUD();sfx.coin();
  };
  spill.addEventListener("animationend",returnToWallet,{once:true});
  setTimeout(returnToWallet,1200);
}
function addChangeCoin(den){
  const existing=[...coinTray.children];
  const before=existing.map(item=>item.getBoundingClientRect().left);
  const coin=makeChangeCoin(den);
  // Measure while attached but before it participates in the visible row.
  coin.style.position="absolute";coin.style.visibility="hidden";
  coinTray.appendChild(coin);
  const overflow=trayWouldOverflow(coin);
  coin.removeAttribute("style");
  S.change.push(den);coinTray.classList.add("has");
  // Animate the actual coins from their previous positions so the new coin
  // visibly shoves the chain instead of an unrelated floor coin appearing.
  requestAnimationFrame(()=>existing.forEach((item,index)=>{
    if(!item.isConnected)return;
    const shift=(before[index]-item.getBoundingClientRect().left)/scale;
    item.animate([{transform:`translateX(${shift}px)`},{transform:"translateX(0)"}],{
      duration:matchMedia("(prefers-reduced-motion: reduce)").matches?1:190,
      easing:"cubic-bezier(.2,.75,.35,1)"
    });
  }));
  if(overflow&&existing.length)setTimeout(()=>spillTrayCoin(existing[0]),170);
  sfx.coin();
}
function dropChange(amount){
  const dens=[100,25,10,5,1]; const out=[];
  let left=amount;
  for(const d of dens){ while(left>=d){ out.push(d); left-=d; } }
  out.forEach((d,i)=>setTimeout(()=>addChangeCoin(d),220*i));
}
function collectChange(){
  if(!S.change.length) return;
  S.change.forEach(d=>S.cash[d]=(S.cash[d]||0)+1);
  const amt=S.change.reduce((a,b)=>a+b,0);
  S.change=[]; coinTray.innerHTML=""; coinTray.classList.remove("has");
  sfx.coin(); renderHUD();
  setVFD("TOOK "+money(amt),1200);
}
coinTray.addEventListener("click",collectChange);
$("#coinbtn").addEventListener("click",e=>{e.stopPropagation();coinReturn();});
function coinReturn(){
  if(S.busy) return;
  if(S.cardSession){ endCard(); setVFD("CARD CANCELLED",1300); sfx.key(); return; }
  if(S.credit<=0){ collectChange(); if(!S.change.length) setVFD("NO CREDIT",1100); return; }
  const amt=S.credit; S.credit=0; S.entry=""; highlight();
  dropChange(amt);
  setMode("idle");
  setVFD("RETURNED\n"+money(amt),1800);
  renderHUD();
}

/* ============================================================
   12. DOOR / RETRIEVAL
   ============================================================ */
let doorOpen=false, doorTimer=null;
function pushDoor(){
  if(doorOpen) return;
  doorOpen=true; doorEl.classList.add("pushed"); sfx.door();
  clearTimeout(doorTimer);
  if(S.trayItem){
    setTimeout(retrieve,320);
  }else{
    setVFD("TRAY EMPTY",1100);
    doorTimer=setTimeout(releaseDoor,650);
  }
}
function releaseDoor(){ doorOpen=false; doorEl.classList.remove("pushed"); }
doorEl.addEventListener("pointerdown",e=>{e.preventDefault();pushDoor();});
doorEl.addEventListener("pointerup",()=>{ if(!S.trayItem) releaseDoor(); });
doorEl.addEventListener("pointerleave",()=>{ if(!S.trayItem) releaseDoor(); });
doorEl.addEventListener("keydown",e=>{ if(e.key===" "||e.key==="Enter"){e.preventDefault();pushDoor();} });

const reveal=$("#reveal"), revealItem=$("#revealitem"), revealBlurb=$("#revealtext");
const revealText=revealBlurb.firstElementChild;
/* re-arm a CSS animation so it plays again on the next retrieval */
function restartAnim(el,anim){ el.style.animation="none"; void el.offsetWidth; el.style.animation=anim; }
function retrieve(){
  const active=S.activeVend;
  const it=active&&active.item||ITEMS[S.trayItem]; if(!it) return;
  collectSnack(it);
  S.trayItem=null;
  bayItem.classList.remove("show"); bayItem.innerHTML="";
  doorEl.classList.remove("ready");
  setTimeout(releaseDoor,420);
  revealItem.innerHTML=active&&active.trayArt?active.trayArt():it.art();
  let rh=Math.min(innerHeight*.54,440), rw=rh*it.w/it.h;
  const maxW=Math.min(innerWidth*.72,360);
  if(rw>maxW){ rw=maxW; rh=rw*it.h/it.w; }
  revealItem.style.width=rw+"px"; revealItem.style.height=rh+"px";
  const rpk=revealItem.firstElementChild;
  rpk.style.width="100%"; rpk.style.height="100%";
  fitEnginePackage(rpk,rw,rh);
  rpk.style.setProperty("--u",(rw/it.w)+"px");
  revealText.textContent=it.name;
  reveal.classList.add("on");
  setMode("revealing");
  restartAnim(revealItem,"comeforward 1.15s cubic-bezier(.16,.9,.24,1) both");
  restartAnim(revealBlurb,"fadein .6s .7s both");
  tone(880,.09,"sine",.05); setTimeout(()=>tone(1320,.16,"sine",.045),100);
  refreshVFD();
}
function closeReveal(){
  if(!reveal.classList.contains("on")) return;
  reveal.classList.remove("on"); revealItem.innerHTML="";
  S.activeVend=null;setMode("idle");
  refreshVFD();
}
reveal.addEventListener("click",closeReveal);

/* ============================================================
   TOP STICKER VIEWER
   ============================================================ */
let stickerSource=null;
function openSticker(source){
  if(!source)return;
  stickerSource=source;stickerZoomCard.innerHTML="";
  const clone=source.cloneNode(true);clone.removeAttribute("id");
  clone.classList.add("zoomed-sticker",source.id);clone.removeAttribute("role");
  clone.removeAttribute("tabindex");clone.setAttribute("aria-hidden","true");
  stickerZoomCard.appendChild(clone);stickerZoom.classList.add("on");
  const zoom=Math.max(1.5,Math.min(5,(innerWidth*.78)/clone.offsetWidth,(innerHeight*.62)/clone.offsetHeight));
  clone.style.setProperty("--sticker-zoom",zoom.toFixed(2));stickerZoom.focus();
}
function closeSticker(){
  if(!stickerZoom.classList.contains("on"))return;
  stickerZoom.classList.remove("on");stickerZoomCard.innerHTML="";
  const source=stickerSource;stickerSource=null;if(source)source.focus();
}
document.querySelectorAll(".sticker,#servicetag").forEach(sticker=>{
  sticker.setAttribute("role","button");sticker.setAttribute("tabindex","0");
  sticker.setAttribute("aria-label","View this sticker larger");
  sticker.addEventListener("click",e=>{e.stopPropagation();openSticker(sticker);});
  sticker.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){
    e.preventDefault();e.stopPropagation();openSticker(sticker);}});
});
stickerZoom.addEventListener("click",closeSticker);

/* ============================================================
   13. KEYBOARD
   ============================================================ */
addEventListener("keydown",e=>{
  if(e.defaultPrevented)return;
  const shortcut=e.key.toLowerCase(),plain=!e.ctrlKey&&!e.metaKey&&!e.altKey;
  if((e.key==="Enter"||e.key===" ")&&(e.target===$("#hudtoggle")||e.target===$("#collectiontoggle")||e.target===$("#achievementtoggle")))return;
  if(stickerZoom.classList.contains("on")){e.preventDefault();closeSticker();return;}
  if(achievementsEl.classList.contains("on")){
    if(e.key==="Escape"||(plain&&shortcut==="a")){e.preventDefault();closeAchievements(false);}return;
  }
  if(collectionEl.classList.contains("on")){
    if(plain&&shortcut==="a"){e.preventDefault();openAchievements();return;}
    if(e.key==="Escape"||(plain&&shortcut==="c")){e.preventDefault();closeCollection(false);}return;
  }
  if(reveal.classList.contains("on")){ closeReveal(); return; }
  if(plain&&shortcut==="w"){e.preventDefault();toggleWallet(false);return;}
  if(plain&&shortcut==="c"){e.preventDefault();openCollection();return;}
  if(plain&&shortcut==="a"){e.preventDefault();openAchievements();return;}
  if(plain&&shortcut==="b"){e.preventDefault();cycleRoomTheme();return;}
  if(/^[0-9]$/.test(e.key)){
    const k=[...keys].find(x=>x.dataset.k===e.key); if(k){press(k);keyIn(e.key);}
  }else if(e.key==="Enter"){e.preventDefault();press(okKey);lightPressedControl(okKey);sfx.ok();doOK();}
  else if(e.key==="Escape"){
    const hudPanel=$("#hud");
    if(!hudPanel.classList.contains("hidden"))hudPanel.classList.add("hidden");
    else coinReturn();
  }
  else if(e.key==="Backspace"){ e.preventDefault(); keyIn("C"); }
  else if(e.key.toLowerCase()==="p"||e.key===" "){ e.preventDefault(); pushDoor(); }
});

/* ============================================================
   14. RESPONSIVE SCALING
   ============================================================ */
const DW=760, DH=1210;
const BASE_DPR_KEY="vending-machine-base-dpr-v1";
const NATIVE_DPR_STEPS=[1,1.25,1.5,2,2.5,3,4];
let baseDevicePixelRatio=window.devicePixelRatio||1;
try{
  const savedDpr=Number(localStorage.getItem(BASE_DPR_KEY));
  if(savedDpr>0)baseDevicePixelRatio=savedDpr;
  else localStorage.setItem(BASE_DPR_KEY,String(baseDevicePixelRatio));
}catch(e){}
function pageZoomFactor(){
  const currentDpr=window.devicePixelRatio||1;
  // A page first opened while zoomed may save that zoomed DPR. Correct the
  // baseline when the browser later reaches a lower, plausible native DPR.
  const nativeDpr=NATIVE_DPR_STEPS.find(step=>Math.abs(step-currentDpr)<.015);
  if(nativeDpr&&currentDpr<baseDevicePixelRatio-.015){
    baseDevicePixelRatio=currentDpr;
    try{localStorage.setItem(BASE_DPR_KEY,String(baseDevicePixelRatio));}catch(e){}
  }
  return Math.max(.5,Math.min(5,currentDpr/baseDevicePixelRatio));
}
function fit(){
  const w=innerWidth, h=innerHeight;
  const narrow = w<820;
  // Reconstruct the unzoomed viewport so 100% starts with the whole machine in
  // view. Holding that baseline through later page-zoom steps lets the machine
  // and its type grow immediately instead of continually shrinking to fit height.
  const pageZoom=pageZoomFactor();
  const layoutW=w*pageZoom,layoutH=h*pageZoom;
  const baseGutter=layoutW<820?14:40;
  const fullViewScale=Math.min((layoutW-baseGutter)/DW,(layoutH-24)/DH,1.35);
  const widthFit=(w-(narrow?14:40))/DW;
  const s=Math.max(.28,Math.min(fullViewScale,widthFit));
  scale=s;
  stage.style.transform=`scale(${s})`;
  const used=DH*s;
  const pad = Math.max(narrow?8:12, Math.min(110,(h-used)/2));
  const floorRise=Math.max(72,Math.min(120,used*.12));
  const seamY=Math.max(24,Math.min(h-24,pad+used-floorRise));
  $("#room").style.setProperty("--wall-floor-seam",(seamY/h*100).toFixed(2)+"%");
  // Transforms do not contribute their visual size to document layout, so
  // reserve the complete scaled height explicitly to make the machine scroll.
  const scrollHeight=used+pad*2+(glassBroken?82:0);
  document.body.style.height = scrollHeight + "px";
  document.body.style.minHeight="100%";
  $("#viewport").style.height = (used+pad) + "px";
  $("#viewport").style.paddingTop = pad+"px";
}
addEventListener("resize",fit); addEventListener("orientationchange",()=>setTimeout(fit,120));
syncHistoricAchievements();updateAchievementSummary();
fit(); renderHUD();

/* prime audio on first gesture */
["pointerdown","keydown"].forEach(ev=>addEventListener(ev,()=>ac(),{once:true}));
