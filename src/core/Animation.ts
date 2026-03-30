/**
 * Animation — Frame-based sprite animation
 *
 * Manages multiple frames with configurable FPS and render loop.
 */

import { PixelSprite } from "./PixelSprite.js";
import { assertPositiveNumber } from "../utils/validation.js";

export interface AnimationFrame {
  sprite: PixelSprite;
  /** Override duration for this frame in ms (optional, overrides FPS) */
  duration?: number;
}

export interface AnimationOptions {
  frames: PixelSprite[] | AnimationFrame[];
  fps?: number;
  loop?: boolean;
}

export class Animation {
  private frames: AnimationFrame[];
  private _fps: number;
  private _loop: boolean;
  private _currentFrame: number = 0;
  private _playing: boolean = false;
  private _startTime: number = 0;
  private _rafId: number | null = null;
  private _canvas: HTMLCanvasElement | null = null;
  private _scale: number = 1;
  private _onFrame?: (index: number) => void;

  constructor(options: AnimationOptions) {
    const { fps = 10, loop = true } = options;

    if (!options.frames || options.frames.length === 0) {
      throw new Error("Animation must have at least one frame");
    }

    assertPositiveNumber(fps, "fps");

    this.frames = options.frames.map((f) =>
      f instanceof PixelSprite ? { sprite: f } : f,
    );
    this._fps = fps;
    this._loop = loop;
  }

  // — Getters —

  get fps(): number {
    return this._fps;
  }

  get frameCount(): number {
    return this.frames.length;
  }

  get currentFrame(): number {
    return this._currentFrame;
  }

  get playing(): boolean {
    return this._playing;
  }

  /** Total duration in ms */
  get totalDuration(): number {
    const defaultDuration = 1000 / this._fps;
    return this.frames.reduce(
      (sum, f) => sum + (f.duration ?? defaultDuration),
      0,
    );
  }

  // — Setters —

  setFPS(fps: number): void {
    assertPositiveNumber(fps, "fps");
    this._fps = fps;
  }

  onFrame(callback: (index: number) => void): void {
    this._onFrame = callback;
  }

  // — Frame access —

  getFrame(index: number): PixelSprite {
    if (index < 0 || index >= this.frames.length) {
      throw new Error(
        `Frame index ${index} out of range (0-${this.frames.length - 1})`,
      );
    }
    return this.frames[index].sprite;
  }

  getCurrentSprite(): PixelSprite {
    return this.frames[this._currentFrame].sprite;
  }

  // — Playback —

  /** Start playing animation on a canvas */
  play(
    canvas: HTMLCanvasElement,
    options: { scale?: number } = {},
  ): void {
    this._canvas = canvas;
    this._scale = options.scale ?? 1;
    this._playing = true;
    this._startTime = performance.now();
    this._currentFrame = 0;
    this.tick();
  }

  pause(): void {
    this._playing = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  resume(): void {
    if (!this._canvas) return;
    this._playing = true;
    this._startTime = performance.now();
    this.tick();
  }

  stop(): void {
    this.pause();
    this._currentFrame = 0;
    if (this._canvas) {
      this.renderCurrentFrame();
    }
  }

  /** Clean up — call when done to prevent memory leaks */
  cleanup(): void {
    this.pause();
    this._canvas = null;
    this._onFrame = undefined;
  }

  /** Manually advance to next frame */
  nextFrame(): void {
    this._currentFrame = (this._currentFrame + 1) % this.frames.length;
    if (this._canvas) this.renderCurrentFrame();
  }

  /** Manually go to previous frame */
  prevFrame(): void {
    this._currentFrame =
      (this._currentFrame - 1 + this.frames.length) % this.frames.length;
    if (this._canvas) this.renderCurrentFrame();
  }

  /** Go to specific frame */
  goToFrame(index: number): void {
    if (index < 0 || index >= this.frames.length) {
      throw new Error(`Frame index ${index} out of range`);
    }
    this._currentFrame = index;
    if (this._canvas) this.renderCurrentFrame();
  }

  // — Rendering —

  /** Render a single frame without animation */
  renderFrame(
    canvas: HTMLCanvasElement,
    frameIndex: number,
    options: { scale?: number } = {},
  ): void {
    this.getFrame(frameIndex).renderToCanvas(canvas, {
      scale: options.scale ?? 1,
    });
  }

  // — Export —

  /** Get all frames as PixelSprite array */
  getFrames(): PixelSprite[] {
    return this.frames.map((f) => f.sprite);
  }

  // — Internal —

  private tick = (): void => {
    if (!this._playing || !this._canvas) return;

    let elapsed = performance.now() - this._startTime;
    const defaultDuration = 1000 / this._fps;
    const total = this.totalDuration;

    // Handle looping: use modulo so background-tab gaps are handled correctly.
    // When requestAnimationFrame is throttled (background tabs), elapsed can
    // far exceed totalDuration. Modulo ensures we pick the correct frame
    // within the current cycle instead of resetting to 0 each loop.
    if (this._loop && elapsed >= total) {
      // Advance start time by full cycles so we keep correct phase
      const fullCycles = Math.floor(elapsed / total);
      this._startTime += fullCycles * total;
      elapsed = performance.now() - this._startTime;
    }

    // Calculate which frame we should be on
    let accumulated = 0;
    let targetFrame = 0;
    for (let i = 0; i < this.frames.length; i++) {
      accumulated += this.frames[i].duration ?? defaultDuration;
      if (elapsed < accumulated) {
        targetFrame = i;
        break;
      }
      if (i === this.frames.length - 1) {
        if (!this._loop) {
          targetFrame = this.frames.length - 1;
          this._playing = false;
        } else {
          // Fallback: shouldn't normally reach here due to modulo above
          targetFrame = 0;
        }
      }
    }

    if (targetFrame !== this._currentFrame) {
      this._currentFrame = targetFrame;
      this._onFrame?.(targetFrame);
    }

    this.renderCurrentFrame();

    if (this._playing) {
      this._rafId = requestAnimationFrame(this.tick);
    }
  };

  private renderCurrentFrame(): void {
    if (!this._canvas) return;
    this.frames[this._currentFrame].sprite.renderToCanvas(this._canvas, {
      scale: this._scale,
    });
  }
}
