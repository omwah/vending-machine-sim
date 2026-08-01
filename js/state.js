"use strict";
/* Secret animations live in one registry. Adding a definition here creates a
   persistent random code and, through the achievement catalog, a code award. */
const SECRET_COMMAND_DEFS={
  "300":{title:"BACHELOR CHOW",texts:["NOW WITH FLAVOR!","MAKES ITS OWN GRAVY!"],event:"rocket",duration:4800},
  "202":{title:"NUTRITION RECORD",text:"THE LAST CUSTOMER NEVER LEFT",event:"glass",duration:6000},
  "969":{title:"INCIDENT REPORT",text:"THE FOOTSTEPS NUMBER FIVE",event:"ghost",duration:3100},
  "100":{title:"BY THE FIRE AT\nCAMP WAUCONDA",text:"IT BORROWED THE CHOSEN SHAPE",event:"shudder",duration:6000},
  "000":{title:"FOLLOW CARE\nINSTRUCTIONS",text:"IT WAS NEVER FED. IT STILL GREW.",event:"rear",duration:4700},
  "808":{titles:["Water? Like out\nof the toilet?","If you don't smoke\nTarryltons... Fuck You!","I like money."],
    text:"I GOT A SOLUTION!",event:"camacho",duration:5400}
};
const SECRET_CODE_KEY="vending-machine-secret-codes-v1";
const SECRET_IDS=[...new Set([
  ...Object.values(ITEMS).map(it=>it.clueId).filter(Boolean),
  ...Object.keys(SECRET_COMMAND_DEFS)
])];
function secretCodeMappingIsValid(mapping){
  if(!mapping||typeof mapping!=="object")return false;
  const codes=SECRET_IDS.map(id=>mapping[id]);
  return codes.every(code=>/^\d{3}$/.test(code)&&!ITEMS[code])&&new Set(codes).size===codes.length;
}
function generateSecretCodeMapping(saved={}){
  const unavailable=new Set(Object.keys(ITEMS)),mapping={};
  SECRET_IDS.forEach(id=>{
    const previous=saved[id];
    if(/^\d{3}$/.test(previous)&&!unavailable.has(previous)){
      mapping[id]=previous;unavailable.add(previous);return;
    }
    let code;
    do{
      if(globalThis.crypto?.getRandomValues){const value=new Uint16Array(1);crypto.getRandomValues(value);code=String(value[0]%1000).padStart(3,"0");}
      else code=String(Math.floor(Math.random()*1000)).padStart(3,"0");
    }while(unavailable.has(code));
    unavailable.add(code);mapping[id]=code;
  });
  return mapping;
}
function loadSecretCodeMapping(){
  let saved={};
  try{
    const raw=JSON.parse(localStorage.getItem(SECRET_CODE_KEY)||"null");
    if(raw?.version===1&&secretCodeMappingIsValid(raw.codes))return Object.fromEntries(SECRET_IDS.map(id=>[id,raw.codes[id]]));
    if(raw?.version===1&&raw.codes&&typeof raw.codes==="object")saved=raw.codes;
  }catch(e){}
  const codes=generateSecretCodeMapping(saved);
  try{localStorage.setItem(SECRET_CODE_KEY,JSON.stringify({version:1,codes}));}catch(e){}
  return codes;
}
const SECRET_CODES=loadSecretCodeMapping();

const COLLECTION_KEY="vending-machine-collection-v1";
function loadCollection(){
  try{
    const raw=JSON.parse(localStorage.getItem(COLLECTION_KEY)||"null");
    if(raw&&raw.version===1&&raw.items&&typeof raw.items==="object")return raw;
  }catch(e){}
  return {version:1,items:{}};
}
const COLLECTION=loadCollection();
function saveCollection(){try{localStorage.setItem(COLLECTION_KEY,JSON.stringify(COLLECTION));}catch(e){}}
function collectSnack(it){
  const saved=COLLECTION.items[it.id]||{code:it.code,count:0};
  saved.code=it.code;saved.count++;COLLECTION.items[it.id]=saved;saveCollection();
  if(isSpecialItem(it))unlockAchievement("item:"+it.id);
  if(document.getElementById("collection")?.classList.contains("on"))renderCollection();
}
function chooseCollectionItem(){
  const owned=Object.entries(COLLECTION.items)
    .map(([id,saved])=>({id,saved,it:ITEMS[saved.code]||Object.values(ITEMS).find(it=>it.id===id)}))
    .filter(({saved,it})=>it&&saved.count>0);
  return owned.length?owned[Math.floor(Math.random()*owned.length)]:null;
}
function removeCollectionItem(entry){
  const saved=entry&&COLLECTION.items[entry.id];if(!saved||saved.count<=0)return false;
  saved.count--;
  if(saved.count<=0)delete COLLECTION.items[entry.id];
  saveCollection();
  if(document.getElementById("collection")?.classList.contains("on"))renderCollection();
  return true;
}

/* ============================================================
   2. STATE
   ============================================================ */
const S = {
  cash:{100:3,500:1,25:4,10:5,5:10},   // $3 + $5 + $1.00 + $0.50 + $0.50 = $10.00
  card:1000,
  credit:0,
  entry:"",
  cardSession:false,      // card authorised, waiting for a selection
  cardInserted:false,
  busy:false,
  change:[],              // coin denominations sitting in the return
  trayItem:null,          // code awaiting retrieval
  bought:0,
  mode:"idle",
  activeVend:null
};
const cashTotal = () => Object.entries(S.cash).reduce((s,[d,n])=>s+d*n,0);

const META_KEY="vending-machine-meta-v1";
function loadMeta(){
  try{
    const raw=JSON.parse(localStorage.getItem(META_KEY)||"null");
    if(raw&&raw.version===1&&Array.isArray(raw.discovered)&&Array.isArray(raw.solved))
      return {version:1,discovered:[...new Set(raw.discovered)],solved:[...new Set(raw.solved)],
        replay:Number(raw.replay)||0,commandReplay:raw.commandReplay&&typeof raw.commandReplay==="object"?raw.commandReplay:{}};
  }catch(e){}
  return {version:1,discovered:[],solved:[],replay:0,commandReplay:{}};
}
const META=loadMeta();
function saveMeta(){try{localStorage.setItem(META_KEY,JSON.stringify(META));}catch(e){}}

/* ============================================================
   ACHIEVEMENTS — item and secret-code entries are data-driven
   ============================================================ */
const ACHIEVEMENT_KEY="vending-machine-achievements-v1";
const EVENT_ACHIEVEMENT_DEFS=[
  {id:"event:glass-break",title:"Smash and Grab",description:"Break the display glass and set every snack free.",icon:"glass"},
  {id:"event:machine-launch",title:"Vending Into Orbit",description:"Launch the entire vending machine off the screen.",icon:"launch"},
  {id:"event:keypad-vortex",title:"Out of Order, Out of Space",description:"Twirl the vending machine into nothingness.",icon:"vortex"},
  {id:"event:slime-painter",title:"Living Finger Paint",description:"Paint the moldy room with living slime for a few seconds.",icon:"paint"}
];
function isSpecialItem(it){return !!(it&&(it.effectId||it.clueId));}
function loadAchievements(){
  try{
    const raw=JSON.parse(localStorage.getItem(ACHIEVEMENT_KEY)||"null");
    if(raw?.version===1&&raw.unlocked&&typeof raw.unlocked==="object")return {
      version:1,unlocked:{...raw.unlocked},rooms:Array.isArray(raw.rooms)?[...new Set(raw.rooms)]:[]
    };
  }catch(e){}
  return {version:1,unlocked:{},rooms:[]};
}
const ACHIEVEMENTS=loadAchievements();
function saveAchievements(){try{localStorage.setItem(ACHIEVEMENT_KEY,JSON.stringify(ACHIEVEMENTS));}catch(e){}}
function achievementCatalog(){
  const itemAwards=Object.values(ITEMS).filter(isSpecialItem).map(it=>({
    id:"item:"+it.id,type:"item",item:it,title:it.name,
    description:"Purchase this special snack and add it to your collection."
  }));
  const codeAwards=Object.entries(SECRET_COMMAND_DEFS).map(([id,command])=>{
    const item=Object.values(ITEMS).find(candidate=>candidate.clueId===id);
    return {id:"code:"+id,type:"code",code:SECRET_CODES[id],commandId:id,
      title:(item?item.name:(command.title||command.titles?.[0]||"Secret" ).replace(/\n/g," "))+" Code",
      description:"Activate hidden code "+SECRET_CODES[id]+" and witness its secret animation."};
  });
  return [...itemAwards,...codeAwards,...EVENT_ACHIEVEMENT_DEFS,
    {id:"event:all-rooms",type:"event",title:"Interior Decorator",
      description:"Visit every vending-machine background.",icon:"rooms"}];
}
function unlockedAchievementCount(){
  const possible=new Set(achievementCatalog().map(item=>item.id));
  return Object.keys(ACHIEVEMENTS.unlocked).filter(id=>possible.has(id)).length;
}
function updateAchievementSummary(){
  const total=achievementCatalog().length,unlocked=unlockedAchievementCount();
  const badge=document.getElementById("achievementbadge");if(badge)badge.textContent=unlocked;
  const count=document.getElementById("achievementcount");if(count)count.textContent=`${unlocked} / ${total} UNLOCKED`;
}
function unlockAchievement(id,timestamp=Date.now(),{silent=false}={}){
  if(ACHIEVEMENTS.unlocked[id])return false;
  ACHIEVEMENTS.unlocked[id]=timestamp;saveAchievements();updateAchievementSummary();
  if(document.getElementById("achievements")?.classList.contains("on"))renderAchievements();
  if(!silent)showAchievementToast(id);
  return true;
}
function visitRoomTheme(className){
  if(!ACHIEVEMENTS.rooms.includes(className)){
    ACHIEVEMENTS.rooms.push(className);saveAchievements();
  }
  if(typeof ROOM_THEMES!=="undefined"&&ROOM_THEMES.every(([roomClass])=>ACHIEVEMENTS.rooms.includes(roomClass)))
    unlockAchievement("event:all-rooms");
}
function syncHistoricAchievements(){
  Object.entries(COLLECTION.items).forEach(([id,saved])=>{
    const it=ITEMS[saved.code]||Object.values(ITEMS).find(item=>item.id===id);
    if(saved.count>0&&isSpecialItem(it))unlockAchievement("item:"+it.id,Date.now(),{silent:true});
  });
  META.solved.forEach(id=>{if(SECRET_COMMAND_DEFS[id])unlockAchievement("code:"+id,Date.now(),{silent:true});});
}
