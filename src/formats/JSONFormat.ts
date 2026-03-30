/**
 * JSONFormat — Load/save sprites and animations from JSON
 */

import { PixelSprite, SpriteJSON } from "../core/PixelSprite.js";
import { Animation } from "../core/Animation.js";

export interface AnimationJSON {
  name?: string;
  width: number;
  height: number;
  palette?: string[];
  fps?: number;
  loop?: boolean;
  frames: {
    data: (number | string)[];
    duration?: number;
  }[];
}

/** Load sprite from JSON string */
export function spriteFromJSON(json: string): PixelSprite {
  return PixelSprite.parse(json);
}

/** Load animation from JSON object */
export function animationFromObject(json: AnimationJSON): Animation {
  const frames = json.frames.map((f) => ({
    sprite: PixelSprite.fromGrid({
      width: json.width,
      height: json.height,
      palette: json.palette,
      data: f.data,
    }),
    duration: f.duration,
  }));

  return new Animation({
    frames,
    fps: json.fps ?? 10,
    loop: json.loop ?? true,
  });
}

/** Load animation from JSON string */
export function animationFromJSON(json: string): Animation {
  return animationFromObject(JSON.parse(json));
}
