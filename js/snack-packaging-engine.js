/**
 * Snack Packaging Engine 1.0.0
 * Buildless procedural package artwork for modern browsers.
 *
 * Include with a normal script tag. The API is exposed as
 * `window.SnackPackagingEngine` and every generated package retains the
 * vending simulator's `.pk` compatibility class.
 */
(function (global) {
  "use strict";

  const STYLE_ID = "snack-packaging-engine-styles";
  const TYPE_ALIASES = Object.freeze({
    bag: "bag",
    pillow: "bag",
    pillowBag: "bag",
    pouch: "pouch",
    standup: "pouch",
    standUpPouch: "pouch",
    bar: "bar",
    wrapper: "bar",
    flowWrapper: "bar",
    can: "can",
    drink: "can",
    aluminumCan: "can"
  });

  // `width` is the slimmest profile the engine draws; `maxWidth` is the
  // broadest one a shelf slot can hold, which is where the hand-built packages
  // sit. A package picks any point between the two (see resolveWidth), so the
  // shelf can carry slim single-serve bags next to broad family ones. A can is
  // a fixed extrusion, so it does not vary.
  const DIMENSIONS = Object.freeze({
    bag: { width: 92, maxWidth: 129, height: 126 },
    pouch: { width: 90, maxWidth: 126, height: 126 },
    bar: { width: 66, maxWidth: 92, height: 128 },
    can: { width: 78, maxWidth: 78, height: 128 }
  });

  // Fraction of the package box each type's contents window occupies. Kept in
  // step with the `.spe-window` rules in CSS so the generated heap can be given
  // the window's true aspect at whatever width the package ended up.
  const WINDOW_INSET = Object.freeze({
    bag: { width: 0.78, height: 0.34 },
    pouch: { width: 0.9, height: 0.5 }
  });

  // Width of a generated contents heap in its own user units.
  const PILE_WIDTH = 120;

  const DEFAULTS = Object.freeze({
    bag: {
      variant: "industrial",
      title: ["SNACK", "RATION"],
      subtitle: "Baked and ready",
      netWeight: "2.0 OZ",
      colors: { primary: "#d98532", secondary: "#98411d", dark: "#3f180c", panel: "#57210e", text: "#ffe1a3", detail: "#fff0bc" },
      contents: { type: "cookie", seed: 101 }
    },
    pouch: {
      brand: "ORIGINAL",
      subtitle: "Sweet & salty mix",
      netWeight: "2.25 OZ",
      colors: { primary: "#e0aa32", secondary: "#9f5d17", dark: "#3c240d", panel: "#bb741d", text: "#4b2809", detail: "#f8e9c0" },
      contents: { type: "candy", seed: 403 }
    },
    bar: {
      brand: "NIGHT BAR",
      subtitle: "Caramel · nougat",
      netWeight: "1.86 OZ",
      colors: { primary: "#562c18", secondary: "#29140b", dark: "#120806", panel: "#d7e2e9", text: "#f04a35", detail: "#fff0c5" },
      cutaway: true
    },
    can: {
      brand: "ENERGY",
      subtitle: "Cold carbonated drink",
      netWeight: "12 FL OZ",
      colors: { primary: "#18add8", secondary: "#0751a6", dark: "#062d73", panel: "#f0e936", text: "#ffffff", detail: "#f5ff77" },
      condensation: true,
      dent: false
    }
  });

  const CSS = String.raw`
.spe-package.pk{position:relative;display:block;flex:0 0 auto;box-sizing:border-box;transform-origin:50% 100%;filter:drop-shadow(0 8px 6px #000a);font-family:Arial,sans-serif;isolation:isolate}
.spe-package.pk *{box-sizing:border-box}
.spe-package .spe-shell,.spe-package .spe-shine{position:absolute;inset:0}
.spe-package .spe-shine{z-index:20;pointer-events:none}
.spe-package .spe-brand{position:absolute;z-index:12;overflow:hidden;text-align:center;font-family:Arial Black,Impact,sans-serif;font-weight:900;line-height:.92;letter-spacing:-.055em;text-shadow:0 1px 1px #0007}
.spe-package .spe-subtitle{position:absolute;z-index:12;overflow:hidden;text-align:center;font:800 5px/1.15 Arial,sans-serif;letter-spacing:.07em;text-transform:uppercase;text-shadow:0 1px #0008}
.spe-package .spe-micro{position:absolute;z-index:16;color:#fff9;font:700 4px/1 ui-monospace,monospace;letter-spacing:.07em;text-transform:uppercase}

/* Pillow bag */
.spe-bag{width:92px;height:126px;clip-path:polygon(5% 2%,18% 0,34% 2%,51% 0,69% 2%,84% 0,96% 3%,100% 15%,98% 84%,94% 98%,80% 100%,63% 98%,46% 100%,28% 98%,12% 100%,4% 97%,0 84%,2% 15%)}
.spe-bag .spe-shell{border-radius:10px/17px;background:radial-gradient(ellipse at 50% 18%,#fff4 0 5%,#fff0 34%),linear-gradient(90deg,#0008 0,#fff2 17%,#fff0 35% 68%,#0006 100%),linear-gradient(176deg,var(--spe-c1),var(--spe-c2) 57%,var(--spe-c3));box-shadow:inset 0 0 13px #0008}
.spe-bag .spe-seal{position:absolute;z-index:15;left:0;right:0;height:9px;background:repeating-linear-gradient(90deg,#0007 0 1px,#fff5 1px 3px,#0002 3px 5px);opacity:.65}
.spe-bag .spe-seal-top{top:0}.spe-bag .spe-seal-bottom{bottom:0}
.spe-bag .spe-fold{position:absolute;z-index:4;top:7%;bottom:7%;width:15%;opacity:.55}
.spe-bag .spe-fold-left{left:0;background:linear-gradient(90deg,#0009,#fff1);clip-path:polygon(0 0,100% 14%,65% 52%,100% 85%,0 100%)}
.spe-bag .spe-fold-right{right:0;background:linear-gradient(270deg,#0009,#fff1);clip-path:polygon(100% 0,0 14%,35% 52%,0 85%,100% 100%)}
.spe-bag .spe-panel{position:absolute;z-index:10;display:flex;overflow:hidden;flex-direction:column;left:7%;right:7%;top:11%;height:42%;padding:6px 5px 4px;border:2px solid color-mix(in srgb,var(--spe-detail),transparent 20%);background:linear-gradient(150deg,var(--spe-panel),color-mix(in srgb,var(--spe-panel),#000 55%));box-shadow:0 2px 4px #0007,inset 0 1px #fff5}
.spe-bag .spe-panel .spe-brand,.spe-bag .spe-panel .spe-subtitle{position:relative;inset:auto;width:100%;flex:0 0 auto}
.spe-bag .spe-brand span{display:block;white-space:nowrap}
.spe-bag .spe-brand{color:var(--spe-text);text-align:left;font-size:13px;letter-spacing:.015em}
.spe-bag .spe-brand span:last-child{margin-top:2px;font-size:inherit}
.spe-bag .spe-subtitle{margin-top:auto;padding-top:3px;border-top:1px solid color-mix(in srgb,var(--spe-detail),transparent 45%);color:var(--spe-detail);text-align:left;font:700 3.5px/1 ui-monospace,monospace;white-space:nowrap}
.spe-bag .spe-window{position:absolute;z-index:8;left:10%;right:12%;top:56%;bottom:10%;overflow:hidden;border-radius:10% 42% 16% 35%;background:radial-gradient(ellipse at 44% 25%,#91572c,#30180a 78%);box-shadow:0 2px 5px #0009,inset 0 0 0 1px #fff2}
.spe-bag .spe-window::before,.spe-pouch .spe-window::before{content:"";position:absolute;z-index:1;left:-12%;right:-12%;bottom:-18%;height:78%;border-radius:50%;background:radial-gradient(ellipse at 45% 24%,#a96b34,#4e2913 62%,#241106);box-shadow:0 -2px 5px #0008}
.spe-bag .spe-window::after,.spe-pouch .spe-window::after{content:"";position:absolute;z-index:30;inset:0;pointer-events:none;background:linear-gradient(112deg,#fff3,#fff0 24% 70%,#fff2 78%,#fff0)}
.spe-bag .spe-micro{right:7%;bottom:3%}
.spe-bag .spe-shine{border-radius:10px/17px;background:linear-gradient(110deg,#fff4 0 8%,#fff0 23% 61%,#fff2 68%,#fff0 82%)}
.spe-bag.spe-playful .spe-panel{left:9%;right:9%;top:10%;height:45%;border-radius:50% 50% 46% 46%;transform:rotate(2deg);background:radial-gradient(circle at 50% 30%,var(--spe-panel),color-mix(in srgb,var(--spe-panel),#000 56%) 72%)}
.spe-bag.spe-playful .spe-brand{text-align:center;font-family:Georgia,"Cooper Black",serif;font-size:13px;letter-spacing:-.04em}
.spe-bag.spe-playful .spe-brand span:first-child{transform:rotate(-3deg)}
.spe-bag.spe-playful .spe-brand span:last-child{display:inline-block;align-self:center;margin:3px auto 0;padding:2px 6px;border-radius:8px;background:var(--spe-c1);font-family:Arial Black,Impact,sans-serif;font-size:7px;letter-spacing:.06em;box-shadow:0 1px 0 #0008}
.spe-bag.spe-playful .spe-subtitle{text-align:center;border:0;font-family:Georgia,serif;letter-spacing:.03em}
.spe-bag.spe-playful .spe-window{left:13%;right:9%;top:57%;border-radius:48% 18% 42% 20%;transform:rotate(-2deg)}
.spe-bag.spe-classic .spe-panel{left:10%;right:10%;border-radius:5px;background:var(--spe-panel)}
.spe-bag.spe-classic .spe-brand{text-align:center;font-family:Georgia,serif;letter-spacing:.02em}
.spe-bag.spe-classic .spe-subtitle{text-align:center}

/* Clear stand-up pouch */
.spe-pouch{width:90px;height:126px;clip-path:polygon(7% 0,93% 0,98% 8%,100% 91%,94% 100%,6% 100%,0 91%,2% 8%)}
.spe-pouch .spe-shell{border-radius:5px/8px;background:linear-gradient(105deg,#fff5 0 6%,#fff0 27% 64%,#fff3 72%,#fff0 87%),linear-gradient(#7774,#1c171288);box-shadow:inset 0 0 0 1px #fff6,inset 0 0 14px #0008}
.spe-pouch .spe-zip{position:absolute;z-index:18;left:7%;right:7%;top:8%;height:5px;border-radius:3px;background:linear-gradient(#e0d8c6,#756e63);box-shadow:0 1px 2px #000}
.spe-pouch .spe-header{position:absolute;z-index:10;left:0;right:0;top:15%;height:31%;transform:rotate(-1deg);background:linear-gradient(175deg,var(--spe-c1),var(--spe-c2));box-shadow:0 2px 4px #0008}
.spe-pouch .spe-brand{left:8%;right:8%;top:21%;color:var(--spe-text);font-size:14px;white-space:nowrap}
.spe-pouch .spe-subtitle{left:12%;right:12%;top:39%;color:var(--spe-detail);white-space:nowrap}
.spe-pouch .spe-window{position:absolute;z-index:6;left:5%;right:5%;top:46%;bottom:4%;overflow:hidden;border-radius:5px;background:linear-gradient(#342312,#171009);box-shadow:inset 0 0 9px #000}
.spe-pouch .spe-micro{right:7%;bottom:2%}
.spe-pouch .spe-shine{background:linear-gradient(105deg,#fff5 0 6%,#fff0 27% 64%,#fff3 72%,#fff0 87%)}

/* Flow wrapper */
.spe-bar{width:66px;height:128px;clip-path:polygon(4% 0,96% 0,100% 5%,97% 95%,93% 100%,7% 100%,2% 96%,0 5%)}
.spe-bar .spe-shell{border-radius:4px;background:linear-gradient(100deg,#fff6 0 5%,#fff0 18% 76%,#fff3 83%,#fff0),linear-gradient(170deg,var(--spe-c1),var(--spe-c2) 58%,var(--spe-c3));box-shadow:inset 0 0 11px #0008}
.spe-bar .spe-seal{position:absolute;z-index:16;left:0;right:0;height:7px;background:repeating-linear-gradient(90deg,#0007 0 1px,#fff4 1px 3px,#0002 3px 5px)}
.spe-bar .spe-seal-top{top:0}.spe-bar .spe-seal-bottom{bottom:0}
.spe-bar .spe-stripe{position:absolute;z-index:8;left:-22%;right:-22%;top:20%;height:34%;transform:rotate(-8deg);background:linear-gradient(#fff3,#0002),var(--spe-panel);box-shadow:0 2px 4px #0006}
.spe-bar .spe-brand{left:3%;right:3%;top:27%;color:var(--spe-text);font-size:15px;white-space:nowrap;transform:rotate(-8deg)}
.spe-bar .spe-subtitle{left:7%;right:7%;top:49%;color:var(--spe-detail);white-space:nowrap}
.spe-bar .spe-cutaway{position:absolute;z-index:9;left:14%;right:14%;top:60%;bottom:8%;border-radius:3px;background:linear-gradient(90deg,#5a2d10 0 10%,#d6a75d 11% 24%,#5a2d10 25% 38%,#d6a75d 39% 52%,#5a2d10 53% 66%,#d6a75d 67% 80%,#5a2d10 81%),#53280e;box-shadow:0 2px 4px #000b,inset 0 0 0 2px #8a4c24}
.spe-bar .spe-micro{right:8%;bottom:2%}
.spe-bar .spe-shine{background:linear-gradient(105deg,#fff5 0 7%,#fff0 23% 71%,#fff2 78%,#fff0 90%)}

/* Aluminum can: top is visible; the base is only a thin rim, never a second ellipse. */
.spe-can{width:78px;height:128px;border-radius:13px/9px;transform-style:preserve-3d}
.spe-can .spe-shell{inset:7px 1px 7px;border-radius:10px/7px;background:linear-gradient(90deg,#0c1118 0,#889399 2%,#e7f0f1 5%,#fff9 10%,#fff1 22% 68%,#0008 92%,#aeb8ba 97%,#292f35),radial-gradient(ellipse at 48% 13%,#fff5,#fff0 42%),linear-gradient(178deg,var(--spe-c1),var(--spe-c2) 58%,var(--spe-c3));box-shadow:inset 0 0 12px #0009,0 4px 5px #0009}
.spe-can .spe-shell::before{content:"";position:absolute;left:1px;right:1px;top:-1px;height:9px;border-radius:50%;background:linear-gradient(#dce3e4aa,#ffffff11 45%,#0005)}
.spe-can .spe-top{position:absolute;z-index:18;left:2px;right:2px;top:0;height:19px;border-radius:50%;background:radial-gradient(ellipse at 49% 57%,#4e5456 0 24%,#9ea4a4 26% 31%,#d7d9d5 33% 56%,#666b6b 58% 64%,#edf0eb 67% 73%,#555a5a 75% 79%,#c8ccca 81%);box-shadow:0 3px 2px #0006,inset 0 1px 1px #fff}
.spe-can .spe-top::after{content:"";position:absolute;left:12px;top:5px;width:19px;height:7px;border-radius:50%;background:#5a5d5b;box-shadow:inset 0 1px 2px #2c2e2d,0 1px #eef0eb66;transform:rotate(-7deg)}
.spe-can .spe-tab{position:absolute;z-index:2;left:30px;top:4px;width:22px;height:9px;border:2px solid #626765;border-radius:55% 45% 50% 42%;transform:rotate(-7deg);background:linear-gradient(#e2e4df,#8f9491);box-shadow:inset 0 0 0 1px #f4f5f0,0 1px 1px #333}
.spe-can .spe-tab::after{content:"";position:absolute;left:6px;top:2px;width:7px;height:3px;border-radius:50%;background:#656966;box-shadow:inset 0 1px #373a38}
.spe-can .spe-base-rim{position:absolute;z-index:14;left:6px;right:6px;bottom:2px;height:3px;border-radius:0 0 5px 5px;background:linear-gradient(90deg,#353a39,#d7dcd9 17%,#686e6c 48%,#e6e9e4 79%,#363b3a);box-shadow:0 1px 1px #0008}
.spe-can .spe-label{position:absolute;z-index:10;left:2px;right:2px;top:10px;bottom:9px;overflow:hidden;border-radius:10px/6px}
.spe-can .spe-bolt{position:absolute;left:-4px;top:24px;width:88px;height:66px;background:var(--spe-panel);clip-path:polygon(46% 0,96% 0,64% 38%,90% 38%,19% 100%,39% 54%,8% 54%);filter:drop-shadow(2px 2px 0 #0006);opacity:.82}
.spe-can .spe-brand{left:-2px;right:-2px;top:36px;color:var(--spe-text);font-size:15px;letter-spacing:-.075em;white-space:nowrap;transform:rotate(-6deg) scaleX(.92);text-shadow:2px 2px 0 #10173b,-1px -1px 0 #10173b}
.spe-can .spe-subtitle{left:8px;right:8px;top:68px;color:var(--spe-detail);font-size:4px;line-height:1.1;white-space:nowrap;transform:rotate(-6deg)}
.spe-can .spe-micro{right:9px;bottom:13px;color:#fff9}
.spe-can .spe-highlight{position:absolute;z-index:20;left:10px;top:16px;bottom:12px;width:10px;border-radius:50%;background:linear-gradient(90deg,#fff0,#fff9,#fff0);filter:blur(.6px);opacity:.64}
.spe-can .spe-dent{position:absolute;z-index:21;right:0;top:59px;width:13px;height:20px;border-radius:50%;background:radial-gradient(ellipse at 80% 50%,#0008,#fff2 42%,#0000 67%);opacity:.7}
.spe-can .spe-drop{position:absolute;z-index:22;width:4px;height:6px;border-radius:60% 40% 55% 45%;background:linear-gradient(135deg,#fff9,#bcecff33 45%,#fff1);box-shadow:1px 2px 2px #0004}

/* Opened package. The collection displays spent wrappers, torn open across the
   top; the ones that carried a secret code have it printed inside the opening.
   Mirrors the legacy .gallery-empty / .empty-opening treatment in game.css so
   engine and hand-built packages sit side by side in the same gallery. */
.spe-package .spe-opening{display:none}
.pk.spe-package.spe-opened{filter:saturate(.74) brightness(.9) drop-shadow(0 8px 8px #0009)}
.pk.spe-package.spe-opened:not(.spe-can){clip-path:polygon(0 8%,9% 3%,18% 9%,29% 2%,40% 8%,51% 1%,62% 9%,73% 3%,84% 9%,94% 2%,100% 7%,100% 100%,0 100%)}
.pk.spe-package.spe-opened .spe-opening{position:absolute;z-index:33;display:grid;place-items:center;left:11%;right:11%;top:2%;height:15%;border-radius:50%;transform:rotate(-2deg);
  background:radial-gradient(ellipse at 50% 70%,#727a7f 0 42%,#aeb6ba 52%,#eef2f3 63%,#7c8589 68%,#0000 73%);
  box-shadow:inset 0 3px 7px #22282bbf,0 -1px 1px #ffffffa6}
.pk.spe-package.spe-opened .spe-code{color:#353b3e;font:900 10px/1 Arial,sans-serif;font-style:normal;letter-spacing:1px;text-shadow:0 1px 0 #fffc;transform:rotate(2deg)}
.pk.spe-can.spe-opened .spe-opening{left:15%;right:15%;top:1%;height:13%}
.pk.spe-can.spe-opened .spe-tab{display:none}

/* Built-in fallback contents when SnackShapeEngine is not present. */
.spe-fallback-piece{position:absolute;z-index:var(--spe-z);display:block;transform:rotate(var(--spe-r)) scale(var(--spe-s));transform-origin:50% 50%;box-shadow:0 2px 3px #000b,inset 0 1px #fff4}
.spe-fallback-piece.spe-round{width:18px;height:14px;border-radius:47%;background:linear-gradient(145deg,#f2b568,#a45723 55%,#653016)}
.spe-fallback-piece.spe-square{width:15px;height:15px;border-radius:3px;background:linear-gradient(145deg,#edbd75,#ad642d 58%,#693216);clip-path:polygon(12% 0,88% 0,100% 25%,92% 92%,18% 100%,0 72%,0 17%)}
.spe-fallback-piece.spe-triangle{width:20px;height:18px;background:linear-gradient(145deg,#f3cf70,#cf7c26 62%,#774014);clip-path:polygon(50% 0,100% 93%,4% 100%)}
.spe-fallback-piece.spe-ring{width:17px;height:17px;border:5px solid #a95b29;border-radius:50%;background:#df9c50}
.spe-fallback-piece.spe-bean{width:16px;height:11px;border-radius:65% 35% 58% 42%;background:radial-gradient(circle at 30% 25%,#e77c93,#8b3157 62%,#43162d)}
.spe-window>svg{position:relative;z-index:5;width:100%;height:100%;display:block}
`;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeOptions(type, options) {
    const defaults = clone(DEFAULTS[type]);
    const supplied = options || {};
    return {
      ...defaults,
      ...supplied,
      colors: { ...defaults.colors, ...(supplied.colors || {}) },
      contents: supplied.contents === false ? false : { ...(defaults.contents || {}), ...(supplied.contents || {}) }
    };
  }

  function make(tag, className, parent, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content != null) element.textContent = String(content);
    if (parent) parent.appendChild(element);
    return element;
  }

  function applyColors(root, colors) {
    root.style.setProperty("--spe-c1", colors.primary);
    root.style.setProperty("--spe-c2", colors.secondary);
    root.style.setProperty("--spe-c3", colors.dark);
    root.style.setProperty("--spe-panel", colors.panel);
    root.style.setProperty("--spe-text", colors.text);
    root.style.setProperty("--spe-detail", colors.detail);
  }

  /**
   * How broad to draw a package.
   *
   * A fraction from 0 to 1 walks the type's range: 0 is the slim profile the
   * engine has always drawn, 1 is as broad as the shelf slot allows and matches
   * the hand-built packages. Anything above 1 is taken as an explicit width in
   * design pixels, so a one-off package can still be sized directly.
   */
  function resolveWidth(type, requested) {
    const dimensions = DIMENSIONS[type];
    const value = Number(requested);
    if (requested == null || !Number.isFinite(value)) return dimensions.width;
    if (value > 1) return value;
    const widest = dimensions.maxWidth || dimensions.width;
    return dimensions.width + (widest - dimensions.width) * Math.min(1, Math.max(0, value));
  }

  function prepareRoot(type, settings) {
    const root = make("div", `pk spe-package spe-${type}`);
    root.dataset.packageType = type;
    if (settings.code != null) root.dataset.vendingCode = String(settings.code);
    if (settings.className) root.classList.add(...String(settings.className).split(/\s+/).filter(Boolean));
    if (settings.scale != null) root.style.transform = `scale(${Number(settings.scale) || 1})`;
    const dimensions = DIMENSIONS[type];
    const width = resolveWidth(type, settings.width);
    const height = Number(settings.height) || dimensions.height;
    root.dataset.width = String(width);
    root.dataset.height = String(height);
    // The stylesheet carries the slim default; an inline size covers packages
    // drawn at any other width before the shelf's fitter has run on them.
    root.style.width = `${width}px`;
    root.style.height = `${height}px`;
    applyColors(root, settings.colors);
    return root;
  }

  function addCommonText(root, settings, type) {
    const brand = settings.brand || (Array.isArray(settings.title) ? settings.title.join(" ") : settings.title) || "Snack";
    root.setAttribute("role", "img");
    root.setAttribute("aria-label", `${brand} ${type} package`);
  }

  function seededRandom(seed) {
    let state = 2166136261;
    String(seed == null ? 1 : seed).split("").forEach((character) => {
      state ^= character.charCodeAt(0);
      state = Math.imul(state, 16777619);
    });
    return function random() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fallbackContents(target, options) {
    const settings = { count: 20, seed: 1, shapes: ["round", "square", "triangle", "ring", "bean"], ...options };
    const random = seededRandom(settings.seed);
    const count = Math.max(1, Math.min(40, Number(settings.count) || 20));
    for (let index = 0; index < count; index += 1) {
      const shape = settings.shapes[Math.floor(random() * settings.shapes.length) % settings.shapes.length];
      const piece = make("i", `spe-fallback-piece spe-${shape}`, target);
      const row = Math.floor(index / 5);
      const column = index % 5;
      piece.style.left = `${-3 + column * 21 + (random() - 0.5) * 9}%`;
      piece.style.top = `${4 + row * 19 + (random() - 0.5) * 8}%`;
      piece.style.setProperty("--spe-r", `${Math.round((random() - 0.5) * 48)}deg`);
      piece.style.setProperty("--spe-s", String(0.65 + row * 0.11 + random() * 0.16));
      piece.style.setProperty("--spe-z", String(2 + index));
    }
  }

  function populateWindow(target, type, options, packageWidth, packageHeight) {
    if (!target || options === false) return;
    const settings = { type: "cookie", seed: 1, ...options };
    const shapeEngine = global.SnackShapeEngine;
    if (shapeEngine && typeof shapeEngine.renderPile === "function" && settings.fallback !== true) {
      // Give the heap the same aspect as the window it fills, so covering the
      // window crops the heap evenly instead of shaving one axis hard. Broader
      // packages get a proportionally wider heap, which keeps a piece the same
      // real size on the shelf no matter how wide its package is.
      const inset = WINDOW_INSET[type] || WINDOW_INSET.bag;
      const aspect = (packageWidth * inset.width) / (packageHeight * inset.height);
      const pileOptions = {
        width: PILE_WIDTH,
        height: Math.round(PILE_WIDTH / aspect),
        ...settings
      };
      // The heap stops when it has filled the window, so a requested `count` is
      // a ceiling rather than a target. The flat fallback below still treats it
      // as an exact number of pieces.
      if (settings.count != null && settings.maxCount == null) pileOptions.maxCount = settings.count;
      delete pileOptions.count;
      delete pileOptions.fallback;
      shapeEngine.renderPile(target, pileOptions);
      return;
    }
    fallbackContents(target, settings);
  }

  function buildBag(settings) {
    const root = prepareRoot("bag", settings);
    root.classList.add(`spe-${["industrial", "playful", "classic"].includes(settings.variant) ? settings.variant : "industrial"}`);
    make("i", "spe-shell", root);
    make("i", "spe-seal spe-seal-top", root);
    make("i", "spe-seal spe-seal-bottom", root);
    make("i", "spe-fold spe-fold-left", root);
    make("i", "spe-fold spe-fold-right", root);
    const panel = make("div", "spe-panel", root);
    const brand = make("b", "spe-brand", panel);
    const lines = Array.isArray(settings.title) ? settings.title : [settings.title || settings.brand || "SNACK"];
    lines.forEach((line) => make("span", "", brand, line));
    make("span", "spe-subtitle", panel, settings.subtitle);
    const windowElement = make("div", "spe-window", root);
    populateWindow(windowElement, "bag", settings.contents, Number(root.dataset.width), Number(root.dataset.height));
    make("small", "spe-micro", root, `NET WT ${settings.netWeight}`);
    make("i", "spe-shine", root);
    addCommonText(root, settings, "pillow bag");
    return root;
  }

  function buildPouch(settings) {
    const root = prepareRoot("pouch", settings);
    make("i", "spe-shell", root);
    make("i", "spe-zip", root);
    make("i", "spe-header", root);
    make("b", "spe-brand", root, settings.brand);
    make("span", "spe-subtitle", root, settings.subtitle);
    const windowElement = make("div", "spe-window", root);
    populateWindow(windowElement, "pouch", settings.contents, Number(root.dataset.width), Number(root.dataset.height));
    make("small", "spe-micro", root, `NET WT ${settings.netWeight}`);
    make("i", "spe-shine", root);
    addCommonText(root, settings, "stand-up pouch");
    return root;
  }

  function buildBar(settings) {
    const root = prepareRoot("bar", settings);
    make("i", "spe-shell", root);
    make("i", "spe-seal spe-seal-top", root);
    make("i", "spe-seal spe-seal-bottom", root);
    make("i", "spe-stripe", root);
    make("b", "spe-brand", root, settings.brand);
    make("span", "spe-subtitle", root, settings.subtitle);
    if (settings.cutaway !== false) make("i", "spe-cutaway", root);
    make("small", "spe-micro", root, `NET WT ${settings.netWeight}`);
    make("i", "spe-shine", root);
    addCommonText(root, settings, "flow wrapper");
    return root;
  }

  function buildCan(settings) {
    const root = prepareRoot("can", settings);
    make("i", "spe-shell", root);
    const top = make("i", "spe-top", root);
    make("i", "spe-tab", top);
    make("i", "spe-base-rim", root);
    const label = make("div", "spe-label", root);
    make("i", "spe-bolt", label);
    make("b", "spe-brand", label, settings.brand);
    make("span", "spe-subtitle", label, settings.subtitle);
    make("small", "spe-micro", root, `${settings.netWeight} · COLD`);
    make("i", "spe-highlight", root);
    if (settings.dent) make("i", "spe-dent", root);
    if (settings.condensation !== false) {
      const drops = [[19, 25], [56, 21], [43, 44], [20, 60], [60, 69], [34, 83], [53, 94], [14, 101]];
      drops.forEach(([x, y], index) => {
        const drop = make("i", "spe-drop", root);
        drop.style.left = `${x}px`;
        drop.style.top = `${y}px`;
        drop.style.transform = `scale(${0.7 + (index % 3) * 0.17}) rotate(${index * 19}deg)`;
      });
    }
    addCommonText(root, settings, "aluminum can");
    return root;
  }

  function installStyles(targetDocument) {
    const doc = targetDocument || document;
    let style = doc.getElementById(STYLE_ID);
    if (style) return style;
    style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(style);
    return style;
  }

  function fitOne(element, maxWidth, minimum) {
    element.style.fontSize = "";
    let size = parseFloat(getComputedStyle(element).fontSize);
    if (!Number.isFinite(size)) return;
    while (element.scrollWidth > maxWidth && size > minimum) {
      size -= 0.25;
      element.style.fontSize = `${size}px`;
    }
  }

  function fitUniform(elements, minimum) {
    const lines = [...elements];
    if (!lines.length) return;
    lines.forEach((element) => { element.style.fontSize = ""; });
    let size = Math.min(...lines.map((element) => parseFloat(getComputedStyle(element).fontSize))
      .filter(Number.isFinite));
    if (!Number.isFinite(size)) return;
    while (lines.some((element) => element.scrollWidth > element.clientWidth) && size > minimum) {
      size -= 0.25;
      lines.forEach((element) => { element.style.fontSize = `${size}px`; });
    }
  }

  function fitText(root) {
    if (!root || !root.querySelectorAll) return root;
    root.querySelectorAll(".spe-panel").forEach((panel) => {
      // Each child already occupies the panel's padded content box. Fit to that
      // actual box so text is neither driven to the minimum nor clipped by its
      // narrower brand container.
      fitUniform(panel.querySelectorAll(".spe-brand span"), 3);
      panel.querySelectorAll(".spe-subtitle").forEach((element) =>
        fitOne(element, Math.max(1, element.clientWidth), 3));
    });
    root.querySelectorAll(".spe-label,.spe-package").forEach((container) => {
      container.querySelectorAll(":scope > .spe-brand,:scope > .spe-subtitle").forEach((element) => {
        fitOne(element, Math.max(1, element.clientWidth), 3);
      });
    });
    return root;
  }

  function queueTextFit(root) {
    const schedule = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (callback) => setTimeout(callback, 0);
    schedule(() => fitText(root));
  }

  function normalizeType(value) {
    const type = TYPE_ALIASES[value || "bag"];
    if (!type) throw new Error(`Unknown package type: ${value}`);
    return type;
  }

  function create(options) {
    const supplied = options || {};
    const type = normalizeType(supplied.type || supplied.package);
    const settings = mergeOptions(type, supplied);
    if (settings.styles !== false) installStyles();
    const builders = { bag: buildBag, pouch: buildPouch, bar: buildBar, can: buildCan };
    const root = builders[type](settings);
    queueTextFit(root);
    return root;
  }

  function render(target, options) {
    const container = typeof target === "string" ? document.querySelector(target) : target;
    if (!container) throw new Error("SnackPackagingEngine.render target was not found");
    const packageElement = create(options);
    container.replaceChildren(packageElement);
    queueTextFit(packageElement);
    return packageElement;
  }

  function forType(type, options) {
    return create({ ...(options || {}), type });
  }

  /**
   * Show an already-built package as opened and spent.
   *
   * Only packages that carried a secret code get one printed inside the
   * opening; passing no code leaves the wrapper empty, which is the normal
   * case. Safe to call twice on the same element — a second call updates the
   * code in place rather than stacking another opening on top.
   */
  function openPackage(target, code) {
    const root = typeof target === "string" ? document.querySelector(target) : target;
    if (!root || !root.classList || !root.classList.contains("spe-package")) return null;
    root.classList.add("spe-opened");
    const opening = root.querySelector(".spe-opening") || make("i", "spe-opening", root);
    const printed = opening.querySelector(".spe-code");
    if (code) (printed || make("b", "spe-code", opening)).textContent = String(code);
    else if (printed) printed.remove();
    return root;
  }

  global.SnackPackagingEngine = Object.freeze({
    version: "1.1.0",
    types: Object.freeze(Object.keys(DIMENSIONS)),
    dimensions: DIMENSIONS,
    defaults: DEFAULTS,
    css: CSS,
    installStyles,
    create,
    render,
    fitText,
    open: openPackage,
    bag: (options) => forType("bag", options),
    pouch: (options) => forType("pouch", options),
    bar: (options) => forType("bar", options),
    can: (options) => forType("can", options)
  });
})(globalThis);
