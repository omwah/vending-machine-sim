"use strict";
/* ============================================================
   4. SOUND (WebAudio, no assets)
   ============================================================ */
let AC=null;
function ac(){ if(!AC){ try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} }
  if(AC&&AC.state==="suspended") AC.resume(); return AC; }
function tone(f,dur,type="square",vol=.05,slide=0){
  const c=ac(); if(!c) return;
  const o=c.createOscillator(), g=c.createGain();
  o.type=type; o.frequency.value=f;
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide), c.currentTime+dur);
  g.gain.value=vol;
  g.gain.exponentialRampToValueAtTime(.0001, c.currentTime+dur);
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime+dur);
}
function noise(dur,vol=.06,hp=600){
  const c=ac(); if(!c) return;
  const n=Math.floor(c.sampleRate*dur), b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
  const src=c.createBufferSource(); src.buffer=b;
  const f=c.createBiquadFilter(); f.type="highpass"; f.frequency.value=hp;
  const g=c.createGain(); g.gain.value=vol;
  src.connect(f).connect(g).connect(c.destination); src.start();
}
const sfx={
  key:()=>tone(1400,.045,"square",.04),
  bad:()=>{tone(220,.16,"sawtooth",.05);setTimeout(()=>tone(160,.2,"sawtooth",.05),140);},
  bill:()=>{noise(.35,.05,900);tone(90,.3,"sine",.05,60);},
  coin:()=>{tone(2300,.06,"triangle",.05);setTimeout(()=>tone(1700,.1,"triangle",.04),60);},
  ok:()=>{tone(1200,.07,"square",.045);setTimeout(()=>tone(1800,.1,"square",.04),80);},
  motor:()=>{const c=ac();if(!c)return;
    const o=c.createOscillator(),g=c.createGain();o.type="sawtooth";o.frequency.value=58;
    g.gain.value=.035;o.connect(g).connect(c.destination);o.start();
    g.gain.setValueAtTime(.035,c.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+1.25);o.stop(c.currentTime+1.3);},
  thud:()=>{tone(70,.22,"sine",.09,-30);noise(.12,.05,300);},
  door:()=>noise(.18,.05,400),
  card:()=>{tone(1000,.08,"sine",.05);setTimeout(()=>tone(1600,.12,"sine",.045),110);},
  laugh:()=>{[420,560,390,650].forEach((f,i)=>setTimeout(()=>tone(f,.13,"sawtooth",.035,-90),i*115));},
  chuckle:()=>{[[0,260],[125,340],[315,230],[440,315],[620,205]].forEach(([ms,f])=>setTimeout(()=>{
    tone(f,.14,"sawtooth",.04,-105);noise(.075,.012,720);
  },ms));},
  ghost:()=>{tone(520,.4,"sine",.035,-300);noise(.35,.025,1200);}
};

/* ============================================================
   GLASS-BREAK EASTER EGG
   ============================================================ */
const GLASS_STRIKE_COUNT=5, GLASS_STRIKE_WINDOW=2400, GLASS_STRIKE_DISTANCE=.085;
let glassStrikePoints=[], glassBroken=false;
function brokenGlassArt(origin){
  const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
  svg.classList.add("fx-broken-glass");svg.setAttribute("viewBox","0 0 1000 1000");
  svg.setAttribute("preserveAspectRatio","none");svg.setAttribute("aria-hidden","true");
  const ox=origin.x*1000,oy=origin.y*1000;
  const addPath=(d,cls)=>{const p=document.createElementNS(ns,"path");p.setAttribute("d",d);p.setAttribute("class",cls);svg.appendChild(p);};
  for(let i=0;i<14;i++){
    const angle=(Math.PI*2*i/14)+(Math.random()-.5)*.24,c=Math.cos(angle),s=Math.sin(angle);
    let d=`M${ox.toFixed(1)} ${oy.toFixed(1)}`;
    const bends=[];
    for(let step=1;step<=5;step++){
      const distance=step*285,jitter=(Math.random()-.5)*70;
      const x=ox+c*distance-s*jitter,y=oy+s*distance+c*jitter;
      bends.push([x,y]);d+=` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    addPath(d,"main-crack");
    [1,2].forEach(branch=>{
      const [bx,by]=bends[branch+1],side=branch%2?1:-1;
      const ba=angle+side*(.42+Math.random()*.28),length=145+Math.random()*175;
      const mx=bx+Math.cos(ba)*length*.48,my=by+Math.sin(ba)*length*.48;
      const ex=bx+Math.cos(ba)*length,ey=by+Math.sin(ba)*length;
      addPath(`M${bx.toFixed(1)} ${by.toFixed(1)} L${mx.toFixed(1)} ${my.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}`,"branch-crack");
    });
  }
  const ring=document.createElementNS(ns,"circle");ring.setAttribute("cx",ox);ring.setAttribute("cy",oy);
  ring.setAttribute("r","27");ring.setAttribute("class","impact-ring");svg.appendChild(ring);
  return svg;
}
function brokenGlassEdgeArt(){
  const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
  svg.classList.add("fx-broken-edge");svg.setAttribute("viewBox","0 0 1000 1000");
  svg.setAttribute("preserveAspectRatio","none");svg.setAttribute("aria-hidden","true");
  svg.innerHTML='<path d="M0 0L82 0 104 29 142 0 244 0 275 38 312 0 421 0 449 25 493 0 607 0 636 34 678 0 790 0 824 31 858 0 1000 0M1000 0L1000 116 970 145 1000 188 1000 342 965 379 1000 418 1000 574 972 605 1000 650 1000 812 968 847 1000 886 1000 1000M1000 1000L883 1000 851 968 812 1000 682 1000 648 971 606 1000 471 1000 439 966 398 1000 264 1000 230 971 191 1000 0 1000M0 1000L0 878 34 844 0 801 0 650 29 617 0 575 0 422 36 387 0 342 0 184 31 151 0 111Z"/>';
  return svg;
}
function dropGlassShards(){
  const gr=glassEl.getBoundingClientRect(),sr=stage.getBoundingClientRect();
  const left=(gr.left-sr.left)/scale,top=(gr.top-sr.top)/scale;
  const paneW=gr.width/scale,paneH=gr.height/scale,cols=5,rows=7,cellW=paneW/cols,cellH=paneH/rows;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)for(let half=0;half<2;half++){
    const shard=document.createElement("i");shard.className="fx-glass-shard";
    shard.style.left=(left+col*cellW)+"px";shard.style.top=(top+row*cellH)+"px";
    shard.style.width=(cellW+1)+"px";shard.style.height=(cellH+1)+"px";
    shard.style.clipPath=half?"polygon(0 0,100% 100%,0 100%)":"polygon(0 0,100% 0,100% 100%)";
    const shardCenter=left+(col+.5)*cellW;
    const drift=(shardCenter<DW/2?-1:1)*(150+Math.random()*430)+(Math.random()-.5)*70;
    const fall=DH-16-(top+row*cellH);
    const rotation=(Math.random()>.5?1:-1)*(220+Math.random()*620);
    shard.style.setProperty("--shard-x",drift.toFixed(0)+"px");
    shard.style.setProperty("--shard-y",fall.toFixed(0)+"px");
    shard.style.setProperty("--shard-r",rotation.toFixed(0)+"deg");
    shard.style.setProperty("--shard-nudge-x",(drift*.08).toFixed(0)+"px");
    shard.style.setProperty("--shard-nudge-r",(rotation*.06).toFixed(0)+"deg");
    shard.style.setProperty("--shard-delay",(Math.random()*.16).toFixed(2)+"s");
    shard.style.setProperty("--shard-duration",(.94+Math.random()*.3).toFixed(2)+"s");
    fxFront.appendChild(shard);
  }
}
function sendSnacksFleeing(){
  const sr=stage.getBoundingClientRect();
  [...shelvesEl.querySelectorAll(".itemholder")].forEach((holder,i)=>{
    const r=holder.getBoundingClientRect(),clone=holder.cloneNode(true);
    clone.className="itemholder fx-fleeing-snack";
    clone.style.cssText=`position:absolute;left:${(r.left-sr.left)/scale}px;top:${(r.top-sr.top)/scale}px;`+
      `width:${r.width/scale}px;height:${r.height/scale}px;--flee-delay:${(i*.035).toFixed(3)}s;`+
      `--flee-duration:${(1.12+Math.random()*.4).toFixed(2)}s;`;
    const direction=i%4;
    let x,y;
    if(direction===0){x=-1250-Math.random()*250;y=-260+Math.random()*520;}
    else if(direction===1){x=1250+Math.random()*250;y=-260+Math.random()*520;}
    else if(direction===2){x=-DW*.42+Math.random()*DW*.84;y=-1250-Math.random()*220;}
    else{x=-DW/2+Math.random()*DW;y=DH+240+Math.random()*220;}
    clone.style.setProperty("--flee-start-x",(x<0?-18:18)+"px");
    clone.style.setProperty("--flee-x",x.toFixed(0)+"px");clone.style.setProperty("--flee-y",y.toFixed(0)+"px");
    clone.style.setProperty("--flee-r",((Math.random()>.5?1:-1)*(420+Math.random()*760)).toFixed(0)+"deg");
    holder.classList.add("fx-emptied");fxFront.appendChild(clone);
    clone.addEventListener("animationend",()=>clone.remove(),{once:true});
    setTimeout(()=>clone.remove(),2800);
  });
}
function breakDisplayGlass(origin){
  if(glassBroken)return;
  glassBroken=true;glassStrikePoints=[];S.entry="";S.trayItem=null;S.activeVend=null;
  unlockAchievement("event:glass-break");
  S.cardSession=false;S.cardInserted=false;clearTimeout(cardTimer);
  bayItem.classList.remove("show");bayItem.innerHTML="";highlight();setMode("broken");
  glassEl.classList.add("fx-broken");const crack=brokenGlassArt(origin);glassEl.appendChild(crack);
  machineEl.classList.add("fx-shudder");setTimeout(()=>machineEl.classList.remove("fx-shudder"),1050);
  setVFD("OUT OF ORDER\nGLASS BROKEN",0,1);noise(.75,.12,420);tone(1040,.5,"sawtooth",.06,-860);
  setTimeout(()=>noise(.55,.07,1250),120);
  setTimeout(()=>{
    crack.classList.add("fx-releasing");glassEl.classList.add("fx-pane-open");
    glassEl.appendChild(brokenGlassEdgeArt());dropGlassShards();
    [1700,2080,2360,2710].forEach((f,i)=>setTimeout(()=>tone(f,.08,"triangle",.025,-180),i*115));
    setTimeout(()=>crack.remove(),460);
  },480);
  setTimeout(sendSnacksFleeing,1900);fit();
}
function recordGlassStrike(e){
  if(glassBroken||S.busy||e.button!==0)return;
  const rect=glassEl.getBoundingClientRect(),now=performance.now();
  const point={x:(e.clientX-rect.left)/rect.width,y:(e.clientY-rect.top)/rect.height,time:now};
  if(point.x<0||point.x>1||point.y<0||point.y>1)return;
  glassStrikePoints=glassStrikePoints.filter(p=>now-p.time<=GLASS_STRIKE_WINDOW);
  if(glassStrikePoints.some(p=>Math.hypot(point.x-p.x,point.y-p.y)<GLASS_STRIKE_DISTANCE))return;
  glassStrikePoints.push(point);tone(145+glassStrikePoints.length*24,.055,"triangle",.025,-35);
  if(glassStrikePoints.length>=GLASS_STRIKE_COUNT){e.preventDefault();e.stopPropagation();breakDisplayGlass(point);}
}
/* ============================================================
   PRODUCT EFFECTS — presentation-only lifecycle hooks
   ============================================================ */
const CLUE_COPY={
  "300":["ORDER","ACCOUNT CLOSED"],
  "202":["SERVING","SOURCE UNKNOWN"],
  "969":["CASE","DO NOT SPLIT UP"],
  "100":["FORM","CLEAR YOUR MIND"],
  "000":["FEED","KEEP IT DRY"],
  "808":["FORMULA","SOIL REJECTED"]
};
const CLUES=Object.fromEntries(Object.entries(CLUE_COPY).map(([id,[label,message]])=>
  [id,`${label} ${SECRET_CODES[id]}<br>${message}`]));

function effectContext(active,slot,holder){
  return {active,item:active.item,slot,holder,scope:active.scope,
    vfd:(a,b,ms=0,alert=0)=>setVFD(b===undefined?a:`${a}\n${b}`,ms,alert),
    lcd:(html,ms)=>lcdMsg(html,ms),delay,sfx,glass:glassEl,machine:machineEl,
    fxGlass:fx,fxRear,fxFront};
}
function makeDrops(ctx,count=14){
  const hr=ctx.holder.getBoundingClientRect(),gr=glassEl.getBoundingClientRect();
  const left=(hr.left-gr.left)/scale,width=hr.width/scale,inset=width*.08;
  /* Evenly spread starts, then shuffled, so the drips emerge in a random order
     instead of sweeping across the package left to right. */
  const starts=Array.from({length:count},(_,k)=>k*.07+Math.random()*.05);
  for(let k=starts.length-1;k>0;k--){
    const j=Math.floor(Math.random()*(k+1));[starts[k],starts[j]]=[starts[j],starts[k]];
  }
  for(let i=0;i<count;i++){
    const d=document.createElement("i");d.className="fx-blood";
    const dw=6+Math.random()*5;
    /* Seep points spread across the bottom edge. The band is measured against
       the drop's own width so no drip starts hanging off the packaging. */
    const t=Math.min(1,Math.max(0,(i+.5)/count+(Math.random()-.5)*.05));
    d.style.left=(left+inset+Math.max(0,width-inset*2-dw)*t)+"px";
    d.style.top=((hr.bottom-gr.top)/scale-7)+"px";
    d.style.setProperty("--blood-w",dw.toFixed(1)+"px");
    d.style.setProperty("--blood-h",(15+Math.random()*9).toFixed(1)+"px");
    /* How far the drip stretches while it still clings to the package, and how
       long it takes to get there: both vary so they emerge raggedly. */
    d.style.setProperty("--blood-swell",(.9+Math.random()*.9).toFixed(2));
    d.style.setProperty("--blood-dur",(.72+Math.random()*.45).toFixed(2)+"s");
    d.style.setProperty("--blood-y",(125+Math.random()*95)+"px");
    /* Fan: drops splay away from the centre as they fall, the outermost ones
       most, so the sheet widens on the way down. */
    const splay=(t-.5)*2;
    d.style.setProperty("--blood-x",(splay*(15+Math.random()*13)).toFixed(1)+"px");
    d.style.setProperty("--blood-r",(splay*(6+Math.random()*6)).toFixed(1)+"deg");
    d.style.animationDelay=starts[i].toFixed(2)+"s";ctx.scope.node(fx,d);
  }
}
function makeCrumbs(ctx,count=11){
  const hr=ctx.holder.getBoundingClientRect(),gr=glassEl.getBoundingClientRect();
  const palettes=[
    {dark:"#ac600c",mid:"#ed9f31",accent:"#ffd589"},
    {dark:"#8a5c27",mid:"#cc9558",accent:"#f4d9ab"}
  ];
  for(let i=0;i<count;i++){
    const c=document.createElement("i");c.className="fx-crumb";
    const colors=palettes[i%palettes.length];
    c.style.left=((hr.left-gr.left)/scale+hr.width/scale*(.18+Math.random()*.64))+"px";
    c.style.top=((hr.bottom-gr.top)/scale-12)+"px";
    c.style.setProperty("--bite-dark",colors.dark);c.style.setProperty("--bite-mid",colors.mid);
    c.style.setProperty("--bite-accent",colors.accent);
    c.style.setProperty("--crumb-x",(Math.random()*46-23)+"px");
    c.style.setProperty("--crumb-y",((gr.bottom-hr.bottom)/scale+75)+"px");
    c.style.setProperty("--crumb-r",(Math.random()*420-210)+"deg");
    c.style.animationDelay=(i*.055)+"s";ctx.scope.node(fx,c);
  }
}


const EFFECTS={
  default:{},
  bachelor:{async preFall(ctx){ctx.vfd("SHUT UP AND","TAKE MY MONEY!");await ctx.delay(1650);}},
  soylent:{async preFall(ctx){
    makeDrops(ctx);await ctx.delay(1250);
    ctx.active.afterRelease=()=>ctx.vfd("YOU'LL LOVE WHAT","IT'S MADE OUT OF",2200);
    ctx.active.postFallDelay=1400;
  }},
  scooby:{async preFall(ctx){
    const face=document.createElement("div");face.className="fx-fright";
    face.innerHTML='<i class="eye l"></i><i class="eye r"></i><i class="mouth"></i>';
    ctx.scope.node(ctx.holder,face);
    for(let i=0;i<3;i++){const sw=document.createElement("i");sw.className="fx-sweat";
      sw.style.cssText=`left:${i%2?82:12}%;top:${23+i*12}%;animation-delay:${i*.18}s`;ctx.scope.node(ctx.holder,sw);}
    ctx.scope.cls(ctx.holder,"fx-scared");ctx.vfd("GGGG-GHOST!");ctx.sfx.ghost();await ctx.delay(1450);
    ctx.holder.classList.remove("fx-scared");ctx.scope.cls(ctx.holder,"fx-faint");await ctx.delay(720);
  }},
  staypuft:{async preFall(ctx){
    ctx.scope.cls(ctx.holder,"fx-puff");ctx.scope.cls(machineEl,"fx-shudder");
    tone(95,.7,"sine",.045,90);await ctx.delay(1250);
  }},
  midnight:{async preFall(ctx){
    const g=document.createElement("div");g.className="fx-gremlin";
    g.appendChild(assetImage("201"));ctx.scope.node(fxFront,g);
    void g.offsetWidth;g.classList.add("on");
    await ctx.delay(1200);ctx.scope.cls(ctx.holder.firstElementChild,"fx-torn");makeCrumbs(ctx);
    await ctx.delay(650);ctx.sfx.laugh();ctx.vfd("HEH HEH HEH");
    await ctx.delay(2050);
  }},
  brawndo:{async preFall(ctx){
    const hr=ctx.holder.getBoundingClientRect(),gr=glassEl.getBoundingClientRect();
    const stream=document.createElement("i");stream.className="fx-stream brawndo-stream";
    stream.style.left=((hr.left-gr.left+hr.width*.52)/scale)+"px";
    stream.style.top=((hr.bottom-gr.top)/scale-10)+"px";
    stream.style.setProperty("--stream-h",((gr.bottom-hr.bottom)/scale+30)+"px");ctx.scope.node(fx,stream);
    await ctx.delay(900);
    const plant=document.createElement("div");plant.className="fx-plant brawndo-plant";
    const branches=[
      [58,"left",72,-28],[108,"right",82,26],[158,"left",90,-21],[210,"right",96,19],
      [263,"left",92,-18],[316,"right",82,24],[366,"left",68,-29]
    ];
    branches.forEach(([bottom,side,length,angle],index)=>{
      const branch=document.createElement("span");branch.className=`plant-branch branch-${side}`;
      const branchDelay=.58+index*.37;
      branch.style.bottom=bottom+"px";branch.style.setProperty("--branch-length",length+"px");
      branch.style.setProperty("--branch-angle",angle+"deg");branch.style.setProperty("--branch-delay",branchDelay+"s");
      branch.style.setProperty("--wither-delay",(4.35+index*.06)+"s");
      branch.style.setProperty("--branch-droop",(side==="left"?-24:24)+"deg");
      [30,67].forEach((position,leafIndex)=>{
        const leaf=document.createElement("i");leaf.className="plant-leaf";
        leaf.style.setProperty("--leaf-x",position+"%");
        leaf.style.setProperty("--leaf-angle",((leafIndex?1:-1)*(side==="left"?-42:42))+"deg");
        leaf.style.setProperty("--leaf-delay",(branchDelay+.34+leafIndex*.19)+"s");
        leaf.style.setProperty("--fall-delay",(4.65+index*.09+leafIndex*.13)+"s");
        leaf.style.setProperty("--leaf-fall-x",((side==="left"?-1:1)*(32+index*5+leafIndex*14))+"px");
        leaf.style.setProperty("--leaf-fall-y",(135+index*13+leafIndex*24)+"px");
        leaf.style.setProperty("--leaf-fall-rotate",((side==="left"?-1:1)*(115+index*21+leafIndex*48))+"deg");
        branch.appendChild(leaf);
      });
      plant.appendChild(branch);
    });
    ctx.scope.node(fx,plant);ctx.vfd("ITS GOT WHAT","PLANTS CRAVE");tone(160,.8,"sine",.035,140);
    await ctx.delay(8150);
  }}
};

function discoverClue(it){
  if(!it.clueId||META.discovered.includes(it.clueId))return;
  META.discovered.push(it.clueId);saveMeta();
  const clue=CLUES[it.clueId];if(clue)lcdMsg(clue,3600);
}


const ASSET_PATHS = {
  "105":"./assets/105.svg",
  "107":"./assets/107.svg",
  "201":"./assets/201.svg",
  "203":Array.from({length:11},(_,index)=>
    `./assets/203/${String(index+1).padStart(2,"0")}.svg`)
};

function assetImage(code){
  const image=new Image();image.alt="";image.src=ASSET_PATHS[code];
  image.addEventListener("error",()=>image.remove(),{once:true});
  return image;
}
function loadAssetImage(path){
  return new Promise(resolve=>{
    const image=new Image();image.alt="";image.decoding="async";
    image.addEventListener("load",async()=>{
      if(image.decode)try{await image.decode();}catch(e){}
      resolve(image);
    },{once:true});
    image.addEventListener("error",()=>resolve(null),{once:true});
    image.src=path;
  });
}


const SECRET_COMMANDS=Object.fromEntries(Object.entries(SECRET_COMMAND_DEFS).map(([id,command])=>
  [SECRET_CODES[id],{...command,id}]));
function discoveredSecretCommand(code){
  const command=SECRET_COMMANDS[code];return command&&META.discovered.includes(command.id)?command:null;
}
async function runSecretCommand(code){
  const cmd=discoveredSecretCommand(code);if(!cmd)return false;
  unlockAchievement("code:"+cmd.id);
  S.entry="";highlight();setMode("secretEvent");const scope=new EffectScope();
  try{
    collectionSuppressed=true;collectionEl.classList.remove("on");
    scope.cleanups.push(()=>{collectionSuppressed=false;collectionEl.classList.remove("on");});
    const variants=cmd.texts||[cmd.text],replayCount=Number(META.commandReplay[cmd.id])||0;
    const loreText=variants[replayCount%variants.length];
    const titleVariants=cmd.titles||[cmd.title],vfdTitle=titleVariants[replayCount%titleVariants.length];
    const eventDuration=cmd.duration||3700;
    META.commandReplay[cmd.id]=replayCount+1;saveMeta();
    setVFD(vfdTitle,0,1);lcdMsg(loreText,eventDuration-100);sfx.ghost();
    if(cmd.event==="glass"){
      scope.cls(shelvesEl,cmd.duration?"fx-sickly-long":"fx-sickly");
      scope.cls(machineEl,"fx-sickly-machine");
    }
    if(cmd.event==="shudder"){
      scope.cls(machineEl,"fx-shudder");
      const puftTimer=setTimeout(()=>{
        const puft=document.createElement("div");puft.className="fx-staypuft on";
        puft.appendChild(assetImage("107"));
        const flames=document.createElement("div");flames.className="puft-flames";
        const flame=document.createElement("i");
        flame.innerHTML=`<svg viewBox="0 0 600 620" aria-hidden="true">
          <defs><linearGradient id="wideFireOuter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fff7a5"/><stop offset=".3" stop-color="#ffd331"/>
            <stop offset=".66" stop-color="#ff7114"/><stop offset="1" stop-color="#b91608"/>
          </linearGradient><linearGradient id="wideFireInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fffde0"/><stop offset=".52" stop-color="#ffe34c"/>
            <stop offset="1" stop-color="#ff8a16"/>
          </linearGradient></defs>
          <path fill="url(#wideFireOuter)" d="M105 592C75 535 70 475 92 421C45 396 55 331 98 277C91 341 128 326 139 236C148 166 181 121 205 62C211 157 230 200 259 139C277 101 284 66 289 22C318 91 315 170 343 145C366 124 375 73 383 42C409 119 402 215 438 178C464 151 467 119 475 89C494 184 488 286 518 247C541 218 548 190 552 164C571 270 566 348 524 412C556 473 539 542 493 592C390 616 205 616 105 592Z"/>
          <path fill="url(#wideFireInner)" d="M158 568C137 517 141 466 168 422C137 389 151 342 189 300C185 354 217 345 228 275C237 219 260 180 278 144C281 214 298 246 319 205C338 168 347 128 352 92C371 154 366 235 395 211C418 192 425 166 432 139C448 220 444 303 469 276C487 256 495 236 500 216C516 311 505 377 481 423C505 472 491 525 454 568C366 590 245 590 158 568Z"/>
        </svg>`;
        flames.appendChild(flame);
        const smoke=document.createElement("div");smoke.className="puft-smoke";
        [[27,24,-90,-95,1.7,3.65],[42,18,-35,-120,2,3.72],[58,22,34,-126,1.85,3.61],
          [73,28,96,-88,1.7,3.77],[22,45,-112,-48,1.95,3.82],[40,43,-48,-78,2.2,3.68],
          [58,46,48,-72,2.1,3.8],[78,48,116,-42,1.9,3.7],[32,65,-84,-28,2,3.75],
          [50,62,0,-58,2.35,3.62],[68,67,86,-24,2,3.84],[50,34,4,-105,2.4,3.9]]
          .forEach(([x,y,dx,dy,s,d])=>{const puff=document.createElement("i");
            puff.style.cssText=`--x:${x}%;--y:${y}%;--dx:${dx}px;--dy:${dy}px;--s:${s};--d:${d}s`;smoke.appendChild(puff);});
        puft.append(flames,smoke);scope.node(fxFront,puft);
      },1000);
      scope.cleanups.push(()=>clearTimeout(puftTimer));
    }
    if(cmd.event==="ghost"){
      const ghost=document.createElement("div");ghost.className="fx-ghost on";
      ghost.appendChild(assetImage("105"));scope.node(fx,ghost);
    }
    if(cmd.event==="rocket"){
      doorOpen=true;scope.cls(doorEl,"pushed");scope.cleanups.push(()=>{doorOpen=false;});
      const launchTimer=setTimeout(()=>{
        const bay=$("#bay"),br=bay.getBoundingClientRect(),sr=stage.getBoundingClientRect();
        const rocket=document.createElement("div");rocket.className="fx-rocket";
        rocket.innerHTML=`<svg viewBox="0 0 320 150" aria-hidden="true">
          <defs>
            <linearGradient id="peBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#9be3ba"/><stop offset=".54" stop-color="#86d9aa"/>
              <stop offset=".55" stop-color="#61c98e"/><stop offset="1" stop-color="#45b778"/>
            </linearGradient>
            <linearGradient id="peFin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#35b8a4"/><stop offset="1" stop-color="#159b91"/>
            </linearGradient>
            <linearGradient id="peGlass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#b7ffff"/><stop offset="1" stop-color="#20d8ef"/>
            </linearGradient>
          </defs>
          <g class="flame">
            <path d="M48 68C28 65 12 68 0 76c13 10 29 13 49 9z" fill="#ef3d27" stroke="#502018" stroke-width="2"/>
            <path d="M48 72C32 71 22 73 14 77c9 5 20 6 34 4z" fill="#ffd95b"/>
          </g>
          <!-- tall swept tail and lower landing fin traced from the silhouette reference -->
          <path d="M83 62C72 42 60 22 43 9L8 5l4 10 48 41z" fill="url(#peFin)" stroke="#173c35" stroke-width="3"/>
          <path d="M91 98c-6 14-14 30-30 43l-42 5 32-22-13-4 31-23z" fill="url(#peFin)" stroke="#173c35" stroke-width="3"/>
          <path d="M9 5L1 3l4 9 7 3zM19 146l-11 1 7-8 7 1z" fill="#e84a3e" stroke="#5e231e" stroke-width="1.5"/>
          <!-- engine bell and ribbed housing -->
          <path d="M57 61c-15 2-23 9-23 17s8 16 23 19l13-12V70z" fill="#d9d59b" stroke="#3d4328" stroke-width="3"/>
          <path d="M42 68l-10 2v16l10 3z" fill="#b9b676" stroke="#3d4328" stroke-width="2"/>
          <path d="M49 65v29M54 63v33M59 62v35M64 63v31" stroke="#77774d" stroke-width="2"/>
          <!-- primary fuselage -->
          <path d="M66 61C107 40 181 38 242 52c34 8 56 21 72 35-21 22-57 34-105 39-58 6-111-1-142-20-12-8-13-36-1-45z"
            fill="url(#peBody)" stroke="#153d2c" stroke-width="3"/>
          <path d="M68 98c56 18 145 22 218-2-25 22-69 31-124 31-43-1-77-8-95-21z" fill="#35ad70" opacity=".55"/>
          <!-- bright red belt around the hull -->
          <path d="M61 88c75 13 174 16 248 1" fill="none" stroke="#651d22" stroke-width="7"/>
          <path d="M61 86c75 13 174 16 248 1" fill="none" stroke="#ff4c4f" stroke-width="4"/>
          <!-- cockpit canopy -->
          <path d="M245 58c25 5 43 13 56 24l-9 8-47-6-18-14z" fill="url(#peGlass)" stroke="#134c45" stroke-width="3"/>
          <path d="M248 60l-5 23M267 65l-4 21M285 72l-4 16" stroke="#168d8f" stroke-width="2"/>
          <!-- portholes -->
          <g fill="#26332c" stroke="#d8d29a" stroke-width="3">
            <circle cx="112" cy="69" r="7"/><circle cx="142" cy="65" r="7"/>
            <circle cx="174" cy="64" r="8"/><circle cx="207" cy="66" r="7"/>
          </g>
          <!-- upper turret and antenna -->
          <path d="M166 49c0-9 8-17 20-17s21 8 21 17l-7 8h-27z" fill="#10b956" stroke="#174b2b" stroke-width="3"/>
          <path d="M175 33c0-7 4-12 11-12s11 5 11 12z" fill="url(#peGlass)" stroke="#174b2b" stroke-width="2"/>
          <path d="M202 39l24-14" stroke="#d8d59d" stroke-width="5" stroke-linecap="round"/>
          <circle cx="228" cy="24" r="5" fill="#d8d59d" stroke="#4f5034" stroke-width="2"/>
          <!-- round Planet Express tail emblem -->
          <circle cx="76" cy="48" r="15" fill="#f2edd0" stroke="#128c7d" stroke-width="4"/>
          <circle cx="76" cy="48" r="9" fill="#27ad96"/>
          <path d="M70 52l15-12-7 15z" fill="#f2edd0"/>
        </svg>`;
        scope.node(fxFront,rocket);
        /* Centre it on the bay from its own rendered box, so the stylesheet is
           free to size it per layout mode. Same task as the insertion above, so
           there is no paint in between to show the pre-positioned frame. */
        const rw=rocket.offsetWidth,rh=rocket.offsetHeight;
        const cx=(br.left-sr.left)/scale+br.width/(2*scale);
        const cy=(br.top-sr.top)/scale+br.height/(2*scale);
        rocket.style.left=(cx-rw/2)+"px";rocket.style.top=(cy-rh/2)+"px";
        /* Climb clear of the top of the window rather than the top of the
           canvas, so the ship is still fully opaque when it leaves the screen. */
        rocket.style.setProperty("--rocket-rise",
          (cy+rh+Math.max(0,sr.top)/scale+120).toFixed(1)+"px");
        tone(105,.9,"sawtooth",.055,260);noise(1.2,.04,500);
      },480);
      scope.cleanups.push(()=>clearTimeout(launchTimer));
    }
    if(cmd.event==="rear"){
      const g=document.createElement("div");g.className="fx-gremlin on long";g.appendChild(assetImage("201"));scope.node(fxFront,g);
      const stolenEntry=chooseCollectionItem();
      if(stolenEntry){
        const stolen=document.createElement("div");stolen.className="fx-stolen-item";stolen.innerHTML=stolenEntry.it.art();
        const sw=48,sh=sw*stolenEntry.it.h/stolenEntry.it.w;
        const walletButton=$("#hudtoggle"),walletPanel=$("#hud");
        const wallet=getComputedStyle(walletButton).display!=="none"?walletButton:walletPanel;
        const wr=wallet.getBoundingClientRect(),sr=stage.getBoundingClientRect();
        const walletX=(wr.left+wr.width/2-sr.left)/scale-sw/2;
        const walletY=(wr.top+wr.height/2-sr.top)/scale-sh/2;
        const gremlinBaseLeft=stage.clientWidth+104-142;
        const handX=gremlinBaseLeft-164+71-sw/2,handY=211+105-sh/2;
        stolen.style.cssText+=`;width:${sw}px;height:${sh.toFixed(1)}px`;
        stolen.style.setProperty("--wallet-x",walletX.toFixed(1)+"px");
        stolen.style.setProperty("--wallet-y",walletY.toFixed(1)+"px");
        stolen.style.setProperty("--hand-x",handX.toFixed(1)+"px");
        stolen.style.setProperty("--hand-y",handY.toFixed(1)+"px");
        stolen.style.setProperty("--exit-x",(stage.clientWidth+sw).toFixed(1)+"px");
        stolen.style.setProperty("--exit-y",(handY+18).toFixed(1)+"px");
        const pk=stolen.firstElementChild;pk.style.setProperty("--u",(sw/stolenEntry.it.w)+"px");
        scope.node(fxFront,stolen);
        const stealTimer=setTimeout(()=>removeCollectionItem(stolenEntry),2350);
        scope.cleanups.push(()=>clearTimeout(stealTimer));
      }
      const chuckleTimer=setTimeout(()=>sfx.chuckle(),eventDuration-1250);
      scope.cleanups.push(()=>clearTimeout(chuckleTimer));
    }
    if(cmd.event==="camacho"){
      const sign=document.createElement("div");sign.className="fx-camacho-sign";
      sign.setAttribute("role","img");sign.setAttribute("aria-label","Vote Camacho. I got a solution!");
      sign.innerHTML=`<div class="camacho-board">
        <strong>Vote Camacho.</strong><span class="camacho-solution">I got a solution!</span>
      </div>`;
      const frames=(await Promise.all(ASSET_PATHS["203"].map(loadAssetImage))).filter(Boolean);
      frames.forEach((image,i)=>{image.className="camacho-flag-frame"+(i?"":" on");});
      sign.firstElementChild.prepend(...frames);
      scope.node(fxFront,sign);
      let frameIndex=0;
      if(frames.length>1&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
        let flagRaf=null,lastFrameAt=performance.now(),flagStopped=false;
        const advanceFlag=now=>{
          if(flagStopped)return;
          const elapsed=now-lastFrameAt;
          if(elapsed>=100){
            const steps=Math.floor(elapsed/100);frames[frameIndex].classList.remove("on");
            frameIndex=(frameIndex+steps)%frames.length;frames[frameIndex].classList.add("on");lastFrameAt+=steps*100;
          }
          flagRaf=requestAnimationFrame(advanceFlag);
        };
        flagRaf=requestAnimationFrame(advanceFlag);
        scope.cleanups.push(()=>{flagStopped=true;cancelAnimationFrame(flagRaf);});
      }
      tone(92,.34,"sawtooth",.035,62);
    }
    await delay(eventDuration);
    if(!META.solved.includes(cmd.id)){META.solved.push(cmd.id);saveMeta();}
  }finally{scope.cleanup();cascade.flat().forEach(el=>el.classList.remove("lit"));lcd.classList.remove("busy");setMode("idle");refreshVFD();}
  return true;
}
