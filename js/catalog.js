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

function afterMidnightArt(torn=false){
  if(!globalThis.SnackPackagingEngine)throw new Error("SnackPackagingEngine is not loaded");
  const packageElement=SnackPackagingEngine.create({type:"bag",code:"201",variant:"industrial",width:.5,
    title:["AFTER","MIDNIGHT"],subtitle:"Smoked Jerky Sticks — Keep Dry",netWeight:"2.0 OZ",
    colors:{primary:"#17131d",secondary:"#0d0a12",dark:"#030204",panel:"#261b2d",text:"#b9e94f",detail:"#ef5548"},
    contents:{type:"savory",seed:201,shapes:["jerkyStick"],palettes:["jerkyBrown"],pieceScale:.58}});
  if(torn)packageElement.classList.add("fx-torn");
  return packageElement.outerHTML;
}

// shelf data ---------------------------------------------------
// w/h are the on-shelf footprint in design px.
const SHELVES = [
  [ // 1xx — chips
    {id:"bachelor-chow",effectId:"bachelor",clueId:"300",code:"101",price:125,name:"Bachelor Chow",w:88,h:92,
      art:()=>enginePackage({type:"bag",code:"101",variant:"classic",width:.5,title:["BACHELOR","CHOW"],
        subtitle:"Now with flavor",netWeight:"2.0 OZ",
        colors:{primary:"#ef4a33",secondary:"#d1281c",dark:"#9c1710",panel:"#f7c81b",text:"#5d1109",detail:"#8d2a10"},
        contents:{type:"cookie",seed:101,shapes:["chunkFragment","roundDrop"],palettes:["cocoa"]}})},
    {id:"soylent-green",effectId:"soylent",clueId:"202",code:"103",price:125,name:"Soylent Green",w:88,h:92,
      art:()=>enginePackage({type:"bag",code:"103",variant:"classic",width:.5,title:["SOYLENT","GREEN"],
        subtitle:"High Energy Crackers",netWeight:"1.5 OZ",
        colors:{primary:"#1d5a2b",secondary:"#103b1b",dark:"#061c0d",panel:"#0a3015",text:"#baff58",detail:"#73d63c"},
        contents:{type:"cookie",seed:103,shapes:["squareCracker"],palettes:["limeGreen"]}})},
    {id:"scooby-snacks",effectId:"scooby",clueId:"969",code:"105",price:125,name:"Scooby Snacks",w:88,h:92,
      art:()=>enginePackage({type:"box",code:"105",width:.5,brand:"SCOOBY SNACKS",
        subtitle:"Dog-Gone Good",netWeight:"1.5 OZ",
        colors:{primary:"#269a9a",secondary:"#177779",dark:"#0b484c",panel:"#126568",text:"#fff0b8",detail:"#baf5e9"},
        contents:{type:"cookie",seed:105,shapes:["dogBone"],palettes:["lightBrown"]}})},
    {id:"stay-puft",effectId:"staypuft",clueId:"100",code:"107",price:150,name:"Stay Puft Marshmallows",w:88,h:92,
      art:()=>enginePackage({type:"bag",code:"107",variant:"classic",width:.5,title:["STAY","PUFT"],
        subtitle:"Marshmallows — Soft & Sweet",netWeight:"1.8 OZ",
        colors:{primary:"#ffffff",secondary:"#f1f3f2",dark:"#cdd3d2",panel:"#ffffff",text:"#174f8f",detail:"#cf2935"},
        contents:{type:"candy",seed:107,shapes:["marshmallow"],palettes:["marshmallowWhite"],pieceScale:.5}})}
  ],
  [ // 2xx — chips & popcorn
    {id:"after-midnight",effectId:"midnight",clueId:"000",code:"201",price:125,name:"After Midnight Bites",w:88,h:90,
      art:()=>afterMidnightArt(),trayArt:()=>afterMidnightArt(true)},
    {code:"203",price:150,name:"Quantum Crisps",w:88,h:90,
      art:()=>enginePackage({type:"bag",code:"203",variant:"industrial",title:["QUANTUM","CRISPS"],
        subtitle:"Every flavor at once",netWeight:"1.5 OZ",
        colors:{primary:"#7139b7",secondary:"#35207c",dark:"#160d3d",panel:"#ff7b22",text:"#fff7d6",detail:"#72efff"},
        contents:{type:"chip",seed:203,shapes:["tortillaTriangle","ridgedSlice","cornCurl","kettleFold"],
          palettes:["blueCorn","cheeseOrange","cornYellow"]}})},
    {code:"205",price:125,name:"Cloud City Diet Puffs",w:88,h:90,
      art:()=>enginePackage({type:"pouch",code:"205",width:.35,brand:"CLOUD CITY",subtitle:"All altitude. No substance.",netWeight:"0.8 OZ",
        colors:{primary:"#d9e8f5",secondary:"#7898bc",dark:"#304b70",panel:"#f0c66a",text:"#173253",detail:"#fff7dc"},
        contents:{type:"chip",seed:205,shapes:["popcornCluster"],palettes:["potatoPale"],pieceScale:.46}})},
    {code:"207",price:150,name:"Arrakis Spice Shards",w:88,h:90,
      art:()=>enginePackage({type:"bag",code:"207",variant:"industrial",width:.2,title:["ARRAKIS","SHARDS"],subtitle:"The calories must flow.",netWeight:"1.5 OZ",
        colors:{primary:"#e0611e",secondary:"#982916",dark:"#3b0d09",panel:"#f2b72f",text:"#351208",detail:"#fff0a6"},
        contents:{type:"chip",seed:207,shapes:["tortillaTriangle"],palettes:["chiliRed","cornYellow"],pieceScale:.54}})}
  ],
  [ // 3xx — chips
    {code:"301",price:125,name:"Cthulhu Crunch Curls",w:88,h:90,
      art:()=>enginePackage({type:"bag",code:"301",variant:"industrial",width:.4,title:["CTHULHU","CRUNCH"],subtitle:"Forbidden geometry. Extra crunchy.",netWeight:"0.87 OZ",
        colors:{primary:"#1733a0",secondary:"#0b1c67",dark:"#030824",panel:"#08a9b5",text:"#e8fffd",detail:"#83fff1"},
        contents:{type:"chip",seed:301,shapes:["cornCurl"],palettes:["eldritchTeal"],pieceScale:.5}})},
    {code:"303",price:150,name:"Log Lady Cinnamon Omens",w:88,h:90,
      art:()=>enginePackage({type:"box",code:"303",width:.3,brand:"LOG LADY",subtitle:"My snack saw this coming.",netWeight:"1.5 OZ",
        colors:{primary:"#572b24",secondary:"#2b1718",dark:"#10090b",panel:"#1d2520",text:"#e9c77c",detail:"#d87b62"},
        contents:{type:"chip",seed:303,shapes:["kettleFold"],palettes:["russet"],pieceScale:.5}})},
    {code:"305",price:125,name:"Children of the Corn Scoops",w:88,h:90,
      art:()=>enginePackage({type:"bag",code:"305",variant:"classic",width:.15,title:["CHILDREN","OF CORN"],subtitle:"He who snacks behind the rows.",netWeight:"1.0 OZ",
        colors:{primary:"#e5ba28",secondary:"#9a6b12",dark:"#3d2708",panel:"#14130c",text:"#f6d95e",detail:"#bd3e2b"},
        contents:{type:"chip",seed:305,shapes:["cornScoop"],palettes:["cornYellow"],pieceScale:.52}})},
    {code:"307",price:150,name:"Killer Klown Soda",w:56,h:90,
      art:()=>enginePackage({type:"can",code:"307",brand:"KLOWN FIZZ",subtitle:"30% more screaming",netWeight:"12 FL OZ",condensation:true,dent:true,
        colors:{primary:"#e83c91",secondary:"#84246f",dark:"#2a1046",panel:"#f3da43",text:"#fff6c8",detail:"#8effd6"}})}
  ],
  [ // 4xx — nuts, trail mix, jerky, crackers
    {code:"401",price:200,name:"Rancor Rations",w:88,h:92,
      art:()=>enginePackage({type:"box",code:"401",width:.35,brand:"RANCOR RATIONS",subtitle:"Pit-tested. Guard discouraged.",netWeight:"2.0 OZ",
        colors:{primary:"#b8bd37",secondary:"#737b22",dark:"#303817",panel:"#f0c84e",text:"#20280f",detail:"#fff1a3"},
        contents:{type:"savory",seed:401,shapes:["meatChunk"],palettes:["roastedMeat"],pieceScale:.5}})},
    {code:"403",price:175,name:"Mogwai Midnight Mix",w:88,h:92,
      art:()=>enginePackage({type:"pouch",code:"403",width:.7,brand:"MOGWAI MIX",subtitle:"Do not snack after midnight.",netWeight:"2.25 OZ",
        colors:{primary:"#d39a2d",secondary:"#72471c",dark:"#27190e",panel:"#aa2229",text:"#fff0ad",detail:"#ddf06b"},
        contents:{type:"candy",seed:403,shapes:["pebble","gummyCluster"],palettes:["berry","tropical"],pieceScale:.43}})},
    {code:"405",price:150,name:"Sarlacc Salt Pods",w:88,h:92,
      art:()=>enginePackage({type:"pouch",code:"405",width:.25,brand:"SARLACC PODS",subtitle:"Digests you for a thousand lunches.",netWeight:"1.5 OZ",
        colors:{primary:"#b58a47",secondary:"#6a4c25",dark:"#2a1c0e",panel:"#73402b",text:"#fff0bd",detail:"#e8cf8e"},
        contents:{type:"savory",seed:405,shapes:["peanutPod"],palettes:["oat"],pieceScale:.48}})},
    {code:"407",price:150,name:"Hellfire Club Brimstone Squares",w:88,h:92,
      art:()=>enginePackage({type:"box",code:"407",width:.5,brand:"HELLFIRE CLUB",subtitle:"Roll for indigestion.",netWeight:"1.5 OZ",
        colors:{primary:"#332c2c",secondary:"#171313",dark:"#080606",panel:"#8f1717",text:"#ffe0a0",detail:"#ff6545"},
        contents:{type:"cookie",seed:407,shapes:["squareCracker"],palettes:["chiliRed"],pieceScale:.48}})}
  ],
  [ // 5xx — candy bars
    {code:"501",price:150,name:"Dalek Dots",w:56,h:92,
      art:()=>enginePackage({type:"bar",variant:"dots",code:"501",width:0,brand:["DALEK","DOTS"],subtitle:"Exterminate your dental plan.",netWeight:"1.5 OZ",cutaway:false,
        colors:{primary:"#a06f36",secondary:"#57401e",dark:"#20170c",panel:"#b7a15b",text:"#fff2b0",detail:"#8bd6e7"}})},
    {code:"502",price:150,name:"Xenomorph Nougat",w:56,h:92,
      art:()=>enginePackage({type:"bar",variant:"biomech",code:"502",width:0,brand:["XENO","BITE"],subtitle:"No one hears you chew.",netWeight:"1.8 OZ",cutaway:false,
        colors:{primary:"#27312d",secondary:"#101714",dark:"#050706",panel:"#718247",text:"#d9efb2",detail:"#9ccf67"}})},
    {code:"504",price:150,name:"Flux Capacitor Caramel",w:56,h:92,
      art:()=>enginePackage({type:"bar",variant:"circuit",code:"504",width:0,brand:["FLUX","BAR"],subtitle:"1.21 gigasnacks.",netWeight:"1.6 OZ",cutaway:false,
        colors:{primary:"#d8b356",secondary:"#8a6726",dark:"#3d2a0c",panel:"#e7e7db",text:"#9b1f1c",detail:"#4dc5e8"}})},
    {code:"505",price:150,name:"Holy Hand Grenade",w:56,h:92,
      art:()=>enginePackage({type:"bar",variant:"heraldic",code:"505",width:0,brand:["HOLY","BITE"],subtitle:"Count to three. Then bite.",netWeight:"1.7 OZ",cutaway:false,
        colors:{primary:"#d4b548",secondary:"#6f6023",dark:"#29230d",panel:"#9d1e28",text:"#fff6c6",detail:"#f1dd72"}})},
    {code:"506",price:150,name:"Cups of R'lyeh",w:56,h:92,
      art:()=>enginePackage({type:"bar",variant:"occult",code:"506",width:0,brand:["R'LYEH","CUPS"],subtitle:"Peanut butter sleeps below.",netWeight:"1.5 OZ",cutaway:false,
        colors:{primary:"#196b63",secondary:"#0b3938",dark:"#031718",panel:"#8e4a24",text:"#c9f19a",detail:"#e9b96e"}})},
    {id:"brawndo",effectId:"brawndo",clueId:"808",code:"508",price:175,name:"Brawndo",w:56,h:92,
      art:()=>enginePackage({type:"can",code:"508",brand:"BRAWNDO",subtitle:"THE THIRST MUTILATOR",
        netWeight:"12 FL OZ",condensation:true,dent:true,
        colors:{primary:"#11a9df",secondary:"#0750ad",dark:"#061f63",panel:"#ecf238",text:"#ffffff",detail:"#efff42"}})}
  ],
  [ // 6xx — cookies & pastry
    {code:"601",price:150,name:"Second Breakfast Biscuits",w:88,h:90,
      art:()=>enginePackage({type:"box",code:"601",width:.65,brand:"SECOND BREAKFAST",subtitle:"Elevenses sold separately.",netWeight:"1.5 OZ",
        colors:{primary:"#d9c38e",secondary:"#92744b",dark:"#3d2d1c",panel:"#48653e",text:"#fff0bd",detail:"#d8e7a8"},
        contents:{type:"cookie",seed:601,shapes:["roundDrop"],palettes:["oat","butter"],pieceScale:.48}})},
    {code:"603",price:150,name:"Dark Side Sandwich Moons",w:88,h:90,
      art:()=>enginePackage({type:"box",code:"603",width:.25,brand:"DARK SIDE MOONS",subtitle:"Not the crumbs you seek.",netWeight:"1.5 OZ",
        colors:{primary:"#25283d",secondary:"#111426",dark:"#050611",panel:"#6d1018",text:"#f4f5ff",detail:"#9dc9ff"},
        contents:{type:"cookie",seed:603,shapes:["sandwichRound"],palettes:["darkCocoa"],pieceScale:.5}})},
    {code:"605",price:150,name:"Necronomnom Cookies",w:88,h:90,
      art:()=>enginePackage({type:"box",code:"605",width:.45,brand:"NECRONOMNOMS",subtitle:"Read the frosting aloud. Go on.",netWeight:"1.5 OZ",
        colors:{primary:"#897343",secondary:"#443a22",dark:"#18150d",panel:"#6b1f24",text:"#e8d59a",detail:"#c55d54"},
        contents:{type:"cookie",seed:605,shapes:["sandwichOval"],palettes:["cocoa"],pieceScale:.5}})},
    {code:"607",price:175,name:"Mudder's Milk",w:56,h:90,
      art:()=>enginePackage({type:"can",code:"607",brand:"MUDDER'S MILK",subtitle:"All the protein of a fine steak",netWeight:"12 FL OZ",condensation:false,dent:true,
        colors:{primary:"#a77643",secondary:"#654124",dark:"#29190e",panel:"#d8c08a",text:"#fff0c4",detail:"#e5c984"}})}
  ],
  [ // 7xx — gum, mints, meat stick
    {code:"702",price:175,name:"Blue Pill Mints",w:78,h:74,
      art:()=>enginePackage({type:"box",code:"702",width:0,brand:"BLUE PILL",subtitle:"Reality has worse breath.",netWeight:"0.8 OZ",
        colors:{primary:"#2c83cb",secondary:"#194a85",dark:"#0a2143",panel:"#dcebf1",text:"#16416e",detail:"#87d9ff"},
        contents:{type:"candy",seed:702,shapes:["hardLozenge"],palettes:["blue"],pieceScale:.45}})},
    {code:"703",price:175,name:"Tranya Zero",w:56,h:74,
      art:()=>enginePackage({type:"can",code:"703",brand:"TRANYA ZERO",subtitle:"Neutral-zone carbonation",netWeight:"8 FL OZ",condensation:true,dent:false,
        colors:{primary:"#eb7a2c",secondary:"#9e3421",dark:"#431421",panel:"#75d7cf",text:"#fff3c2",detail:"#b8fff4"}})},
    {code:"705",price:175,name:"Gelfling Glee Beans",w:78,h:74,
      art:()=>enginePackage({type:"box",code:"705",width:.3,brand:"GELFLING GLEE",subtitle:"Essence-free. Probably.",netWeight:"1.0 OZ",
        colors:{primary:"#8f68ad",secondary:"#523a73",dark:"#21172f",panel:"#d9b85b",text:"#fff0ba",detail:"#9cf0d0"},
        contents:{type:"candy",seed:705,shapes:["jellyBean"],palettes:["berry","tropical"],pieceScale:.44}})},
    {code:"707",price:200,name:"Buffy's Backup Stakes",w:78,h:74,
      art:()=>enginePackage({type:"bar",variant:"stakes",code:"707",width:0,brand:["BACKUP","STAKES"],subtitle:"Pointy end sold separately.",netWeight:"1.2 OZ",cutaway:false,
        colors:{primary:"#7b2929",secondary:"#411717",dark:"#170808",panel:"#c9a25b",text:"#fff0c1",detail:"#efcf8a"}})}
  ]
];

// flatten + stock
const ITEMS = {};
SHELVES.forEach((row,ri)=>row.forEach(it=>{ITEMS[it.code]={...it,id:it.id||"slot-"+it.code,shelf:ri,stock:3};}));
