/**
 * PixelSprite React Component
 *
 * Usage:
 *   import { PixelSpriteView } from "pixelcraft-engine/react";
 *   <PixelSpriteView sprite={mySprite} scale={4} />
 */

import { useRef, useEffect } from "react";
import { PixelSprite } from "../core/PixelSprite.js";
import { Animation } from "../core/Animation.js";

export interface PixelSpriteViewProps {
  sprite: PixelSprite;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function PixelSpriteView({
  sprite,
  scale = 1,
  className,
  style,
  onClick,
}: PixelSpriteViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    sprite.renderToCanvas(canvasRef.current, { scale });
  }, [sprite, scale]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: "pixelated", ...style }}
      onClick={onClick}
    />
  );
}

export interface AnimationViewProps {
  animation: Animation;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
  autoPlay?: boolean;
}

export function AnimationView({
  animation,
  scale = 1,
  className,
  style,
  autoPlay = true,
}: AnimationViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (autoPlay) {
      animation.play(canvasRef.current, { scale });
    } else {
      animation.renderFrame(canvasRef.current, 0, { scale });
    }
    return () => animation.cleanup();
  }, [animation, scale, autoPlay]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: "pixelated", ...style }}
    />
  );
}
