#!/usr/bin/env node
"use strict";

/*
 * Dependency-free Chrome DevTools Protocol test harness.
 *
 * Prerequisites:
 *   1. Node.js 22+ (for the built-in WebSocket client).
 *   2. Chrome running with --remote-debugging-port=9223.
 *
 * Usage:
 *   node tests/browser-test.js file:///absolute/path/to/index.html
 *   node tests/browser-test.js http://127.0.0.1:8765/index.html
 *   node tests/browser-test.js <url> --slime-only
 */

const targetUrl = process.argv[2];
if (!targetUrl) throw new Error("Pass the file:// or HTTP URL to test");

const debuggingPort = process.env.CHROME_DEBUG_PORT || "9223";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const targets = await fetch(`http://127.0.0.1:${debuggingPort}/json`).then(response => response.json());
const target = targets.find(item => item.type === "page");
if (!target) throw new Error("No Chrome page target");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const events = new Map();
const errors = [];
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const waiter = pending.get(message.id);
    if (waiter) {
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
    }
    return;
  }
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") errors.push(message.params.entry.text);
  const waiters = events.get(message.method);
  if (waiters?.length) waiters.shift()(message.params);
});

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
function once(method) {
  return new Promise(resolve => {
    const waiters = events.get(method) || [];
    waiters.push(resolve);
    events.set(method, waiters);
  });
}
async function evaluate(expression, awaitPromise = true) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result.value;
}
async function click(selector) {
  const rect = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
}
async function key(key, code = key) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, text: key.length === 1 ? key : undefined });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
}
async function navigate(url) {
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url });
  await loaded;
  await delay(350);
}
async function testSlime() {
  await evaluate(`setRoomTheme(2,false)`);
  const point = await evaluate(`(()=>{const r=document.querySelector("#slime-mold-wall").getBoundingClientRect();return {x:r.left+r.width*.03,y:r.top+r.height*.3,w:r.width}})()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
  for (let i = 1; i <= 14; i++) {
    await delay(180);
    await send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: point.x + Math.min(point.w * .08, i * 5),
      y: point.y + i * 2,
      button: "left",
      buttons: 1
    });
  }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x + 70, y: point.y + 28, button: "left", clickCount: 1 });
  return evaluate(`!!ACHIEVEMENTS.unlocked["event:slime-painter"]`);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await navigate(targetUrl);

const initial = await evaluate(`({
  protocol:location.protocol,
  sheets:[...document.styleSheets].map(sheet=>sheet.href),
  scripts:[...document.scripts].map(script=>script.src).filter(Boolean),
  shelves:document.querySelectorAll(".shelf").length,
  slots:document.querySelectorAll(".slot").length,
  assetRequests:performance.getEntriesByType("resource").map(entry=>entry.name).filter(name=>name.includes("/assets/")),
  vfd:document.querySelector("#vfd").textContent.trim(),
  scale
})`);

const packaging = await evaluate(`(()=>{
  const within=(inner,outer,tolerance=.75)=>inner.left>=outer.left-tolerance&&inner.top>=outer.top-tolerance&&
    inner.right<=outer.right+tolerance&&inner.bottom<=outer.bottom+tolerance;
  const intersects=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>.75&&
    Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.75;
  const packages=[...document.querySelectorAll('.itemholder>.spe-package')].map(packageElement=>{
    const brand=packageElement.querySelector('.spe-brand');
    const titleParts=brand?[brand,...brand.querySelectorAll('span')].filter((element,index,list)=>
      (index===0&&!brand.querySelector('span'))||element!==brand):[];
    const titleSizes=titleParts.map(element=>parseFloat(getComputedStyle(element).fontSize));
    const textElements=[...packageElement.querySelectorAll('.spe-brand,.spe-subtitle,.spe-micro')]
      .filter(element=>element.getBoundingClientRect().width&&element.getBoundingClientRect().height);
    const packageRect=packageElement.getBoundingClientRect();
    const containment=textElements.map(element=>{
      const rect=element.getBoundingClientRect();
      const design=element.closest('.spe-panel,.spe-label')||packageElement;
      const designRect=design.getBoundingClientRect();
      const glyphBoxes=[element,...element.querySelectorAll('span')];
      return {className:element.className,insidePackage:within(rect,packageRect),insideDesign:within(rect,designRect),
        unclipped:glyphBoxes.every(box=>box.scrollWidth<=box.clientWidth+1&&box.scrollHeight<=box.clientHeight+1),
        overflow:{left:+(designRect.left-rect.left).toFixed(2),top:+(designRect.top-rect.top).toFixed(2),
          right:+(rect.right-designRect.right).toFixed(2),bottom:+(rect.bottom-designRect.bottom).toFixed(2)}};
    });
    const overlaps=[];
    textElements.forEach((first,index)=>textElements.slice(index+1).forEach(second=>{
      if(intersects(first.getBoundingClientRect(),second.getBoundingClientRect()))overlaps.push([first.className,second.className]);
    }));
    return {code:packageElement.dataset.vendingCode,type:packageElement.dataset.packageType,titleSizes,
      titleUniform:new Set(titleSizes.map(size=>size.toFixed(2))).size<=1,containment,overlaps,
      layout:{packageWidth:packageElement.clientWidth,panelWidth:packageElement.querySelector('.spe-panel,.spe-label')?.clientWidth||0,
        brandWidth:brand?.clientWidth||0,brandScrollWidth:brand?.scrollWidth||0}};
  });
  const replacementShapes=[...document.querySelectorAll('.slot[data-code="203"] svg[data-snack-type]')];
  const footprintCounts=Object.values(replacementShapes.reduce((counts,shape)=>{
    const footprint=shape.dataset.pileFootprint;counts[footprint]=(counts[footprint]||0)+1;return counts;
  },{}));
  const averageCenterY=replacementShapes.reduce((sum,shape)=>sum+Number(shape.getAttribute('y'))+Number(shape.getAttribute('height'))/2,0)/replacementShapes.length;
  const centerYs=replacementShapes.map(shape=>Number(shape.getAttribute('y'))+Number(shape.getAttribute('height'))/2);
  const averagePieceSize=replacementShapes.reduce((sum,shape)=>sum+Number(shape.getAttribute('width')),0)/replacementShapes.length;
  const croppedBottom=replacementShapes.filter(shape=>Number(shape.getAttribute('y'))+Number(shape.getAttribute('height'))>78).length;
  const croppedSides=replacementShapes.filter(shape=>Number(shape.getAttribute('x'))<0||
    Number(shape.getAttribute('x'))+Number(shape.getAttribute('width'))>120).length;
  return {
    engines:{shape:SnackShapeEngine.version,packaging:SnackPackagingEngine.version},packages,
    brawndo:{slot:ITEMS['508']?.id,type:document.querySelector('.slot[data-code="508"] .spe-package')?.dataset.packageType,
      coilWraps:document.querySelectorAll('.slot[data-code="508"] .coilwrap').length},
    replacement:{name:ITEMS['203']?.name,type:document.querySelector('.slot[data-code="203"] .spe-package')?.dataset.packageType,
      shapes:replacementShapes.length,maxDepth:Math.max(...replacementShapes.map(shape=>Number(shape.dataset.pileDepth))),
      maxFootprintOccupancy:Math.max(...footprintCounts),averageCenterY:+averageCenterY.toFixed(2),croppedBottom,
      croppedSides,averagePieceSize:+averagePieceSize.toFixed(2),distinctCenters:new Set(centerYs.map(value=>value.toFixed(1))).size}
  };
})()`);

const packagingConsistency = await evaluate(`(async()=>{
  const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
  const within=(inner,outer,tolerance=.75)=>inner.left>=outer.left-tolerance&&inner.top>=outer.top-tolerance&&
    inner.right<=outer.right+tolerance&&inner.bottom<=outer.bottom+tolerance;
  const intersects=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>.75&&
    Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.75;
  const snapshot=packageElement=>{
    const packageRect=packageElement.getBoundingClientRect();
    const brand=packageElement.querySelector('.spe-brand');
    const titleParts=brand?(brand.querySelectorAll('span').length?[...brand.querySelectorAll('span')]:[brand]):[];
    const titleSizes=titleParts.map(element=>parseFloat(getComputedStyle(element).fontSize).toFixed(2));
    const textElements=[...packageElement.querySelectorAll('.spe-brand,.spe-subtitle,.spe-micro')]
      .filter(element=>element.getBoundingClientRect().width&&element.getBoundingClientRect().height);
    const textSafe=textElements.every(element=>{
      const rect=element.getBoundingClientRect(),design=element.closest('.spe-panel,.spe-label')||packageElement;
      return within(rect,packageRect)&&within(rect,design.getBoundingClientRect())&&
        element.scrollWidth<=element.clientWidth+1&&element.scrollHeight<=element.clientHeight+1;
    })&&titleParts.every(element=>element.scrollWidth<=element.clientWidth+1&&element.scrollHeight<=element.clientHeight+1);
    const overlaps=textElements.some((first,index)=>textElements.slice(index+1)
      .some(second=>intersects(first.getBoundingClientRect(),second.getBoundingClientRect())));
    const style=getComputedStyle(packageElement);
    const geometry=textElements.map(element=>{
      const rect=element.getBoundingClientRect();
      return [rect.left-packageRect.left,rect.top-packageRect.top,rect.width,rect.height]
        .map((value,index)=>+(value/(index%2?packageRect.height:packageRect.width)).toFixed(3));
    });
    return {type:packageElement.dataset.packageType,text:textElements.map(element=>element.textContent.trim()),
      colors:['--spe-c1','--spe-c2','--spe-c3','--spe-panel','--spe-text','--spe-detail'].map(name=>style.getPropertyValue(name).trim()),
      titleSizes,geometry,titleUniform:new Set(titleSizes).size<=1,textSafe,overlaps};
  };
  const codes=['203','508'],result={};
  const revealStyle=reveal.getAttribute('style'),revealItemStyle=revealItem.getAttribute('style'),revealHtml=revealItem.innerHTML;
  for(const code of codes){
    const it=ITEMS[code],shelf=snapshot(document.querySelector('.slot[data-code="'+code+'"] .spe-package'));
    reveal.style.display='grid';reveal.style.visibility='hidden';
    revealItem.innerHTML=it.art();revealItem.style.width=(it.w*3)+'px';revealItem.style.height=(it.h*3)+'px';
    const shownPackage=revealItem.firstElementChild;shownPackage.style.width='100%';shownPackage.style.height='100%';
    fitEnginePackage(shownPackage,it.w*3,it.h*3);await frame();await frame();
    result[code]={shelf,shown:snapshot(shownPackage)};
  }
  revealItem.innerHTML=revealHtml;
  const restore=(element,name,value)=>value==null?element.removeAttribute(name):element.setAttribute(name,value);
  restore(reveal,'style',revealStyle);restore(revealItem,'style',revealItemStyle);

  const savedItems=JSON.parse(JSON.stringify(COLLECTION.items)),collectionStyle=collectionEl.getAttribute('style');
  codes.forEach(code=>{const it=ITEMS[code];COLLECTION.items[it.id]={code,count:1,firstAt:new Date().toISOString()};});
  renderCollection();collectionEl.style.display='grid';collectionEl.style.visibility='hidden';await frame();await frame();
  codes.forEach(code=>{
    result[code].inventory=snapshot(collectionGrid.querySelector('.spe-package[data-vending-code="'+code+'"]'));
    const signature=context=>JSON.stringify({type:context.type,text:context.text,colors:context.colors,
      titleSizes:context.titleSizes,geometry:context.geometry});
    const contexts=[result[code].shelf,result[code].shown,result[code].inventory];
    result[code].consistent=new Set(contexts.map(signature)).size===1;
    result[code].safe=contexts.every(context=>context.titleUniform&&context.textSafe&&!context.overlaps);
  });
  COLLECTION.items=savedItems;renderCollection();restore(collectionEl,'style',collectionStyle);
  return result;
})()`);

if (process.argv.includes("--packaging-only")) {
  const packagingInvalid=packaging.packages.some(item=>!item.titleUniform||item.overlaps.length||
    item.containment.some(text=>!text.insidePackage||!text.insideDesign||!text.unclipped));
  const report={initial,packaging,packagingConsistency,errors};
  console.log(JSON.stringify(report,null,2));
  socket.close();
  if(errors.length||initial.scripts.length!==6||initial.sheets.length!==2||initial.slots!==30||packagingInvalid||
    packaging.engines.shape!=="1.0.1"||packaging.engines.packaging!=="1.0.0"||
    packaging.brawndo.slot!=="brawndo"||packaging.brawndo.type!=="can"||packaging.brawndo.coilWraps!==2||
    packaging.replacement.name!=="Quantum Crisps"||packaging.replacement.type!=="bag"||packaging.replacement.shapes!==80||
    packaging.replacement.maxDepth!==2||packaging.replacement.maxFootprintOccupancy!==2||packaging.replacement.averageCenterY<=34||
    packaging.replacement.croppedBottom<1||packaging.replacement.croppedBottom>30||
    packaging.replacement.croppedSides<2||packaging.replacement.croppedSides>25||packaging.replacement.distinctCenters<16||
    packaging.replacement.averagePieceSize<38||
    Object.values(packagingConsistency).some(item=>!item.consistent||!item.safe))
    process.exitCode=1;
} else if (process.argv.includes("--change-overflow-only")) {
  const startingGeometry = await evaluate(`(()=>{
    const machine=document.querySelector("#machine").getBoundingClientRect();
    const tray=document.querySelector("#cointray").getBoundingClientRect();
    S.cash={100:0,500:0,25:0,10:0,5:0,1:0};S.change=[];
    coinTray.innerHTML="";coinTray.classList.remove("has");renderHUD();
    dropChange(1000);
    return {machineWidth:machine.width,trayWidth:tray.width};
  })()`);
  await delay(2450);
  const duringOverflow = await evaluate(`({
    spills:document.querySelectorAll(".fx-change-spill").length,
    machineWidth:document.querySelector("#machine").getBoundingClientRect().width,
    trayWidth:coinTray.getBoundingClientRect().width
  })`);
  await delay(1300);
  const settled = await evaluate(`({
    trayCoins:coinTray.childElementCount,
    trayChange:S.change.length,
    trayValue:S.change.reduce((sum,den)=>sum+den,0),
    walletValue:cashTotal(),
    spills:document.querySelectorAll(".fx-change-spill").length,
    machineWidth:document.querySelector("#machine").getBoundingClientRect().width,
    trayWidth:coinTray.getBoundingClientRect().width,
    trayClientWidth:coinTray.clientWidth,
    trayScrollWidth:coinTray.scrollWidth
  })`);
  const report = { initial, startingGeometry, duringOverflow, settled, errors };
  console.log(JSON.stringify(report, null, 2));
  socket.close();
  if (errors.length || duringOverflow.spills < 1 || settled.spills !== 0 ||
      settled.trayCoins !== settled.trayChange || settled.trayValue + settled.walletValue !== 1000 ||
      settled.trayScrollWidth > settled.trayClientWidth ||
      Math.abs(startingGeometry.machineWidth-settled.machineWidth) > 0.5 ||
      Math.abs(startingGeometry.trayWidth-settled.trayWidth) > 0.5) process.exitCode = 1;
} else if (process.argv.includes("--responsive-only")) {
  const geometry = () => evaluate(`(()=>{
    const machine=document.querySelector("#machine").getBoundingClientRect();
    const code=document.querySelector(".tag .code").getBoundingClientRect();
    const price=document.querySelector(".tag .price").getBoundingClientRect();
    return {
      scale,
      viewportHeight:innerHeight,
      scrollHeight:document.documentElement.scrollHeight,
      machineTop:machine.top,
      machineBottom:machine.bottom,
      labelCenterDelta:Math.abs((code.top+code.bottom)/2-(price.top+price.bottom)/2)
    };
  })()`);
  // A tab first opened at 120% must still recover the true 100% baseline.
  await evaluate(`baseDevicePixelRatio=1.2;localStorage.setItem(BASE_DPR_KEY,"1.2");fit()`);
  const baseline = await geometry();
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1164, height: 818, deviceScaleFactor: 1.1, mobile: false
  });
  await evaluate(`pageZoomFactor=()=>1.1;fit()`);
  await delay(250);
  const zoomed = await geometry();
  const report = { initial, baseline, zoomed, errors };
  console.log(JSON.stringify(report, null, 2));
  socket.close();
  if (errors.length || baseline.machineBottom > baseline.viewportHeight ||
      zoomed.machineBottom <= zoomed.viewportHeight || zoomed.scrollHeight <= zoomed.viewportHeight ||
      zoomed.labelCenterDelta > 0.5) process.exitCode = 1;
} else if (process.argv.includes("--slime-only")) {
  const report = { initial, slimePainted: await testSlime(), errors };
  console.log(JSON.stringify(report, null, 2));
  socket.close();
  if (!report.slimePainted || errors.length) process.exitCode = 1;
} else {
  // Pointer-operated bill insertion, keyboard selection, and pointer-operated retrieval.
  await evaluate(`document.querySelector("#billunit").click()`);
  await delay(100);
  await evaluate(`document.querySelector(".popup button:not(.close)").click()`);
  await key("2", "Digit2");
  await key("0", "Digit0");
  await key("5", "Digit5");
  await key("Enter", "Enter");
  await delay(2900);
  const vendReady = await evaluate(`({tray:S.trayItem,bought:S.bought,credit:S.credit,mode:S.mode})`);
  await click("#door");
  await delay(800);
  const retrieved = await evaluate(`({
    tray:S.trayItem,
    reveal:document.querySelector("#reveal").classList.contains("on"),
    collection:COLLECTION.items["slot-205"]?.count||0
  })`);
  await click("#reveal");

  const loaded = once("Page.loadEventFired");
  await send("Page.reload", { ignoreCache: true });
  await loaded;
  await delay(350);
  const persisted = await evaluate(`COLLECTION.items["slot-205"]?.count||0`);
  const slimePainted = await testSlime();

  // Run every special product presentation hook against its real shelf slot.
  const productEffects = await evaluate(`(async()=>{
    const results={};
    for(const it of Object.values(ITEMS).filter(item=>item.effectId)){
      const slot=slotEl(it.code),holder=slot.querySelector(".itemholder");
      const active={item:it,scope:new EffectScope(),skipPackageFall:false};
      try{await EFFECTS[it.effectId].preFall?.(effectContext(active,slot,holder));results[it.effectId]="ok";}
      catch(error){results[it.effectId]=String(error);}
      finally{active.scope.cleanup();holder.classList.remove("fx-scared","fx-faint","fx-puff");machineEl.classList.remove("fx-shudder");}
    }
    setMode("idle");return results;
  })()`);

  // Make each randomized command available, then exercise every secret event.
  await evaluate(`META.discovered=[...new Set([...META.discovered,...Object.keys(SECRET_COMMAND_DEFS)])];saveMeta()`);
  const secretResults = {};
  for (const id of ["300", "202", "969", "100", "000"]) {
    secretResults[id] = await evaluate(`runSecretCommand(SECRET_CODES[${JSON.stringify(id)}])`);
  }

  // Start the frame event without awaiting it so loading and advancement can be inspected.
  await evaluate(`window.__frameEvent=runSecretCommand(SECRET_CODES["808"])`, false);
  for (let attempt = 0; attempt < 80; attempt++) {
    if (await evaluate(`document.querySelectorAll(".camacho-flag-frame").length`)) break;
    await delay(100);
  }
  const frameA = await evaluate(`({
    count:document.querySelectorAll(".camacho-flag-frame").length,
    current:[...document.querySelectorAll(".camacho-flag-frame")].findIndex(frame=>frame.classList.contains("on")),
    sources:[...document.querySelectorAll(".camacho-flag-frame")].map(frame=>frame.src)
  })`);
  await delay(260);
  const frameB = await evaluate(`[...document.querySelectorAll(".camacho-flag-frame")].findIndex(frame=>frame.classList.contains("on"))`);
  secretResults["808"] = await evaluate(`window.__frameEvent`);

  // Check the remaining standalone special interactions on clean reloads where needed.
  await evaluate(`breakDisplayGlass({x:.5,y:.5})`);
  await delay(300);
  const glass = await evaluate(`glassBroken&&document.querySelectorAll(".fx-broken-glass,.fx-glass-shard").length>0`);
  await navigate(targetUrl);
  await evaluate(`launchStandaloneMachine()`);
  await delay(2500);
  const launch = await evaluate(`standaloneLaunched&&machineEl.classList.contains("fx-standalone-launch")`);
  await navigate(targetUrl);
  await evaluate(`rapidClearPresses=Array.from({length:9},()=>performance.now());recordRapidClearPress()`);
  await delay(1800);
  const vortex = await evaluate(`machineVanished`);

  // Reduced motion and responsive layouts.
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await navigate(targetUrl);
  const reducedMotion = await evaluate(`matchMedia("(prefers-reduced-motion: reduce)").matches`);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await delay(250);
  const narrow = await evaluate(`({scale,bodyWidth:document.body.scrollWidth,viewportWidth:innerWidth})`);
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await delay(250);
  const wide = await evaluate(`({scale,bodyWidth:document.body.scrollWidth,viewportWidth:innerWidth})`);

  const report = {
    initial, vendReady, retrieved, persisted, productEffects, secretResults,
    frames: { before: frameA, after: frameB }, slimePainted, glass, launch, vortex,
    reducedMotion, narrow, wide, packaging, packagingConsistency, errors
  };
  console.log(JSON.stringify(report, null, 2));
  socket.close();

  const packagingInvalid=packaging.packages.some(item=>!item.titleUniform||item.overlaps.length||
    item.containment.some(text=>!text.insidePackage||!text.insideDesign||!text.unclipped));
  const failed = errors.length || initial.sheets.length !== 2 || initial.scripts.length !== 6 ||
    initial.shelves !== 7 || initial.slots !== 30 || initial.assetRequests.length !== 0 ||
    packaging.engines.shape!=="1.0.1" || packaging.engines.packaging!=="1.0.0" || packagingInvalid ||
    packaging.brawndo.slot!=="brawndo" || packaging.brawndo.type!=="can" || packaging.brawndo.coilWraps!==2 ||
    packaging.replacement.name!=="Quantum Crisps" || packaging.replacement.type!=="bag" || packaging.replacement.shapes!==80 ||
    packaging.replacement.maxDepth!==2 || packaging.replacement.maxFootprintOccupancy!==2 || packaging.replacement.averageCenterY<=34 ||
    packaging.replacement.croppedBottom<1 || packaging.replacement.croppedBottom>30 ||
    packaging.replacement.croppedSides<2 || packaging.replacement.croppedSides>25 || packaging.replacement.distinctCenters<16 ||
    packaging.replacement.averagePieceSize<38 ||
    Object.values(packagingConsistency).some(item=>!item.consistent||!item.safe) ||
    vendReady.tray !== "205" || !retrieved.reveal || persisted < 1 || !slimePainted ||
    Object.values(productEffects).some(value => value !== "ok") ||
    Object.values(secretResults).some(value => value !== true) || frameA.count !== 11 ||
    frameA.current === frameB || !glass || !launch || !vortex || !reducedMotion;
  if (failed) process.exitCode = 1;
}
