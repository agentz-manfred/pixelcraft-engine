/**
 * Visual Tests — Canvas rendering with Playwright screenshot comparison
 *
 * These tests render sprites to canvas in a real browser and compare
 * screenshots to reference fixtures.
 */

import { test, expect } from "@playwright/test";

test.describe("Static Sprite Rendering", () => {
  test("playground loads and renders sprites", async ({ page }) => {
    await page.goto("/");
    // Wait for the status to show success
    await page.waitForFunction(() =>
      document.getElementById("status")?.textContent?.includes("loaded successfully"),
    );
    // Check that static sprites section has canvases
    const canvases = page.locator("#static-sprites canvas");
    await expect(canvases.first()).toBeVisible();
    const count = await canvases.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("heart sprite renders correct dimensions", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() =>
      document.getElementById("status")?.textContent?.includes("loaded successfully"),
    );
    // First canvas in static-sprites should be the heart (8×8 at scale 8 = 64×64)
    const firstCanvas = page.locator("#static-sprites canvas").first();
    const box = await firstCanvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBe(64);
    expect(box!.height).toBe(64);
  });

  test("animations section has animated canvases", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() =>
      document.getElementById("status")?.textContent?.includes("loaded successfully"),
    );
    const animCanvases = page.locator("#animations canvas");
    const count = await animCanvases.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("exports section has GIF images", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() =>
      document.getElementById("status")?.textContent?.includes("loaded successfully"),
    );
    const gifImages = page.locator("#exports img");
    const count = await gifImages.count();
    expect(count).toBeGreaterThanOrEqual(2);
    // Verify GIF data URL
    const src = await gifImages.first().getAttribute("src");
    expect(src).toMatch(/^data:image\/gif;base64,/);
  });

  test("SVG export contains svg element", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() =>
      document.getElementById("status")?.textContent?.includes("loaded successfully"),
    );
    const svg = page.locator("#exports .svg-container svg");
    await expect(svg.first()).toBeVisible();
  });

  test("spritesheet section renders composite", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() =>
      document.getElementById("status")?.textContent?.includes("loaded successfully"),
    );
    const sheetCanvases = page.locator("#spritesheets canvas");
    const count = await sheetCanvases.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Canvas Output Visual Comparison", () => {
  test("heart sprite visual match", async ({ page }) => {
    // Create a minimal page that renders just one sprite
    await page.setContent(`
      <canvas id="c" style="image-rendering: pixelated;"></canvas>
      <script type="module">
        import { PixelSprite } from '/src/index.ts';
        const data = [
          0,0,0,0,0,0,0,0,
          0,1,1,0,0,1,1,0,
          1,2,1,1,1,1,2,1,
          1,1,1,1,1,1,1,1,
          1,1,1,1,1,1,1,1,
          0,1,1,1,1,1,1,0,
          0,0,1,1,1,1,0,0,
          0,0,0,1,1,0,0,0,
        ];
        const s = PixelSprite.fromGrid({
          width: 8, height: 8,
          palette: ["#00000000","#ff0044","#ff6688"],
          data,
        });
        s.renderToCanvas(document.getElementById("c"), { scale: 4 });
        window.__done = true;
      </script>
    `);
    await page.waitForFunction(() => (window as any).__done);
    const canvas = page.locator("#c");
    await expect(canvas).toHaveScreenshot("heart-4x.png");
  });

  test("checkerboard sprite visual match", async ({ page }) => {
    await page.setContent(`
      <canvas id="c" style="image-rendering: pixelated;"></canvas>
      <script type="module">
        import { PixelSprite, Palette } from '/src/index.ts';
        const gb = Palette.presets.gameboy;
        const data = [];
        for (let y = 0; y < 4; y++)
          for (let x = 0; x < 4; x++)
            data.push((x + y) % 4);
        const s = PixelSprite.fromGrid({ width: 4, height: 4, palette: gb, data });
        s.renderToCanvas(document.getElementById("c"), { scale: 8 });
        window.__done = true;
      </script>
    `);
    await page.waitForFunction(() => (window as any).__done);
    const canvas = page.locator("#c");
    await expect(canvas).toHaveScreenshot("checkerboard-gb.png");
  });

  test("transparent sword sprite visual match", async ({ page }) => {
    await page.setContent(`
      <canvas id="c" style="image-rendering: pixelated; background: #222;"></canvas>
      <script type="module">
        import { PixelSprite } from '/src/index.ts';
        const s = PixelSprite.fromGrid({
          width: 8, height: 8,
          palette: ["#00000000","#94b0c2","#f4f4f4","#5d275d"],
          data: [
            0,0,0,0,0,0,1,0,
            0,0,0,0,0,1,2,1,
            0,0,0,0,1,2,1,0,
            0,0,0,1,2,1,0,0,
            0,3,1,2,1,0,0,0,
            0,3,3,1,0,0,0,0,
            3,0,3,0,0,0,0,0,
            0,3,0,0,0,0,0,0,
          ],
        });
        s.renderToCanvas(document.getElementById("c"), { scale: 8 });
        window.__done = true;
      </script>
    `);
    await page.waitForFunction(() => (window as any).__done);
    const canvas = page.locator("#c");
    await expect(canvas).toHaveScreenshot("sword-transparent.png");
  });
});
