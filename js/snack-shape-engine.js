(function (global) {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  let instanceId = 0;

  const PALETTES = Object.freeze({
    butter: { label: "Butter gold", base: "#d5a052", light: "#f1ca82", dark: "#875323", accent: "#4a2817" },
    oat: { label: "Oat tan", base: "#bd8a58", light: "#e1bd8c", dark: "#755035", accent: "#49301f" },
    cocoa: { label: "Cocoa", base: "#713a24", light: "#a76342", dark: "#351a12", accent: "#ead9b8" },
    darkCocoa: { label: "Dark cocoa", base: "#3b211a", light: "#684036", dark: "#160c09", accent: "#f1dfbd" },
    vanilla: { label: "Vanilla", base: "#e0be7a", light: "#f4dda8", dark: "#966731", accent: "#5a321e" },
    redCocoa: { label: "Red cocoa", base: "#913a31", light: "#bd6355", dark: "#4b1715", accent: "#f2dfbd" },
    cornYellow: { label: "Corn yellow", base: "#d7a23b", light: "#f4d374", dark: "#835413", accent: "#fff0b0" },
    cheeseOrange: { label: "Cheese orange", base: "#d96e20", light: "#f2a140", dark: "#813711", accent: "#ffcf64" },
    blueCorn: { label: "Blue corn", base: "#51495f", light: "#7e748f", dark: "#25212f", accent: "#b9afc8" },
    chiliRed: { label: "Chili red", base: "#a84928", light: "#d87b4b", dark: "#592313", accent: "#f0b14f" },
    potatoPale: { label: "Pale potato", base: "#e3c46d", light: "#f8e4a0", dark: "#987125", accent: "#fff3b8" },
    friedGold: { label: "Fried gold", base: "#c98b2e", light: "#e9bc5d", dark: "#744511", accent: "#f7dc86" },
    russet: { label: "Russet", base: "#8a5326", light: "#bd7d40", dark: "#472611", accent: "#dfa95f" },
    rainbow: { label: "Rainbow", colors: ["#d83d3a", "#ee812c", "#e9c43d", "#55a253", "#397cc2", "#7652a3", "#d95888"] },
    berry: { label: "Berry mix", colors: ["#ba2e54", "#d95888", "#72469b", "#3f71bd", "#9c254c"] },
    tropical: { label: "Tropical mix", colors: ["#f07a2b", "#e6c83f", "#61a64b", "#e55e73", "#4a9fc4"] },
    red: { label: "Cherry red", base: "#c93237", light: "#f46d69", dark: "#71151c", accent: "#ffbbb1" },
    orange: { label: "Orange", base: "#e87627", light: "#ffaf52", dark: "#8b3910", accent: "#ffd184" },
    yellow: { label: "Lemon yellow", base: "#e7bd2c", light: "#ffe46b", dark: "#88700d", accent: "#fff3a1" },
    green: { label: "Apple green", base: "#55a44d", light: "#87d276", dark: "#245d27", accent: "#c8f0ad" },
    blue: { label: "Blue raspberry", base: "#3f82c8", light: "#7bc2ed", dark: "#1d477d", accent: "#b8e7ff" },
    purple: { label: "Grape purple", base: "#7750a3", light: "#ac81d1", dark: "#3d245f", accent: "#dec3ef" },
    pink: { label: "Pink", base: "#d95888", light: "#f394b4", dark: "#842648", accent: "#ffd0df" },
    amber: { label: "Butterscotch amber", base: "#b66a2c", light: "#e3a153", dark: "#6c3514", accent: "#f6ca7c" },
    black: { label: "Black licorice", base: "#241e22", light: "#574b55", dark: "#090709", accent: "#837482" },
    milkChocolate: { label: "Milk chocolate", base: "#724329", light: "#a46b47", dark: "#361d13", accent: "#d5a479" },
    darkChocolate: { label: "Dark chocolate", base: "#3b241b", light: "#674333", dark: "#170d09", accent: "#a97955" },
    whiteChocolate: { label: "White chocolate", base: "#e7d3ad", light: "#fff1d1", dark: "#aa8958", accent: "#fff8df" },
    mintWhite: { label: "Peppermint", base: "#f1eadc", light: "#ffffff", dark: "#b9ab98", accent: "#cf3438" },
    caramel: { label: "Caramel", base: "#b66a2c", light: "#e6a35b", dark: "#683317", accent: "#f1c17d" },
    limeGreen: { label: "Lime green", base: "#86d62f", light: "#b8f064", dark: "#477f16", accent: "#d9ff8a" },
    lightBrown: { label: "Light brown", base: "#c89a62", light: "#e5c18e", dark: "#79502d", accent: "#f1d5a8" }
  });

  const CATALOG = Object.freeze({
    cookie: {
      label: "Cookies",
      shapes: {
        roundDrop: { label: "Round drop", material: "baked", palettes: ["butter", "oat", "cocoa", "darkCocoa"] },
        sandwichRound: { label: "Round sandwich", material: "baked", palettes: ["darkCocoa", "vanilla", "redCocoa"] },
        sandwichOval: { label: "Oval sandwich", material: "baked", palettes: ["vanilla", "cocoa"] },
        embossedRect: { label: "Embossed shortbread", material: "baked", palettes: ["vanilla", "butter", "cocoa"] },
        squareCracker: { label: "Square cracker", material: "baked", palettes: ["limeGreen"] },
        dogBone: { label: "Dog-bone biscuit", material: "baked", palettes: ["lightBrown"] },
        waferRoll: { label: "Rolled wafer", material: "baked", palettes: ["vanilla", "cocoa", "pink"] },
        ringCookie: { label: "Ring cookie", material: "baked", palettes: ["butter", "oat", "cocoa"] },
        chunkFragment: { label: "Chunk fragment", material: "baked", palettes: ["butter", "cocoa", "darkCocoa"] }
      }
    },
    chip: {
      label: "Chips",
      shapes: {
        tortillaTriangle: { label: "Tortilla triangle", material: "fried", palettes: ["cornYellow", "cheeseOrange", "blueCorn", "chiliRed"] },
        potatoSlice: { label: "Potato slice", material: "fried", palettes: ["potatoPale", "friedGold", "cheeseOrange"] },
        potatoWedge: { label: "Potato wedge", material: "fried", palettes: ["potatoPale", "cheeseOrange"] },
        ridgedSlice: { label: "Ridged slice", material: "fried", palettes: ["potatoPale", "friedGold", "cheeseOrange"] },
        kettleFold: { label: "Kettle fold", material: "fried", palettes: ["friedGold", "russet", "cheeseOrange"] },
        saddleCrisp: { label: "Saddle crisp", material: "fried", palettes: ["potatoPale", "cheeseOrange", "cornYellow"] },
        cornScoop: { label: "Corn scoop", material: "fried", palettes: ["cornYellow", "cheeseOrange", "blueCorn"] },
        cornCurl: { label: "Corn curl", material: "fried", palettes: ["cheeseOrange", "cornYellow", "chiliRed"] }
      }
    },
    candy: {
      label: "Candy",
      shapes: {
        lentil: { label: "Candy lentil", material: "hard", palettes: ["rainbow", "berry", "tropical", "red", "yellow", "blue"] },
        jellyBean: { label: "Jelly bean", material: "gummy", palettes: ["rainbow", "berry", "tropical", "red", "orange", "green", "purple"] },
        gummyBear: { label: "Gummy bear", material: "gummy", palettes: ["rainbow", "red", "orange", "yellow", "green", "blue"] },
        gummyWorm: { label: "Gummy worm", material: "gummy", palettes: ["rainbow", "berry", "tropical"] },
        gummyRing: { label: "Gummy ring", material: "gummy", palettes: ["rainbow", "red", "orange", "green", "blue"] },
        gummyBottle: { label: "Gummy bottle", material: "gummy", palettes: ["amber", "red", "green", "blue"] },
        pebble: { label: "Candy pebble", material: "hard", palettes: ["rainbow", "berry", "tropical"] },
        gummyCluster: { label: "Gummy cluster", material: "mixed", palettes: ["rainbow", "berry", "tropical"] },
        candyRope: { label: "Candy rope", material: "mixed", palettes: ["rainbow", "berry", "tropical"] },
        candyCorn: { label: "Candy corn", material: "soft", palettes: ["orange"] },
        swirlDisc: { label: "Swirl disc", material: "hard", palettes: ["mintWhite", "rainbow", "berry"] },
        hardRing: { label: "Hard ring", material: "hard", palettes: ["red", "orange", "yellow", "green", "blue", "purple", "amber"] },
        hardLozenge: { label: "Hard lozenge", material: "hard", palettes: ["red", "green", "purple", "amber"] },
        licoriceTwist: { label: "Licorice twist", material: "soft", palettes: ["red", "black"] },
        caramelPillow: { label: "Caramel pillow", material: "soft", palettes: ["caramel", "amber"] },
        chocolateDrop: { label: "Chocolate drop", material: "chocolate", palettes: ["milkChocolate", "darkChocolate", "whiteChocolate"] },
        chocolateCup: { label: "Chocolate cup", material: "chocolate", palettes: ["milkChocolate", "darkChocolate", "whiteChocolate"] },
        mintDisc: { label: "Mint disc", material: "hard", palettes: ["mintWhite", "pink", "green"] },
        gumdrop: { label: "Gumdrop", material: "gummy", palettes: ["rainbow", "red", "orange", "yellow", "green", "purple"] }
      }
    }
  });

  function hashSeed(value) {
    const text = String(value == null ? 1 : value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function randomFrom(seed) {
    let state = hashSeed(seed) || 1;
    return function random() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function element(name, attributes, text) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attributes || {}).forEach(([key, value]) => {
      if (value != null) node.setAttribute(key, String(value));
    });
    if (text != null) node.textContent = text;
    return node;
  }

  function append(parent, ...children) {
    children.flat().filter(Boolean).forEach((child) => parent.appendChild(child));
    return parent;
  }

  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16)
    };
  }

  function shade(hex, amount) {
    const rgb = hexToRgb(hex);
    const adjust = (channel) => Math.max(0, Math.min(255, channel + amount));
    return `#${[adjust(rgb.r), adjust(rgb.g), adjust(rgb.b)].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  }

  // `dim` (0..1) buries a piece: everything darkens toward black so pieces deep
  // in a pile fall away from the light instead of reading as one flat layer.
  function resolvePalette(key, random, dim) {
    const source = PALETTES[key] || PALETTES.butter;
    const colors = source.colors || [source.base];
    const base = colors[Math.floor(random() * colors.length) % colors.length];
    const depth = dim ? -Math.round(Math.min(1, Math.max(0, dim)) * 78) : 0;
    const bury = (hex) => (depth ? shade(hex, depth) : hex);
    return {
      key,
      label: source.label,
      colors: depth ? colors.map(bury) : colors,
      base: bury(base),
      light: bury(source.light || shade(base, 46)),
      dark: bury(source.dark || shade(base, -62)),
      accent: bury(source.accent || shade(base, 70))
    };
  }

  function pointPath(points, close = true) {
    if (!points.length) return "";
    const first = points[0];
    let path = `M ${first[0]} ${first[1]}`;
    points.slice(1).forEach((point) => { path += ` L ${point[0]} ${point[1]}`; });
    return close ? `${path} Z` : path;
  }

  // Polygon with rounded corners, used where a piece needs a recognisable
  // straight-edged silhouette that still varies from instance to instance.
  function roundedPolygon(corners, radius) {
    const toward = (from, to) => {
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const length = Math.hypot(dx, dy) || 1;
      const step = Math.min(radius, length * 0.42) / length;
      return [+(from[0] + dx * step).toFixed(2), +(from[1] + dy * step).toFixed(2)];
    };
    let path = "";
    corners.forEach((corner, index) => {
      const previous = corners[(index - 1 + corners.length) % corners.length];
      const next = corners[(index + 1) % corners.length];
      const entry = toward(corner, previous);
      const exit = toward(corner, next);
      path += `${index ? " L" : "M"} ${entry[0]} ${entry[1]} Q ${corner[0].toFixed(2)} ${corner[1].toFixed(2)} ${exit[0]} ${exit[1]}`;
    });
    return `${path} Z`;
  }

  function smoothBlob(random, cx, cy, rx, ry, count = 18, jitter = 0.1) {
    const points = [];
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const variance = 1 + (random() - 0.5) * jitter * 2;
      points.push([cx + Math.cos(angle) * rx * variance, cy + Math.sin(angle) * ry * variance]);
    }
    const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const start = midpoint(points[points.length - 1], points[0]);
    let path = `M ${start[0]} ${start[1]}`;
    points.forEach((point, index) => {
      const next = points[(index + 1) % points.length];
      const mid = midpoint(point, next);
      path += ` Q ${point[0]} ${point[1]} ${mid[0]} ${mid[1]}`;
    });
    return `${path} Z`;
  }

  // A piece is drawn in its own upright frame and then rotated into the pile, so
  // every lighting cue has to be counter-rotated by that same angle. Otherwise
  // each tumbled piece is lit from its own private direction and the pile stops
  // reading as one scene under one light. Gradients use userSpaceOnUse (the
  // piece's square 0..100 box) so the counter-rotation stays a true rotation
  // instead of being skewed by each path's bounding box.
  function counterRotate(x, y, radians) {
    const dx = x - 50;
    const dy = y - 50;
    const cos = Math.cos(-radians);
    const sin = Math.sin(-radians);
    return [
      +(50 + dx * cos - dy * sin).toFixed(2),
      +(50 + dx * sin + dy * cos).toFixed(2)
    ];
  }

  // Local offset that points straight down in world space once the piece has
  // been rotated by `radians`. Used for both the cast shadow and the extruded
  // edge, so a piece's thickness and its shadow always agree with gravity.
  function worldDown(distance, radians) {
    return [
      +(distance * Math.sin(radians)).toFixed(2),
      +(distance * Math.cos(radians)).toFixed(2)
    ];
  }

  function materialDefs(svg, id, palette, material, radians) {
    const defs = element("defs");
    const [x1, y1] = counterRotate(18, 8, radians);
    const [x2, y2] = counterRotate(82, 92, radians);
    const baseGradient = element("linearGradient", {
      id: `${id}-base`, gradientUnits: "userSpaceOnUse", x1, y1, x2, y2
    });
    append(baseGradient,
      element("stop", { offset: "0%", "stop-color": palette.light }),
      element("stop", { offset: "46%", "stop-color": palette.base }),
      element("stop", { offset: "100%", "stop-color": palette.dark })
    );
    const [glossX, glossY] = counterRotate(32, 24, radians);
    const gloss = element("radialGradient", {
      id: `${id}-gloss`, gradientUnits: "userSpaceOnUse", cx: glossX, cy: glossY, r: 78
    });
    append(gloss,
      element("stop", { offset: "0%", "stop-color": palette.light, "stop-opacity": material === "gummy" ? 0.95 : 0.78 }),
      element("stop", { offset: "32%", "stop-color": palette.base, "stop-opacity": material === "gummy" ? 0.82 : 1 }),
      element("stop", { offset: "100%", "stop-color": palette.dark, "stop-opacity": material === "gummy" ? 0.88 : 1 })
    );
    const [shadowX, shadowY] = worldDown(3.2, radians);
    const shadow = element("filter", { id: `${id}-shadow`, x: "-45%", y: "-45%", width: "190%", height: "190%" });
    append(shadow,
      element("feDropShadow", { dx: shadowX, dy: shadowY, stdDeviation: "2.6", "flood-color": "#000000", "flood-opacity": "0.48" })
    );
    append(defs, baseGradient, gloss, shadow);
    svg.appendChild(defs);
    return {
      fill: material === "gummy" || material === "hard" ? `url(#${id}-gloss)` : `url(#${id}-base)`,
      shadow: `url(#${id}-shadow)`
    };
  }

  function addSpecks(group, context, count, bounds, colors) {
    const palette = colors || [context.palette.dark, context.palette.light];
    for (let index = 0; index < count; index += 1) {
      const x = bounds.x + context.random() * bounds.width;
      const y = bounds.y + context.random() * bounds.height;
      const radius = 0.7 + context.random() * 1.45;
      group.appendChild(element("circle", {
        cx: x,
        cy: y,
        r: radius,
        fill: palette[index % palette.length],
        opacity: 0.34 + context.random() * 0.38
      }));
    }
  }

  function addGloss(group, path, opacity = 0.48) {
    group.appendChild(element("path", {
      d: path,
      fill: "none",
      stroke: "#ffffff",
      "stroke-width": "3",
      "stroke-linecap": "round",
      opacity
    }));
  }

  function renderRoundDrop(group, context) {
    const body = smoothBlob(context.random, 50, 51, 35, 32, 22, 0.08);
    group.appendChild(element("path", { d: body, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.3 }));
    addSpecks(group, context, 18, { x: 23, y: 27, width: 54, height: 48 }, [context.palette.accent, context.palette.dark]);
    addGloss(group, "M 27 39 Q 38 26 52 27", 0.28);
  }

  function scallopedPath(cx, cy, radius, points = 24) {
    const values = [];
    for (let index = 0; index < points; index += 1) {
      const angle = (Math.PI * 2 * index) / points;
      const r = radius * (index % 2 ? 0.94 : 1);
      values.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    }
    return pointPath(values);
  }

  function renderSandwichRound(group, context) {
    group.appendChild(element("ellipse", { cx: 50, cy: 57, rx: 33, ry: 12, fill: context.palette.dark, opacity: 0.72 }));
    group.appendChild(element("ellipse", { cx: 50, cy: 53, rx: 33, ry: 11, fill: context.palette.accent, stroke: context.palette.dark, "stroke-width": 1.5 }));
    group.appendChild(element("path", { d: scallopedPath(50, 43, 34), fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2 }));
    append(group,
      element("circle", { cx: 50, cy: 43, r: 22, fill: "none", stroke: context.palette.dark, "stroke-width": 1.5, opacity: 0.72 }),
      element("circle", { cx: 50, cy: 43, r: 10, fill: "none", stroke: context.palette.dark, "stroke-width": 1.5, opacity: 0.72 })
    );
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      group.appendChild(element("circle", { cx: 50 + Math.cos(angle) * 16, cy: 43 + Math.sin(angle) * 16, r: 1.7, fill: context.palette.dark, opacity: 0.66 }));
    }
  }

  function renderSandwichOval(group, context) {
    append(group,
      element("ellipse", { cx: 50, cy: 56, rx: 37, ry: 20, fill: context.palette.dark, opacity: 0.72 }),
      element("ellipse", { cx: 50, cy: 52, rx: 37, ry: 19, fill: context.palette.accent, stroke: context.palette.dark, "stroke-width": 1.5 }),
      element("ellipse", { cx: 50, cy: 45, rx: 37, ry: 20, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2 }),
      element("ellipse", { cx: 50, cy: 45, rx: 27, ry: 12, fill: "none", stroke: context.palette.dark, "stroke-width": 1.4, opacity: 0.58 })
    );
    addSpecks(group, context, 6, { x: 27, y: 37, width: 46, height: 16 }, [context.palette.dark]);
  }

  function renderEmbossedRect(group, context) {
    append(group,
      element("rect", { x: 17, y: 24, width: 66, height: 52, rx: 8, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2 }),
      element("rect", { x: 24, y: 31, width: 52, height: 38, rx: 5, fill: "none", stroke: context.palette.dark, "stroke-width": 1.6, opacity: 0.62 }),
      element("path", { d: "M 34 54 Q 50 35 66 54 Q 50 64 34 54 Z", fill: "none", stroke: context.palette.dark, "stroke-width": 1.7, opacity: 0.7 })
    );
    addSpecks(group, context, 8, { x: 25, y: 32, width: 50, height: 34 }, [context.palette.dark]);
  }

  function renderSquareCracker(group, context) {
    append(group,
      element("rect", { x: 18, y: 18, width: 64, height: 64, rx: 7, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2 }),
      element("rect", { x: 24, y: 24, width: 52, height: 52, rx: 4, fill: "none", stroke: context.palette.dark, "stroke-width": 1.4, opacity: 0.54 })
    );
    [[36, 36], [64, 36], [36, 64], [64, 64]].forEach(([cx, cy]) => {
      group.appendChild(element("circle", { cx, cy, r: 2.7, fill: context.palette.dark, opacity: 0.68 }));
    });
    addSpecks(group, context, 7, { x: 27, y: 27, width: 46, height: 46 }, [context.palette.dark]);
  }

  function renderDogBone(group, context) {
    const body = "M 29 34 C 23 25 13 27 13 36 C 13 42 17 46 23 47 L 23 53 C 17 54 13 58 13 64 C 13 73 23 75 29 66 L 71 66 C 77 75 87 73 87 64 C 87 58 83 54 77 53 L 77 47 C 83 46 87 42 87 36 C 87 27 77 25 71 34 Z";
    append(group,
      element("path", { d: body, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2 }),
      element("path", { d: "M 32 40 Q 50 35 68 40 M 32 60 Q 50 65 68 60", fill: "none", stroke: context.palette.dark, "stroke-width": 1.5, opacity: 0.42 })
    );
    addSpecks(group, context, 8, { x: 27, y: 36, width: 46, height: 28 }, [context.palette.dark]);
  }

  function renderWaferRoll(group, context) {
    const roll = element("g", { transform: "rotate(-18 50 50)" });
    append(roll,
      element("rect", { x: 14, y: 33, width: 72, height: 34, rx: 16, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2 }),
      element("ellipse", { cx: 84, cy: 50, rx: 8, ry: 16, fill: context.palette.dark, stroke: context.palette.light, "stroke-width": 2 }),
      element("ellipse", { cx: 84, cy: 50, rx: 3.2, ry: 8, fill: "#27140d" })
    );
    for (let x = 20; x < 80; x += 12) {
      roll.appendChild(element("path", { d: `M ${x} 34 L ${x + 18} 66`, stroke: context.palette.dark, "stroke-width": 3, opacity: 0.5 }));
      roll.appendChild(element("path", { d: `M ${x + 4} 34 L ${x + 22} 66`, stroke: context.palette.light, "stroke-width": 1, opacity: 0.5 }));
    }
    group.appendChild(roll);
  }

  function renderRingCookie(group, context) {
    const outer = smoothBlob(context.random, 50, 50, 35, 34, 20, 0.05);
    group.appendChild(element("path", { d: `${outer} M 50 35 A 15 15 0 1 0 50 65 A 15 15 0 1 0 50 35`, "fill-rule": "evenodd", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2 }));
    addSpecks(group, context, 12, { x: 22, y: 22, width: 56, height: 56 }, [context.palette.dark]);
  }

  function renderChunkFragment(group, context) {
    const body = "M 16 33 Q 30 20 46 26 L 58 17 Q 79 23 84 42 L 76 54 Q 83 69 65 79 L 48 72 Q 31 84 19 67 L 24 51 Z";
    group.appendChild(element("path", { d: body, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.3 }));
    addSpecks(group, context, 16, { x: 24, y: 26, width: 52, height: 46 }, [context.palette.accent, context.palette.dark]);
  }

  function renderTortillaTriangle(group, context) {
    // Scalene rather than equilateral, and re-drawn per piece, so a window full
    // of triangles does not read as the same stamp repeated.
    const corners = [];
    for (let index = 0; index < 3; index += 1) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 3 + (context.random() - 0.5) * 0.5;
      const reach = 40 * (0.85 + context.random() * 0.3);
      corners.push([50 + Math.cos(angle) * reach, 52 + Math.sin(angle) * reach * 0.97]);
    }
    group.appendChild(element("path", {
      d: roundedPolygon(corners, 8 + context.random() * 7),
      fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2
    }));
    const middle = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const foldFrom = middle(corners[0], corners[1]);
    const foldTo = middle(corners[1], corners[2]);
    const edgeFrom = middle(corners[2], corners[0]);
    append(group,
      element("path", { d: `M ${foldFrom[0].toFixed(2)} ${foldFrom[1].toFixed(2)} Q 50 52 ${foldTo[0].toFixed(2)} ${foldTo[1].toFixed(2)}`, fill: "none", stroke: context.palette.light, "stroke-width": 3, opacity: 0.45 }),
      element("path", { d: `M ${edgeFrom[0].toFixed(2)} ${edgeFrom[1].toFixed(2)} Q 50 62 ${foldTo[0].toFixed(2)} ${foldTo[1].toFixed(2)}`, fill: "none", stroke: context.palette.dark, "stroke-width": 2, opacity: 0.34 })
    );
    addSpecks(group, context, 14, { x: 30, y: 34, width: 42, height: 36 });
  }

  function renderPotatoSlice(group, context) {
    const body = smoothBlob(context.random, 50, 51, 37, 30, 18, 0.14);
    group.appendChild(element("path", { d: body, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.1 }));
    append(group,
      element("path", { d: "M 23 46 Q 45 30 76 43", fill: "none", stroke: context.palette.light, "stroke-width": 4, opacity: 0.44 }),
      element("path", { d: "M 30 68 Q 55 75 74 58", fill: "none", stroke: context.palette.dark, "stroke-width": 2.4, opacity: 0.35 })
    );
    addSpecks(group, context, 11, { x: 25, y: 31, width: 50, height: 39 });
  }

  function renderPotatoWedge(group, context) {
    append(group,
      element("path", { d: "M 16 66 Q 38 22 79 27 Q 89 32 83 44 Q 68 71 25 78 Q 14 77 16 66 Z", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.4 }),
      element("path", { d: "M 23 67 Q 45 35 78 34 Q 64 62 25 72", fill: context.palette.light, opacity: 0.36 }),
      element("path", { d: "M 22 74 Q 53 77 82 42", fill: "none", stroke: context.palette.dark, "stroke-width": 3, opacity: 0.5 })
    );
    addSpecks(group, context, 10, { x: 31, y: 37, width: 43, height: 28 });
  }

  function renderRidgedSlice(group, context) {
    const body = smoothBlob(context.random, 50, 50, 37, 31, 18, 0.1);
    group.appendChild(element("path", { d: body, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2 }));
    for (let x = 24; x <= 76; x += 8) {
      group.appendChild(element("path", { d: `M ${x} 28 Q ${x - 7} 50 ${x} 72`, fill: "none", stroke: x % 16 ? context.palette.dark : context.palette.light, "stroke-width": 2.3, opacity: 0.42 }));
    }
    addSpecks(group, context, 8, { x: 27, y: 31, width: 46, height: 38 });
  }

  function renderKettleFold(group, context) {
    append(group,
      element("path", { d: "M 17 31 Q 48 12 82 35 Q 74 50 84 67 Q 57 84 20 69 Q 30 50 17 31 Z", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.3 }),
      element("path", { d: "M 18 32 Q 50 50 83 35 Q 58 41 35 67 Q 31 48 18 32 Z", fill: context.palette.dark, opacity: 0.28 }),
      element("path", { d: "M 24 31 Q 49 44 76 35", fill: "none", stroke: context.palette.light, "stroke-width": 3, opacity: 0.55 })
    );
    addSpecks(group, context, 12, { x: 26, y: 28, width: 49, height: 42 });
  }

  function renderSaddleCrisp(group, context) {
    append(group,
      element("path", { d: "M 16 35 Q 49 8 84 35 Q 72 53 84 68 Q 51 91 16 68 Q 30 51 16 35 Z", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2 }),
      element("path", { d: "M 21 36 Q 50 25 79 36", fill: "none", stroke: context.palette.light, "stroke-width": 4, opacity: 0.5 }),
      element("path", { d: "M 22 68 Q 50 56 79 68", fill: "none", stroke: context.palette.dark, "stroke-width": 3, opacity: 0.35 })
    );
    addSpecks(group, context, 9, { x: 28, y: 35, width: 44, height: 34 });
  }

  function renderCornScoop(group, context) {
    append(group,
      element("path", { d: "M 20 33 Q 50 15 80 33 L 72 75 Q 50 88 28 75 Z", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.3 }),
      element("ellipse", { cx: 50, cy: 34, rx: 30, ry: 12, fill: context.palette.dark, opacity: 0.5 }),
      element("ellipse", { cx: 50, cy: 32, rx: 25, ry: 8, fill: context.palette.light, opacity: 0.38 }),
      element("path", { d: "M 30 40 Q 50 49 70 40", fill: "none", stroke: context.palette.light, "stroke-width": 2.5, opacity: 0.45 })
    );
    addSpecks(group, context, 8, { x: 31, y: 47, width: 38, height: 27 });
  }

  function renderCornCurl(group, context) {
    // One jittered spine drawn twice: a fat dark pass for the shaded underside
    // and a thinner lit pass on top. Because the two passes share the same
    // jittered control points the curl keeps a consistent thickness, and no two
    // curls hook the same way.
    const wobble = (amount) => (context.random() - 0.5) * amount;
    const spine = `M ${(25 + wobble(7)).toFixed(2)} ${(26 + wobble(7)).toFixed(2)}` +
      ` C ${(76 + wobble(10)).toFixed(2)} ${(14 + wobble(7)).toFixed(2)}` +
      ` ${(80 + wobble(9)).toFixed(2)} ${(59 + wobble(9)).toFixed(2)}` +
      ` ${(51 + wobble(9)).toFixed(2)} ${(66 + wobble(7)).toFixed(2)}` +
      ` C ${(30 + wobble(6)).toFixed(2)} ${(71 + wobble(6)).toFixed(2)}` +
      ` ${(25 + wobble(6)).toFixed(2)} ${(58 + wobble(6)).toFixed(2)}` +
      ` ${(35 + wobble(6)).toFixed(2)} ${(49 + wobble(6)).toFixed(2)}`;
    const [dx, dy] = worldDown(2.6, context.radians);
    group.appendChild(element("path", { d: spine, transform: `translate(${dx} ${dy})`, fill: "none", stroke: context.palette.dark, "stroke-width": 24, "stroke-linecap": "round", opacity: 0.9 }));
    group.appendChild(element("path", { d: spine, fill: "none", stroke: context.fill, "stroke-width": 20, "stroke-linecap": "round" }));
    addSpecks(group, context, 13, { x: 26, y: 25, width: 48, height: 41 });
    context.edged = true;
  }

  function renderLentil(group, context) {
    append(group,
      element("ellipse", { cx: 50, cy: 53, rx: 35, ry: 27, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2 }),
      element("ellipse", { cx: 40, cy: 40, rx: 12, ry: 7, fill: context.palette.light, opacity: 0.54 })
    );
  }

  function renderJellyBean(group, context) {
    append(group,
      element("path", { d: "M 20 55 C 18 31 38 18 55 26 C 70 18 86 34 79 51 C 84 69 66 82 50 72 C 35 82 22 71 20 55 Z", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2, opacity: 0.9 }),
      element("path", { d: "M 31 42 Q 42 28 55 33", fill: "none", stroke: "#ffffff", "stroke-width": 4, "stroke-linecap": "round", opacity: 0.45 })
    );
  }

  function renderGummyBear(group, context) {
    const attrs = { fill: context.fill, stroke: context.palette.dark, "stroke-width": 1.6, opacity: 0.88 };
    append(group,
      element("circle", { cx: 34, cy: 27, r: 9, ...attrs }),
      element("circle", { cx: 66, cy: 27, r: 9, ...attrs }),
      element("circle", { cx: 50, cy: 36, r: 21, ...attrs }),
      element("ellipse", { cx: 50, cy: 64, rx: 25, ry: 27, ...attrs }),
      element("ellipse", { cx: 25, cy: 59, rx: 9, ry: 18, transform: "rotate(25 25 59)", ...attrs }),
      element("ellipse", { cx: 75, cy: 59, rx: 9, ry: 18, transform: "rotate(-25 75 59)", ...attrs }),
      element("ellipse", { cx: 37, cy: 84, rx: 10, ry: 13, ...attrs }),
      element("ellipse", { cx: 63, cy: 84, rx: 10, ry: 13, ...attrs }),
      element("ellipse", { cx: 42, cy: 31, rx: 7, ry: 4, fill: "#ffffff", opacity: 0.38 })
    );
  }

  function renderGummyWorm(group, context) {
    const colors = context.palette.colors;
    const points = [[19, 62], [30, 48], [43, 42], [57, 47], [69, 61], [79, 49]];
    points.forEach((point, index) => {
      const color = colors[index % colors.length];
      group.appendChild(element("circle", { cx: point[0], cy: point[1], r: 13, fill: color, stroke: shade(color, -55), "stroke-width": 1.5, opacity: 0.88 }));
      group.appendChild(element("circle", { cx: point[0] - 4, cy: point[1] - 5, r: 3.2, fill: "#ffffff", opacity: 0.34 }));
    });
  }

  function renderGummyRing(group, context) {
    group.appendChild(element("path", { d: "M 50 14 A 36 36 0 1 0 50 86 A 36 36 0 1 0 50 14 M 50 34 A 16 16 0 1 1 50 66 A 16 16 0 1 1 50 34", "fill-rule": "evenodd", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2, opacity: 0.9 }));
    addGloss(group, "M 27 39 Q 39 22 54 24", 0.42);
    addSpecks(group, context, 18, { x: 22, y: 22, width: 56, height: 56 }, ["#ffffff", context.palette.light]);
  }

  function renderGummyBottle(group, context) {
    append(group,
      element("path", { d: "M 38 13 H 62 L 64 27 Q 75 34 74 49 V 78 Q 74 87 64 88 H 36 Q 26 87 26 78 V 49 Q 25 34 36 27 Z", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2, opacity: 0.9 }),
      element("rect", { x: 37, y: 13, width: 26, height: 12, rx: 4, fill: context.palette.dark, opacity: 0.5 }),
      element("path", { d: "M 35 42 Q 39 31 48 29", fill: "none", stroke: "#ffffff", "stroke-width": 4, "stroke-linecap": "round", opacity: 0.4 })
    );
  }

  function renderPebble(group, context) {
    const body = smoothBlob(context.random, 50, 51, 32, 28, 13, 0.22);
    group.appendChild(element("path", { d: body, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2 }));
    addGloss(group, "M 32 42 Q 42 30 55 33", 0.43);
  }

  function renderGummyCluster(group, context) {
    group.appendChild(element("circle", { cx: 50, cy: 52, r: 27, fill: context.palette.dark, opacity: 0.72 }));
    const colors = context.palette.colors;
    for (let index = 0; index < 30; index += 1) {
      const angle = context.random() * Math.PI * 2;
      const distance = Math.sqrt(context.random()) * 29;
      const color = colors[index % colors.length];
      group.appendChild(element("circle", { cx: 50 + Math.cos(angle) * distance, cy: 52 + Math.sin(angle) * distance, r: 5 + context.random() * 2, fill: color, stroke: shade(color, -48), "stroke-width": 1 }));
    }
    addGloss(group, "M 31 39 Q 42 27 54 31", 0.38);
  }

  function renderCandyRope(group, context) {
    group.appendChild(element("path", { d: "M 18 70 C 25 24 70 23 82 68", fill: "none", stroke: context.palette.colors[0], "stroke-width": 15, "stroke-linecap": "round" }));
    const colors = context.palette.colors;
    for (let index = 0; index < 23; index += 1) {
      const t = index / 22;
      const x = 18 + 64 * t;
      const y = 70 - Math.sin(t * Math.PI) * 39;
      const color = colors[index % colors.length];
      group.appendChild(element("circle", { cx: x, cy: y, r: 5.2, fill: color, stroke: shade(color, -45), "stroke-width": 0.9 }));
    }
  }

  function renderCandyCorn(group) {
    const clipId = `corn-${instanceId}`;
    const defs = element("defs");
    const clip = element("clipPath", { id: clipId });
    clip.appendChild(element("path", { d: "M 50 12 Q 56 17 62 29 L 84 80 Q 85 88 76 89 H 24 Q 15 88 16 80 L 38 29 Q 44 17 50 12 Z" }));
    defs.appendChild(clip);
    group.appendChild(defs);
    const layers = element("g", { "clip-path": `url(#${clipId})` });
    append(layers,
      element("rect", { x: 12, y: 10, width: 76, height: 28, fill: "#f5ebcf" }),
      element("rect", { x: 12, y: 38, width: 76, height: 29, fill: "#e87927" }),
      element("rect", { x: 12, y: 67, width: 76, height: 25, fill: "#e7bd2c" })
    );
    group.appendChild(layers);
    group.appendChild(element("path", { d: "M 50 12 Q 56 17 62 29 L 84 80 Q 85 88 76 89 H 24 Q 15 88 16 80 L 38 29 Q 44 17 50 12 Z", fill: "none", stroke: "#9b5a21", "stroke-width": 2 }));
    addGloss(group, "M 43 22 Q 38 43 28 70", 0.34);
  }

  function renderSwirlDisc(group, context) {
    append(group,
      element("circle", { cx: 50, cy: 50, r: 35, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2 }),
      element("path", { d: "M 50 50 C 52 42 63 43 64 52 C 65 67 44 73 32 62 C 14 46 31 19 55 20 C 79 21 90 48 77 67", fill: "none", stroke: context.palette.accent, "stroke-width": 8, "stroke-linecap": "round" })
    );
    addGloss(group, "M 29 39 Q 39 24 53 25", 0.45);
  }

  function renderHardRing(group, context) {
    group.appendChild(element("path", { d: "M 50 14 A 36 36 0 1 0 50 86 A 36 36 0 1 0 50 14 M 50 35 A 15 15 0 1 1 50 65 A 15 15 0 1 1 50 35", "fill-rule": "evenodd", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2 }));
    addGloss(group, "M 28 38 Q 40 22 55 25", 0.64);
  }

  function renderHardLozenge(group, context) {
    append(group,
      element("rect", { x: 17, y: 28, width: 66, height: 44, rx: 15, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2, transform: "rotate(-8 50 50)" }),
      element("path", { d: "M 31 38 Q 45 28 59 32", fill: "none", stroke: "#ffffff", "stroke-width": 4, "stroke-linecap": "round", opacity: 0.48 })
    );
  }

  function renderLicoriceTwist(group, context) {
    append(group,
      element("rect", { x: 18, y: 36, width: 64, height: 28, rx: 14, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2, transform: "rotate(-12 50 50)" })
    );
    for (let x = 24; x < 78; x += 10) {
      group.appendChild(element("path", { d: `M ${x} 34 L ${x + 14} 64`, stroke: context.palette.light, "stroke-width": 3, opacity: 0.38, transform: "rotate(-12 50 50)" }));
    }
  }

  function renderCaramelPillow(group, context) {
    append(group,
      element("path", { d: "M 21 33 Q 27 24 39 28 Q 50 19 61 28 Q 75 24 80 35 Q 87 49 79 64 Q 74 76 62 72 Q 50 82 38 72 Q 24 77 19 65 Q 11 50 21 33 Z", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2 }),
      element("path", { d: "M 31 39 Q 47 27 62 35", fill: "none", stroke: context.palette.light, "stroke-width": 4, "stroke-linecap": "round", opacity: 0.45 })
    );
  }

  function renderChocolateDrop(group, context) {
    append(group,
      element("path", { d: "M 50 12 C 58 31 77 40 78 59 C 80 80 64 88 50 88 C 36 88 20 80 22 59 C 23 40 42 31 50 12 Z", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2 }),
      element("path", { d: "M 41 31 Q 32 45 34 61", fill: "none", stroke: context.palette.light, "stroke-width": 4, "stroke-linecap": "round", opacity: 0.32 })
    );
  }

  function renderChocolateCup(group, context) {
    append(group,
      element("path", { d: "M 20 32 H 80 L 72 81 H 28 Z", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2.2 }),
      element("ellipse", { cx: 50, cy: 32, rx: 30, ry: 12, fill: context.palette.light, stroke: context.palette.dark, "stroke-width": 2 }),
      element("ellipse", { cx: 50, cy: 31, rx: 23, ry: 7, fill: context.palette.base, opacity: 0.78 })
    );
    for (let x = 29; x <= 71; x += 7) group.appendChild(element("path", { d: `M ${x} 42 L ${x + (x < 50 ? 4 : -4)} 78`, stroke: context.palette.dark, "stroke-width": 1.5, opacity: 0.42 }));
  }

  function renderMintDisc(group, context) {
    append(group,
      element("circle", { cx: 50, cy: 50, r: 35, fill: context.fill, stroke: context.palette.dark, "stroke-width": 2 }),
      element("path", { d: "M 49 15 L 58 42 L 83 30 L 64 51 L 84 70 L 58 59 L 49 85 L 42 59 L 17 70 L 36 51 L 17 30 L 42 42 Z", fill: context.palette.accent, opacity: 0.95 })
    );
    addGloss(group, "M 28 39 Q 39 23 55 25", 0.43);
  }

  function renderGumdrop(group, context) {
    append(group,
      element("path", { d: "M 18 76 Q 23 29 40 20 Q 50 13 60 20 Q 77 29 82 76 Q 72 87 50 88 Q 28 87 18 76 Z", fill: context.fill, stroke: context.palette.dark, "stroke-width": 2, opacity: 0.9 }),
      element("path", { d: "M 33 36 Q 41 23 51 24", fill: "none", stroke: "#ffffff", "stroke-width": 4, "stroke-linecap": "round", opacity: 0.38 })
    );
    addSpecks(group, context, 26, { x: 24, y: 25, width: 52, height: 55 }, ["#ffffff", context.palette.light]);
  }

  const RENDERERS = {
    roundDrop: renderRoundDrop,
    sandwichRound: renderSandwichRound,
    sandwichOval: renderSandwichOval,
    embossedRect: renderEmbossedRect,
    squareCracker: renderSquareCracker,
    dogBone: renderDogBone,
    waferRoll: renderWaferRoll,
    ringCookie: renderRingCookie,
    chunkFragment: renderChunkFragment,
    tortillaTriangle: renderTortillaTriangle,
    potatoSlice: renderPotatoSlice,
    potatoWedge: renderPotatoWedge,
    ridgedSlice: renderRidgedSlice,
    kettleFold: renderKettleFold,
    saddleCrisp: renderSaddleCrisp,
    cornScoop: renderCornScoop,
    cornCurl: renderCornCurl,
    lentil: renderLentil,
    jellyBean: renderJellyBean,
    gummyBear: renderGummyBear,
    gummyWorm: renderGummyWorm,
    gummyRing: renderGummyRing,
    gummyBottle: renderGummyBottle,
    pebble: renderPebble,
    gummyCluster: renderGummyCluster,
    candyRope: renderCandyRope,
    candyCorn: renderCandyCorn,
    swirlDisc: renderSwirlDisc,
    hardRing: renderHardRing,
    hardLozenge: renderHardLozenge,
    licoriceTwist: renderLicoriceTwist,
    caramelPillow: renderCaramelPillow,
    chocolateDrop: renderChocolateDrop,
    chocolateCup: renderChocolateCup,
    mintDisc: renderMintDisc,
    gumdrop: renderGumdrop
  };

  function shapeEntry(type, shape) {
    const typeEntry = CATALOG[type];
    if (!typeEntry) throw new Error(`Unknown snack type: ${type}`);
    const entry = typeEntry.shapes[shape];
    if (!entry) throw new Error(`Unknown ${type} shape: ${shape}`);
    return entry;
  }

  // Materials that are drawn as a single solid body get a free extruded edge: a
  // dark copy of the body offset in the direction of gravity, which gives the
  // piece a visible thickness instead of leaving it paper flat. Multi-part
  // materials (gummy bears, clusters, ropes) draw a limb first, so they opt out.
  const EXTRUDED_MATERIALS = Object.freeze(["baked", "fried", "hard", "soft", "chocolate"]);

  function addExtrudedEdge(group, palette, radians) {
    const body = group.firstElementChild;
    if (!body) return;
    const [dx, dy] = worldDown(1.5, radians);
    const edge = body.cloneNode(false);
    edge.removeAttribute("opacity");
    edge.setAttribute("transform", `translate(${dx} ${dy})`);
    if (edge.getAttribute("fill") !== "none") edge.setAttribute("fill", palette.dark);
    const stroke = edge.getAttribute("stroke");
    if (stroke && stroke !== "none") edge.setAttribute("stroke", palette.dark);
    group.insertBefore(edge, body);
  }

  function create(options) {
    const settings = { type: "cookie", shape: "roundDrop", seed: 1, size: 100, rotation: 0, dim: 0, ...options };
    const entry = shapeEntry(settings.type, settings.shape);
    const random = randomFrom(`${settings.seed}:${settings.type}:${settings.shape}`);
    const paletteKey = entry.palettes.includes(settings.palette) ? settings.palette : entry.palettes[Math.floor(random() * entry.palettes.length)];
    const palette = resolvePalette(paletteKey, random, settings.dim);
    const radians = ((Number(settings.rotation) || 0) * Math.PI) / 180;
    const id = `snack-${++instanceId}`;
    const svg = element("svg", {
      xmlns: SVG_NS,
      viewBox: "0 0 100 100",
      width: settings.size,
      height: settings.size,
      role: settings.decorative ? null : "img",
      "aria-hidden": settings.decorative ? "true" : null,
      "aria-label": settings.decorative ? null : `${palette.label} ${entry.label}`,
      "data-snack-type": settings.type,
      "data-snack-shape": settings.shape,
      "data-snack-palette": paletteKey,
      style: "overflow:visible"
    });
    const material = materialDefs(svg, id, palette, entry.material, radians);
    const group = element("g", { filter: material.shadow });
    const context = { random, palette, fill: material.fill, id, material: entry.material, radians, settings };
    RENDERERS[settings.shape](group, context);
    if (!context.edged && EXTRUDED_MATERIALS.includes(entry.material)) addExtrudedEdge(group, palette, radians);
    svg.appendChild(group);
    return svg;
  }

  function render(target, options) {
    const container = typeof target === "string" ? document.querySelector(target) : target;
    if (!container) throw new Error("SnackShapeEngine.render target was not found");
    const snack = create(options);
    container.replaceChildren(snack);
    return snack;
  }

  // A piece's ink covers roughly the middle of its square box and is wider than
  // it is tall. Approximating it as an ellipse gives the settle a cheap, stable
  // collision proxy; these ratios are what the pile's density metrics assume.
  const INK_RADIUS_X = 0.36;
  const INK_RADIUS_Y = 0.3;

  function inkFootprint(size, rotation) {
    const radians = (rotation * Math.PI) / 180;
    const rx = size * INK_RADIUS_X;
    const ry = size * INK_RADIUS_Y;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return { rx, ry, hw: Math.hypot(rx * cos, ry * sin), hh: Math.hypot(rx * sin, ry * cos) };
  }

  const PILE_DEFAULTS = Object.freeze({
    type: "cookie",
    seed: 1,
    width: 120,
    height: 72,
    pieceScale: 0.48,
    nest: 0.7,
    sink: 0.2,
    fill: 1,
    spread: 0.5,
    maxCount: 90
  });

  /**
   * Fill a container with a gravity-settled heap of pieces.
   *
   * Pieces are dropped one at a time onto a 1-D height field. Each piece falls
   * until its ink ellipse touches the surface, sinks slightly into whatever it
   * landed on, then slides downhill so the heap grows an angle of repose rather
   * than towers. Dropping stops when the surface has risen past the top edge,
   * so density is set by `sink` and `pieceScale` and the piece count is an
   * outcome rather than a number that has to be hand-tuned per product.
   *
   * The field is wider than the viewBox on both sides and its floor sits below
   * the bottom edge, so the heap runs past all four edges and is cropped by the
   * packaging window instead of stopping short of it.
   */
  function renderPile(target, options) {
    const container = typeof target === "string" ? document.querySelector(target) : target;
    if (!container) throw new Error("SnackShapeEngine.renderPile target was not found");
    const settings = { ...PILE_DEFAULTS, ...options };
    const typeEntry = CATALOG[settings.type];
    if (!typeEntry) throw new Error(`Unknown snack type: ${settings.type}`);
    const shapes = settings.shapes && settings.shapes.length ? settings.shapes : Object.keys(typeEntry.shapes);
    const random = randomFrom(`pile:${settings.seed}:${settings.type}`);

    const nominalSize = settings.height * settings.pieceScale;
    const limit = Math.max(1, Math.round(settings.maxCount));
    const margin = nominalSize * settings.spread;
    const originX = -margin;
    const span = settings.width + margin * 2;
    const bins = Math.max(24, Math.round(span / 1.5));
    const binWidth = span / bins;
    const terrain = new Array(bins).fill(settings.height + nominalSize * 0.16);
    const binAt = (x) => Math.min(bins - 1, Math.max(0, Math.floor((x - originX) / binWidth)));
    // Stop once the mean surface inside the window has risen just past the top
    // edge: the heap then crops at the top instead of showing a headspace band.
    const fullLine = settings.height * (1 - settings.fill) - nominalSize * 0.1;
    const firstInside = binAt(0);
    const lastInside = binAt(settings.width);

    // Resting on the single highest bin under the footprint would let one spike
    // hold a piece up, and heaps built that way grow towers with daylight
    // between the pieces. Instead a piece cuts through the highest `nest`
    // fraction of the surface below it and comes to rest on the rest of it,
    // which is what makes real snacks slot into each other's gaps.
    const supportUnder = (x, reach) => {
      const heights = [];
      for (let bin = binAt(x - reach); bin <= binAt(x + reach); bin += 1) heights.push(terrain[bin]);
      heights.sort((a, b) => a - b);
      return heights[Math.min(heights.length - 1, Math.floor(heights.length * settings.nest))];
    };
    const meanSurface = () => {
      let total = 0;
      for (let bin = firstInside; bin <= lastInside; bin += 1) total += terrain[bin];
      return total / (lastInside - firstInside + 1);
    };

    const placements = [];
    for (let index = 0; index < limit; index += 1) {
      if (index >= 6 && meanSurface() <= fullLine) break;
      const shape = shapes[Math.floor(random() * shapes.length) % shapes.length];
      const entry = shapeEntry(settings.type, shape);
      const palette = settings.palettes && settings.palettes.length
        ? settings.palettes[Math.floor(random() * settings.palettes.length) % settings.palettes.length]
        : entry.palettes[Math.floor(random() * entry.palettes.length) % entry.palettes.length];
      const size = nominalSize * (0.86 + random() * 0.3);
      const rotation = +((random() * 2 - 1) * 75).toFixed(2);
      const ink = inkFootprint(size, rotation);
      const sink = ink.hh * settings.sink * (0.8 + random() * 0.4);
      const rough = (random() - 0.5) * nominalSize * 0.06;

      // Aim at the lowest of a few candidate drop points. A bag is filled and
      // then shaken down, so pieces end up finding the hollows rather than
      // landing uniformly; without this the heap crowns in the middle and
      // leaves the top corners of the window bare.
      let x = originX + random() * span;
      let lowest = supportUnder(x, ink.hw);
      for (let attempt = 1; attempt < 3; attempt += 1) {
        const candidate = originX + random() * span;
        const support = supportUnder(candidate, ink.hw);
        if (support > lowest) { lowest = support; x = candidate; }
      }
      let y = 0;
      for (let pass = 0; pass < 3; pass += 1) {
        y = supportUnder(x, ink.hw) - ink.hh + sink;
        if (pass === 2) break;
        // Slide toward whichever half of the footprint is sitting lower.
        const half = ink.hw * 0.5;
        const slope = supportUnder(x + half, half) - supportUnder(x - half, half);
        x += Math.max(-half * 1.2, Math.min(half * 1.2, slope * 0.35));
      }
      x = Math.max(originX, Math.min(originX + span, x));

      let buried = 0;
      placements.forEach((other) => {
        const dx = (other.x - x) / (other.ink.hw + ink.hw);
        const dy = (other.y - y) / (other.ink.hh + ink.hh);
        if (dx * dx + dy * dy < 1) buried += 1;
      });

      const startBin = binAt(x - ink.hw);
      const endBin = binAt(x + ink.hw);
      for (let bin = startBin; bin <= endBin; bin += 1) {
        const offset = (originX + (bin + 0.5) * binWidth - x) / Math.max(ink.hw, 0.001);
        const dome = Math.sqrt(Math.max(0, 1 - offset * offset)) * ink.hh * 0.8;
        const top = y - dome + rough * Math.sin(bin * 1.7);
        if (top < terrain[bin]) terrain[bin] = top;
      }

      placements.push({ x, y, size, rotation, ink, shape, palette, buried, covered: 0, seed: `${settings.seed}:${index}` });
    }

    const pile = element("svg", {
      xmlns: SVG_NS,
      viewBox: `0 0 ${settings.width} ${settings.height}`,
      width: "100%",
      // Cover and crop. With `meet` the heap would letterbox inside a window of
      // a different aspect and leave bare gutters down both sides.
      preserveAspectRatio: "xMidYMid slice",
      role: "img",
      "aria-label": `${typeEntry.label} shape pile`,
      style: "display:block;overflow:hidden"
    });
    // Painted in the order they were dropped, so later pieces occlude the ones
    // they came to rest on. Shading is measured against the finished surface of
    // the heap rather than against drop order: a piece is darkened by how far
    // below the crest it ended up, so anything still in daylight stays lit no
    // matter how early it landed.
    const shadeDepth = nominalSize * 0.8;
    placements.forEach((placement) => {
      const exposure = placement.y - placement.ink.hh - terrain[binAt(placement.x)];
      placement.covered = Math.max(0, exposure);
    });
    placements.forEach((placement, index) => {
      const dim = +(Math.min(1, placement.covered / shadeDepth) * 0.4).toFixed(3);
      const nested = create({
        type: settings.type,
        shape: placement.shape,
        palette: placement.palette,
        seed: placement.seed,
        size: placement.size,
        rotation: placement.rotation,
        dim,
        decorative: true
      });
      nested.setAttribute("x", +(placement.x - placement.size / 2).toFixed(2));
      nested.setAttribute("y", +(placement.y - placement.size / 2).toFixed(2));
      nested.setAttribute("transform", `rotate(${placement.rotation} ${placement.x.toFixed(2)} ${placement.y.toFixed(2)})`);
      nested.setAttribute("data-pile-index", index);
      nested.setAttribute("data-pile-depth", placement.buried);
      nested.setAttribute("data-pile-rotation", placement.rotation);
      nested.setAttribute("data-pile-ink", `${placement.ink.rx.toFixed(2)},${placement.ink.ry.toFixed(2)}`);
      pile.appendChild(nested);
    });
    container.replaceChildren(pile);
    return pile;
  }

  function toSVG(options) {
    return new XMLSerializer().serializeToString(create(options));
  }

  function getCatalog() {
    return JSON.parse(JSON.stringify(CATALOG));
  }

  global.SnackShapeEngine = Object.freeze({
    version: "1.1.0",
    catalog: CATALOG,
    palettes: PALETTES,
    create,
    render,
    renderPile,
    toSVG,
    getCatalog
  });
})(globalThis);
