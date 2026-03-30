/**
 * PixelCraft Engine — Playground
 *
 * Visual demo of all features: sprites, animations, spritesheets, exports.
 */

import {
  PixelSprite,
  Palette,
  Animation,
  renderToCanvas,
  encodeGIF,
  encodeAnimatedGIF,
  spriteToGIFDataURL,
  animationToGIFDataURL,
} from "../src/index.js";
import { SpriteSheet } from "../src/formats/SpriteSheet.js";

const log: string[] = [];
function status(msg: string) {
  log.push(msg);
  document.getElementById("status")!.textContent = log.join("\n");
}

// ─── Helper: add a card ────────────────────────────────

function addCard(
  containerId: string,
  title: string,
  description: string,
): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
  document.getElementById(containerId)!.appendChild(card);
  return card;
}

function addCanvas(card: HTMLDivElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  card.appendChild(canvas);
  return canvas;
}

// ─── Sprite Data ─────────────────────────────────────────

// 8x8 Heart
const heartData = [
  0,0,0,0,0,0,0,0,
  0,1,1,0,0,1,1,0,
  1,2,1,1,1,1,2,1,
  1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,1,1,
  0,1,1,1,1,1,1,0,
  0,0,1,1,1,1,0,0,
  0,0,0,1,1,0,0,0,
];
const heartPalette = ["#00000000", "#ff0044", "#ff6688"];

// 8x8 Smiley
const smileyData = [
  0,0,1,1,1,1,0,0,
  0,1,1,1,1,1,1,0,
  1,1,2,1,1,2,1,1,
  1,1,1,1,1,1,1,1,
  1,2,1,1,1,1,2,1,
  1,1,2,2,2,2,1,1,
  0,1,1,1,1,1,1,0,
  0,0,1,1,1,1,0,0,
];
const smileyPalette = ["#00000000", "#ffcd75", "#333c57"];

// 8x8 Sword
const swordData = [
  0,0,0,0,0,0,1,0,
  0,0,0,0,0,1,2,1,
  0,0,0,0,1,2,1,0,
  0,0,0,1,2,1,0,0,
  0,3,1,2,1,0,0,0,
  0,3,3,1,0,0,0,0,
  3,0,3,0,0,0,0,0,
  0,3,0,0,0,0,0,0,
];
const swordPalette = ["#00000000", "#94b0c2", "#f4f4f4", "#5d275d"];

// 8x8 Tree
const treeData = [
  0,0,0,1,1,0,0,0,
  0,0,1,1,1,1,0,0,
  0,1,1,1,1,1,1,0,
  1,1,1,1,1,1,1,1,
  0,1,1,1,1,1,1,0,
  0,0,0,2,2,0,0,0,
  0,0,0,2,2,0,0,0,
  0,0,0,2,2,0,0,0,
];
const treePalette = ["#00000000", "#38b764", "#5d275d"];

// ─── Static Sprites ──────────────────────────────────────

function renderStaticSprites() {
  status("✅ Rendering static sprites...");

  // Heart
  const heart = PixelSprite.fromGrid({
    width: 8, height: 8,
    palette: heartPalette,
    data: heartData,
  });
  const c1 = addCard("static-sprites", "❤️ Heart", "8×8, custom palette, scale 8");
  heart.renderToCanvas(addCanvas(c1), { scale: 8 });

  // Smiley
  const smiley = PixelSprite.fromGrid({
    width: 8, height: 8,
    palette: smileyPalette,
    data: smileyData,
  });
  const c2 = addCard("static-sprites", "😊 Smiley", "8×8, büro royale-ish palette");
  smiley.renderToCanvas(addCanvas(c2), { scale: 8 });

  // Sword
  const sword = PixelSprite.fromGrid({
    width: 8, height: 8,
    palette: swordPalette,
    data: swordData,
  });
  const c3 = addCard("static-sprites", "⚔️ Sword", "8×8, transparency");
  sword.renderToCanvas(addCanvas(c3), { scale: 8 });

  // Tree
  const tree = PixelSprite.fromGrid({
    width: 8, height: 8,
    palette: treePalette,
    data: treeData,
  });
  const c4 = addCard("static-sprites", "🌲 Tree", "8×8, simple green");
  tree.renderToCanvas(addCanvas(c4), { scale: 8 });

  // Checkerboard with GameBoy palette
  const gb = Palette.presets.gameboy;
  const checkerData = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      checkerData.push((x + y) % 4);
    }
  }
  const checker = PixelSprite.fromGrid({
    width: 8, height: 8,
    palette: gb,
    data: checkerData,
  });
  const c5 = addCard("static-sprites", "🎮 GameBoy Checker", "GameBoy preset palette");
  checker.renderToCanvas(addCanvas(c5), { scale: 8 });

  // Gradient with grayscale palette
  const gs = Palette.presets.grayscale;
  const gradData = [];
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      gradData.push(Math.min(11, x));
    }
  }
  const gradient = PixelSprite.fromGrid({
    width: 12, height: 12,
    palette: gs,
    data: gradData,
  });
  const c6 = addCard("static-sprites", "🌫️ Grayscale Gradient", "12×12, grayscale preset");
  gradient.renderToCanvas(addCanvas(c6), { scale: 6 });

  status("✅ Static sprites done");
}

// ─── Animations ──────────────────────────────────────────

function renderAnimations() {
  status("✅ Rendering animations...");

  // Blinking heart animation
  const heartFrames = [
    PixelSprite.fromGrid({ width: 8, height: 8, palette: heartPalette, data: heartData }),
    PixelSprite.fromGrid({ width: 8, height: 8, palette: ["#00000000", "#ff6688", "#ffaacc"], data: heartData }),
    PixelSprite.fromGrid({ width: 8, height: 8, palette: heartPalette, data: heartData }),
    PixelSprite.fromGrid({ width: 8, height: 8, palette: ["#00000000", "#cc0033", "#ff0044"], data: heartData }),
  ];
  const heartAnim = new Animation({ frames: heartFrames, fps: 3 });
  const c1 = addCard("animations", "💗 Pulsing Heart", "4 frames @ 3fps, palette shift");
  const canvas1 = addCanvas(c1);
  heartAnim.play(canvas1, { scale: 8 });

  // Spinning smiley
  const smileyBase = PixelSprite.fromGrid({
    width: 8, height: 8, palette: smileyPalette, data: smileyData,
  });
  const smileyR90 = smileyBase.clone().rotate90();
  const smileyR180 = smileyBase.clone().rotate180();
  const smileyR270 = smileyBase.clone().rotate270();
  const spinAnim = new Animation({
    frames: [smileyBase, smileyR90, smileyR180, smileyR270],
    fps: 4,
  });
  const c2 = addCard("animations", "🔄 Spinning Smiley", "4 rotation frames @ 4fps");
  const canvas2 = addCanvas(c2);
  spinAnim.play(canvas2, { scale: 8 });

  // Idle tree animation (sway)
  const tree1 = PixelSprite.fromGrid({ width: 8, height: 8, palette: treePalette, data: treeData });
  const tree2 = tree1.clone().flipHorizontal();
  const treeAnim = new Animation({
    frames: [tree1, tree1, tree2, tree2],
    fps: 2,
  });
  const c3 = addCard("animations", "🌲 Swaying Tree", "flip animation @ 2fps");
  const canvas3 = addCanvas(c3);
  treeAnim.play(canvas3, { scale: 8 });

  status("✅ Animations done");
}

// ─── SpriteSheets ────────────────────────────────────────

function renderSpriteSheets() {
  status("✅ Rendering spritesheets...");

  // Create a spritesheet from various sprites
  const sprites = [
    PixelSprite.fromGrid({ width: 8, height: 8, palette: heartPalette, data: heartData }),
    PixelSprite.fromGrid({ width: 8, height: 8, palette: smileyPalette, data: smileyData }),
    PixelSprite.fromGrid({ width: 8, height: 8, palette: swordPalette, data: swordData }),
    PixelSprite.fromGrid({ width: 8, height: 8, palette: treePalette, data: treeData }),
  ];

  const sheet = SpriteSheet.fromSprites(sprites, { columns: 4 });
  const c1 = addCard("spritesheets", "📦 4-Sprite Sheet", `${sheet.width}×${sheet.height}px, 4 columns`);
  const composite = sheet.toSprite();
  composite.renderToCanvas(addCanvas(c1), { scale: 6 });

  // Sheet with padding
  const sheetPad = SpriteSheet.fromSprites(sprites, {
    columns: 2,
    paddingX: 2,
    paddingY: 2,
    margin: 1,
  });
  const c2 = addCard("spritesheets", "📦 With Padding", `2col, 2px padding, 1px margin`);
  const compositePad = sheetPad.toSprite();
  compositePad.renderToCanvas(addCanvas(c2), { scale: 5 });

  // Round-trip: export → import
  const json = sheet.toJSON();
  const restored = SpriteSheet.fromJSON(json);
  const c3 = addCard("spritesheets", "🔄 JSON Round-trip", `Exported → Imported → Rendered`);
  restored.toSprite().renderToCanvas(addCanvas(c3), { scale: 6 });

  status("✅ SpriteSheets done");
}

// ─── Export Formats ──────────────────────────────────────

function renderExports() {
  status("✅ Rendering exports...");

  const heart = PixelSprite.fromGrid({
    width: 8, height: 8, palette: heartPalette, data: heartData,
  });

  // SVG export
  const svg = heart.toSVG({ pixelSize: 8 });
  const c1 = addCard("exports", "🖼️ SVG Export", "Scalable vector output");
  const svgDiv = document.createElement("div");
  svgDiv.className = "svg-container";
  svgDiv.innerHTML = svg;
  c1.appendChild(svgDiv);

  // GIF export (single frame)
  const gifUrl = spriteToGIFDataURL(heart, { scale: 8 });
  const c2 = addCard("exports", "📸 GIF (static)", "GIF89a, own LZW encoder");
  const img = document.createElement("img");
  img.src = gifUrl;
  img.width = 64;
  img.height = 64;
  c2.appendChild(img);

  // Animated GIF
  const heartFrames = [
    PixelSprite.fromGrid({ width: 8, height: 8, palette: heartPalette, data: heartData }),
    PixelSprite.fromGrid({ width: 8, height: 8, palette: ["#00000000", "#ff6688", "#ffaacc"], data: heartData }),
  ];
  const heartAnim = new Animation({ frames: heartFrames, fps: 2 });
  const animGifUrl = animationToGIFDataURL(heartAnim, { scale: 8 });
  const c3 = addCard("exports", "🎬 Animated GIF", "2-frame, own encoder, zero deps");
  const animImg = document.createElement("img");
  animImg.src = animGifUrl;
  animImg.width = 64;
  animImg.height = 64;
  c3.appendChild(animImg);

  // GIF with transparency
  const sword = PixelSprite.fromGrid({
    width: 8, height: 8, palette: swordPalette, data: swordData,
  });
  const swordGif = spriteToGIFDataURL(sword, { scale: 8 });
  const c4 = addCard("exports", "🗡️ GIF Transparency", "Alpha channel → GIF transparency");
  const swordImg = document.createElement("img");
  swordImg.src = swordGif;
  swordImg.width = 64;
  swordImg.height = 64;
  swordImg.style.background = "repeating-conic-gradient(#444 0% 25%, #555 0% 50%) 50% / 8px 8px";
  c4.appendChild(swordImg);

  // Raw GIF bytes info
  const rawBytes = encodeGIF(heart, { scale: 4 });
  const animBytes = encodeAnimatedGIF(heartAnim, { scale: 4 });
  const c5 = addCard(
    "exports",
    "📊 GIF Stats",
    `Static: ${rawBytes.length} bytes | Animated: ${animBytes.length} bytes | Pure TypeScript, zero deps`,
  );

  status("✅ All exports done! 🎉");
}

// ─── Main ────────────────────────────────────────────────

try {
  renderStaticSprites();
  renderAnimations();
  renderSpriteSheets();
  renderExports();
  status("\n🎮 PixelCraft Engine Playground loaded successfully!");
} catch (err) {
  status(`❌ Error: ${err}`);
  console.error(err);
}
