"use strict";
/* ============================================================
   1. INVENTORY
   ============================================================ */
const money = c => "$" + (c/100).toFixed(2);

/* deterministic jitter so every render of a snack looks identical */
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){
  h=(h^str.charCodeAt(i))*16777619>>>0;} return h;}
function rng(seed){let s=(seed>>>0)||1;return()=>{
  s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

/* a pile of individual pieces — reads as a product photograph */
function pile(kinds,n,o={}){
  const list=Array.isArray(kinds)?kinds:[kinds];
  const r=rng(hash(list.join()+n+(o.seed||"")));
  const cols=o.cols||3, rows=Math.ceil(n/cols);
  let out="";
  for(let i=0;i<n;i++){
    const c=i%cols, ro=(i/cols)|0;
    const w=(o.w||36)*(.82+r()*.4);
    const h=w*(o.ar||.92);
    const x=(c+.5)*(100/cols)-w/2+(r()*16-8);
    const y=(ro+.5)*(100/rows)-h/2+(r()*14-7);
    const rot=(o.rot===0)?0:(r()*(o.rot||80)-(o.rot||80)/2);
    out+=`<b class="ch ${list[i%list.length]}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;`+
         `width:${w.toFixed(1)}%;height:${h.toFixed(1)}%;transform:rotate(${rot.toFixed(1)}deg)"></b>`;
  }
  return out;
}

// art builders -------------------------------------------------
function bag(o){
  return `<div class="pk bag" style="--c1:${o.c1};--c2:${o.c2};--c3:${o.c3};--tc:${o.tc||'#fff'};
    --fc:${o.fc||'#fff3cf'};--bs:${o.bs||15}">
    <div class="body"></div><div class="creases"></div>
    <div class="crimp t"></div><div class="crimp b"></div>
    <div class="swoosh"></div>
    <div class="brand ${o.script?'script':''}">${o.brand}</div>
    <div class="flav">${o.flav}</div>
    <div class="food pile ${o.plight?'light':''}">${pile(o.food,o.n||7,o.po)}</div>
    <div class="nw">${o.oz||'1.5'} OZ</div>
    <div class="gl"></div></div>`;
}
function bar(o){
  return `<div class="pk bar" style="--c1:${o.c1};--c2:${o.c2};--c3:${o.c3};--tc:${o.tc||'#fff'};
    --sc:${o.sc||'rgba(255,255,255,.85)'}">
    <div class="body"></div><div class="creases"></div>
    <div class="seam t"></div><div class="seam b"></div>
    <div class="band"></div>
    <div class="txt">
      <div class="name ${o.sm?'sm':''} ${o.script?'script':''}">${o.brand}</div>
      <div class="sub">${o.sub||''}</div>
    </div>
    <div class="photo pile">${pile(o.food,o.n||4,o.po)}</div>
    <div class="gl"></div></div>`;
}
function pouch(o){
  return `<div class="pk pouch" style="--c1:${o.c1};--c2:${o.c2};--tc:${o.tc||'#fff'}">
    <div class="body"></div>
    <div class="fill pile light">${pile(o.food,o.n||9,{cols:3,w:34,...(o.po||{})})}</div>
    <div class="label"><span>${o.brand}</span></div>
    <div class="gl"></div></div>`;
}
function jerky(o){
  return `<div class="pk jerky">
    <div class="body"></div><div class="zip"></div>
    <div class="banner"></div>
    <div class="brand">${o.brand}</div>
    <div class="badge">${o.badge||'100% BEEF'}</div>
    <div class="flav">${o.flav}</div>
    <div class="win pile">${pile("meat",o.n||5,{cols:2,w:44,ar:.55,rot:14,...(o.po||{})})}</div>
    <div class="gl"></div></div>`;
}
function pack(o){
  return `<div class="pk pack" style="--c1:${o.c1};--c2:${o.c2};--c3:${o.c3};--tc:${o.tc||'#fff'};
    --fc:${o.fc||'rgba(255,255,255,.9)'}">
    <div class="body"></div>
    <div class="brand ${o.script?'script':''}">${o.brand}</div>
    <div class="flav">${o.flav}</div>
    <div class="food pile ${o.plight?'light':''}">${pile(o.food||'cookie',o.n||6,o.po)}</div>
    <div class="gl"></div></div>`;
}
function gumbox(o){
  return `<div class="pk gumbox" style="--c1:${o.c1};--c2:${o.c2};--c3:${o.c3}">
    <div class="body"></div><div class="burst"></div><div class="frost"></div>
    <div class="brand">${o.brand}</div>
    <div class="sub">${o.sub}</div>
    <div class="flav">${o.flav||''}</div>
    <div class="strip pile">${pile("pellet",4,{cols:4,w:20,ar:1.5,rot:0})}</div>
    <div class="gl"></div></div>`;
}
function stick(o){
  return `<div class="pk stick"><div class="body"></div>
    <div class="twist t"></div><div class="twist b"></div>
    <div class="brand">${o.brand}</div>
    <div class="band"></div><div class="sub">${o.sub||'ORIGINAL BEEF'}</div>
    <div class="photo pile">${pile("meat",3,{cols:3,w:30,ar:2.1,rot:6})}</div>
    <div class="gl"></div></div>`;
}

/* Procedural engine packages keep the inventory's string-based art contract.
   The packaging engine delegates window contents to SnackShapeEngine. */
function enginePackage(options){
  if(!globalThis.SnackPackagingEngine)throw new Error("SnackPackagingEngine is not loaded");
  return SnackPackagingEngine.create(options).outerHTML;
}

// shelf data ---------------------------------------------------
// w/h are the on-shelf footprint in design px.
const SHELVES = [
  [ // 1xx — chips
    {id:"bachelor-chow",effectId:"bachelor",clueId:"300",code:"101",price:125,name:"Bachelor Chow",w:88,h:92,
      art:()=>bag({brand:"BACHELOR",bs:12,flav:"CHOW — Now With Flavor",c1:"#d27a22",c2:"#924315",c3:"#4e200b",tc:"#fff0bd",fc:"#fff0bd",food:["cracker","meat"],n:10,po:{w:28},oz:"2.0"})},
    {id:"soylent-green",effectId:"soylent",clueId:"202",code:"103",price:125,name:"Soylent Green",w:88,h:92,
      art:()=>pack({brand:"SOYLENT",flav:"GREEN — High Energy Wafer",c1:"#4b8b3b",c2:"#235521",c3:"#102d13",tc:"#e8f5ce",fc:"#e8f5ce",food:"wafer",n:5,po:{w:34,ar:1.6,rot:4}})},
    {id:"scooby-snacks",effectId:"scooby",clueId:"969",code:"105",price:125,name:"Scooby Snacks",w:88,h:92,
      art:()=>bag({brand:"SCOOBY",bs:14,flav:"SNACKS — Dog-Gone Good",c1:"#5b8ec7",c2:"#335b91",c3:"#192d52",tc:"#ffe98b",fc:"#ffe98b",food:"cracker",n:8,po:{w:30,ar:.82},oz:"1.5"})},
    {id:"stay-puft",effectId:"staypuft",clueId:"100",code:"107",price:150,name:"Stay Puft Marshmallows",w:88,h:92,
      art:()=>bag({brand:"STAY PUFT",bs:11,flav:"Marshmallows — Soft &amp; Sweet",c1:"#f5f7f8",c2:"#d9e5ef",c3:"#94b7d1",tc:"#184d8d",fc:"#d32632",food:"pop",n:10,po:{w:29,rot:0},plight:1,oz:"1.8"})}
  ],
  [ // 2xx — chips & popcorn
    {id:"after-midnight",effectId:"midnight",clueId:"000",code:"201",price:125,name:"After Midnight Bites",w:88,h:90,
      art:()=>bag({brand:"AFTER",bs:14,flav:"MIDNIGHT BITES — Keep Dry",c1:"#16131f",c2:"#0c0a11",c3:"#030204",tc:"#b7e34c",fc:"#ef4b42",food:["cracker","nut"],n:9,po:{w:29},oz:"2.0"}),
      trayArt:()=>{const wrap=document.createElement("div");wrap.innerHTML=bag({brand:"AFTER",bs:14,flav:"MIDNIGHT BITES — Keep Dry",c1:"#16131f",c2:"#0c0a11",c3:"#030204",tc:"#b7e34c",fc:"#ef4b42",food:["cracker","nut"],n:9,po:{w:29},oz:"2.0"});wrap.firstElementChild.classList.add("fx-torn");return wrap.innerHTML;}},
    {code:"203",price:150,name:"Quantum Crisps",w:88,h:90,
      art:()=>enginePackage({type:"bag",code:"203",variant:"industrial",title:["QUANTUM","CRISPS"],
        subtitle:"Every flavor at once",netWeight:"1.5 OZ",
        colors:{primary:"#7139b7",secondary:"#35207c",dark:"#160d3d",panel:"#ff7b22",text:"#fff7d6",detail:"#72efff"},
        contents:{type:"chip",count:80,seed:203,columns:13,shapes:["tortillaTriangle","ridgedSlice","cornCurl"],
          palettes:["blueCorn","cheeseOrange","cornYellow"]}})},
    {code:"205",price:125,name:"Go Lite! Popped Chips",w:88,h:90,
      art:()=>bag({brand:"GO LITE!",bs:13,flav:"100 Calorie Popped",c1:"#e5d3f2",c2:"#b98fd8",c3:"#7d4faa",tc:"#3d1a5c",fc:"#4d2470",food:"pop",n:10,po:{w:30},plight:1,oz:"0.8"})},
    {code:"207",price:150,name:"Sweet Potato Tortilla Chips",w:88,h:90,
      art:()=>bag({brand:"SWEET",bs:13,flav:"Sweet Potato Tortilla",c1:"#3a2b22",c2:"#241a14",c3:"#120c09",tc:"#ffcf7a",fc:"#ffb45c",food:"tortilla",n:6,po:{w:40,rot:50},oz:"1.5"})}
  ],
  [ // 3xx — chips
    {code:"301",price:125,name:"Cheetos Oven Baked",w:88,h:90,
      art:()=>bag({brand:"Cheetos",script:1,bs:17,flav:"Oven Baked Crunchy",c1:"#ffd25a",c2:"#f28a1c",c3:"#b8510a",tc:"#ffffff",fc:"#8c2b06",food:"cheese",n:8,po:{w:30,ar:1.5},oz:"0.87"})},
    {code:"303",price:150,name:"Stacy's Cinnamon Pita Chips",w:88,h:90,
      art:()=>bag({brand:"Stacy's",script:1,bs:19,flav:"Cinnamon Sugar",c1:"#2b2b2b",c2:"#171717",c3:"#080808",tc:"#f0c96b",fc:"#f0c96b",food:"pita",n:6,po:{w:40,rot:60},oz:"1.5"})},
    {code:"305",price:125,name:"Fritos Original Corn Chips",w:88,h:90,
      art:()=>bag({brand:"FRITOS",bs:14,flav:"The Original",c1:"#ffe14f",c2:"#f2b415",c3:"#c07708",tc:"#c8102e",fc:"#b0140f",food:"corn",n:9,po:{w:30,ar:1.3},oz:"1.0"})},
    {code:"307",price:150,name:"Herr's Popped Corn",w:88,h:90,
      art:()=>bag({brand:"Popped",script:1,bs:18,flav:"Herr's Butter Popped",c1:"#fdfdfb",c2:"#ecebe4",c3:"#c9c8bd",tc:"#c8102e",fc:"#1a4d8f",food:"pop",n:10,po:{w:30},plight:1,oz:"0.75"})}
  ],
  [ // 4xx — nuts, trail mix, jerky, crackers
    {code:"401",price:200,name:"Old Trapper Beef Jerky",w:88,h:92,
      art:()=>jerky({brand:"OLD TRAPPER",flav:"Old Fashioned",badge:"100% BEEF",n:5})},
    {code:"403",price:175,name:"Kar's Original Trail Mix",w:88,h:92,
      art:()=>pouch({brand:"Original<br>TRAIL MIX",food:["nut","raisin","mnut","peanut","cran","nut"],n:11,
        po:{w:28},c1:"#f2c53d",c2:"#d18a12",tc:"#4a2708"})},
    {code:"405",price:150,name:"Planters Salted Peanuts",w:88,h:92,
      art:()=>pouch({brand:"PLANTERS<br>PEANUTS",food:"peanut",n:12,po:{w:26,cols:4},
        c1:"#1f4fa8",c2:"#0f2e6b",tc:"#ffd75e"})},
    {code:"407",price:150,name:"Cheez-It Crackers",w:88,h:92,
      art:()=>pack({brand:"CHEEZ&#8209;IT",flav:"Original Baked Snack",c1:"#e8331f",c2:"#b91c0d",c3:"#7d1006",
        tc:"#ffffff",food:"cracker",n:9,po:{w:30,rot:40}})}
  ],
  [ // 5xx — candy bars
    {code:"501",price:150,name:"M&M's Milk Chocolate",w:56,h:92,
      art:()=>bar({brand:"m&amp;m's",sm:1,sub:"Milk Chocolate",c1:"#8b3f1f",c2:"#5c2411",c3:"#2f1108",
        tc:"#ffd75e",sc:"#ffe9a8",food:["lentil","lentil b","lentil g","lentil y","lentil n","lentil o"],
        n:9,po:{cols:3,w:28,ar:1,rot:0}})},
    {code:"502",price:150,name:"Snickers Bar",w:56,h:92,
      art:()=>bar({brand:"SNICKERS",sm:1,sub:"Peanut Caramel",c1:"#4a2a12",c2:"#2e1808",c3:"#170c04",
        tc:"#ffffff",food:["choc","peanut","choc"],n:6,po:{cols:2,w:40,ar:.6,rot:8}})},
    {code:"504",price:150,name:"Twix Caramel Cookie Bars",w:56,h:92,
      art:()=>bar({brand:"TWIX",sub:"Caramel Cookie",c1:"#d8b25e",c2:"#a8792a",c3:"#6b4a12",
        tc:"#7a1408",sc:"#4a2a06",food:"wafer",n:2,po:{cols:2,w:34,ar:2.4,rot:0}})},
    {code:"505",price:150,name:"Almond Joy",w:56,h:92,
      art:()=>bar({brand:"ALMOND JOY",sm:1,sub:"Coconut &amp; Almond",c1:"#2f6ba8",c2:"#17406e",
        c3:"#0a2440",tc:"#ffffff",food:["coco","almond","coco"],n:6,po:{cols:2,w:38,ar:.7,rot:10}})},
    {code:"506",price:150,name:"Reese's Peanut Butter Cups",w:56,h:92,
      art:()=>bar({brand:"REESE'S",sm:1,sub:"Peanut Butter Cups",c1:"#f0a71c",c2:"#d07a08",
        c3:"#8f4c04",tc:"#5c2408",sc:"#5c2408",food:"cup",n:2,po:{cols:2,w:44,ar:1,rot:0}})},
    {id:"brawndo",effectId:"brawndo",clueId:"808",code:"508",price:175,name:"Brawndo",w:56,h:92,
      art:()=>enginePackage({type:"can",code:"508",brand:"BRAWNDO",subtitle:"THE THIRST MUTILATOR",
        netWeight:"12 FL OZ",condensation:true,dent:true,
        colors:{primary:"#11a9df",secondary:"#0750ad",dark:"#061f63",panel:"#ecf238",text:"#ffffff",detail:"#efff42"}})}
  ],
  [ // 6xx — cookies & pastry
    {code:"601",price:150,name:"Famous Amos Cookies",w:88,h:90,
      art:()=>pack({brand:"Famous Amos",script:1,flav:"Chocolate Chip Cookies",c1:"#f2e6c8",c2:"#d9bc82",
        c3:"#a8853f",tc:"#5c2c08",fc:"#5c2c08",food:"cookie",n:6,po:{w:38,rot:0}})},
    {code:"603",price:150,name:"Oreo Cookies",w:88,h:90,
      art:()=>pack({brand:"OREO",flav:"Chocolate Sandwich",c1:"#1d4fb0",c2:"#12357c",c3:"#081b44",
        tc:"#ffffff",food:"oreo",n:5,po:{w:42,rot:0,cols:2}})},
    {code:"605",price:150,name:"Nutter Butter Cookies",w:88,h:90,
      art:()=>pack({brand:"Nutter Butter",script:1,flav:"Peanut Butter Sandwich",c1:"#f2c93d",c2:"#d99a12",
        c3:"#a06508",tc:"#5c2c08",fc:"#7a2b08",food:"peanut",n:6,po:{w:40,ar:.7,rot:30}})},
    {code:"607",price:175,name:"Jelly Swirl Honey Bun",w:88,h:90,
      art:()=>pack({brand:"Jelly Swirl",script:1,flav:"Honey Bun",c1:"#f7d7e6",c2:"#e39ac0",c3:"#b45c8f",
        tc:"#7a1050",fc:"#7a1050",food:"swirl",n:3,po:{w:52,rot:0,cols:2},plight:1})}
  ],
  [ // 7xx — gum, mints, meat stick
    {code:"702",price:175,name:"Dentyne Ice Peppermint",w:78,h:74,
      art:()=>gumbox({brand:"Dentyne",sub:"ICE",flav:"Peppermint",
        c1:"#3fa3e8",c2:"#1560a8",c3:"#0a3568"})},
    {code:"703",price:175,name:"Dentyne Ice Spearmint",w:78,h:74,
      art:()=>gumbox({brand:"Dentyne",sub:"ICE",flav:"Spearmint",
        c1:"#4fd08a",c2:"#178f4f",c3:"#0a5c2f"})},
    {code:"705",price:175,name:"Mike & Ike Original Fruits",w:78,h:74,
      art:()=>pack({brand:"MIKE&amp;IKE",flav:"Original Fruits",c1:"#7fc93d",c2:"#4f9a18",c3:"#2c6b08",
        tc:"#ffffff",food:["jelly","jelly b","jelly c"],n:9,po:{w:26,ar:1.7,rot:70}})},
    {code:"707",price:200,name:"Jack Link's Meat Stick",w:78,h:74,
      art:()=>stick({brand:"JACK LINK'S",sub:"ORIGINAL BEEF"})}
  ]
];

// flatten + stock
const ITEMS = {};
SHELVES.forEach((row,ri)=>row.forEach(it=>{ITEMS[it.code]={...it,id:it.id||"slot-"+it.code,shelf:ri,stock:3};}));
