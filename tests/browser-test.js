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

if (process.argv.includes("--slime-only")) {
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
    reducedMotion, narrow, wide, errors
  };
  console.log(JSON.stringify(report, null, 2));
  socket.close();

  const failed = errors.length || initial.sheets.length !== 1 || initial.scripts.length !== 4 ||
    initial.shelves !== 7 || initial.slots !== 30 || initial.assetRequests.length !== 0 ||
    vendReady.tray !== "205" || !retrieved.reveal || persisted < 1 || !slimePainted ||
    Object.values(productEffects).some(value => value !== "ok") ||
    Object.values(secretResults).some(value => value !== true) || frameA.count !== 11 ||
    frameA.current === frameB || !glass || !launch || !vortex || !reducedMotion;
  if (failed) process.exitCode = 1;
}
