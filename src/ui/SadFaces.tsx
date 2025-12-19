import { useEffect, useState, useRef } from 'react';
import Matter from 'matter-js';

const { Bodies, Composite, Engine, Events, Runner, World } = Matter;

interface SadFacesProps {
  active: boolean;
  duration?: number;
}

const sadFaces = ['😢', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😭', '😤', '😠', '😡', '💔', '😰', '😨', '😱', '😓', '😩'];

interface EmojiBody {
  body: Matter.Body;
  emoji: string;
  size: number;
  resetCount: number;
  floorTime?: number;
  isVisible: boolean;
}

export default function SadFaces({ active, duration = 5000 }: SadFacesProps) {
  const [emojiBodies, setEmojiBodies] = useState<EmojiBody[]>([]);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) {
      // Clean up when inactive
      if (runnerRef.current && engineRef.current) {
        Runner.stop(runnerRef.current);
        Engine.clear(engineRef.current);
        World.clear(engineRef.current.world, false);
      }
      setEmojiBodies([]);
      return;
    }

    // Create Matter.js engine
    const engine = Engine.create();
    engine.world.gravity.y = 1; // Gravity strength
    engineRef.current = engine;

    // Create ground and walls
    const floorY = window.innerHeight - 10;
    const ground = Bodies.rectangle(
      window.innerWidth / 2,
      floorY + 5,
      window.innerWidth,
      10,
      { isStatic: true, label: 'ground' }
    );

    const leftWall = Bodies.rectangle(-5, window.innerHeight / 2, 10, window.innerHeight * 2, {
      isStatic: true,
    });
    const rightWall = Bodies.rectangle(
      window.innerWidth + 5,
      window.innerHeight / 2,
      10,
      window.innerHeight * 2,
      { isStatic: true }
    );

    World.add(engine.world, [ground, leftWall, rightWall]);

    // Create emoji bodies
    const particleCount = 60;
    const minSpacing = 60;
    const positions: Array<{ x: number; y: number }> = [];
    const bodies: EmojiBody[] = [];

    for (let i = 0; i < particleCount; i++) {
      let attempts = 0;
      let x: number, y: number;
      let validPosition = false;

      // Try to find a position that doesn't overlap
      while (!validPosition && attempts < 100) {
        x = Math.random() * window.innerWidth;
        y = -10 - Math.random() * 300;
        validPosition = true;

        for (const pos of positions) {
          const dx = x - pos.x;
          const dy = y - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < minSpacing) {
            validPosition = false;
            break;
          }
        }
        attempts++;
      }

      positions.push({ x: x!, y: y! });

      const size = 60; // Fixed size, 2x bigger (was 20-40, now 60)
      const radius = size / 2;

      // Create circular body for emoji
      const body = Bodies.circle(x!, y!, radius, {
        restitution: 0.2, // Low bounciness for more realistic behavior
        friction: 0.4,
        frictionAir: 0.02,
        density: 0.001,
        label: `emoji-${i}`,
      });

      bodies.push({
        body,
        emoji: sadFaces[i % sadFaces.length],
        size,
        resetCount: 0,
        isVisible: true,
      });
    }

    World.add(engine.world, bodies.map((b) => b.body));
    setEmojiBodies(bodies);

    // Track when bodies hit the ground
    const floorTimeMap = new Map<number, number>();
    const HIDE_DELAY = 3000;

    Events.on(engine, 'afterUpdate', () => {
      const currentTime = Date.now();
      const floorY = window.innerHeight - 10;

      setEmojiBodies((prevBodies) => {
        return prevBodies.map((emojiBody) => {
          const { body, resetCount, floorTime } = emojiBody;
          const bodyId = body.id;

          // Check if body has stopped (low velocity)
          const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
          const angularSpeed = Math.abs(body.angularVelocity);
          const isStopped = speed < 0.1 && angularSpeed < 0.1 && body.position.y >= floorY - 20;

          // Record floor time when body stops
          if (isStopped && !floorTime) {
            floorTimeMap.set(bodyId, currentTime);
            return {
              ...emojiBody,
              floorTime: currentTime,
            };
          }

          // Hide after 3 seconds on floor
          if (floorTime && currentTime - floorTime > HIDE_DELAY) {
            return {
              ...emojiBody,
              isVisible: false,
            };
          }

          // Reset for second rain
          if (body.position.y > window.innerHeight + 50 && resetCount < 1) {
            // Make body dynamic again if it was static
            if (body.isStatic) {
              Matter.Body.setStatic(body, false);
            }
            // Reset position to top
            Matter.Body.setPosition(body, {
              x: Math.random() * window.innerWidth,
              y: -10 - Math.random() * 100,
            });
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);

            return {
              ...emojiBody,
              resetCount: resetCount + 1,
              floorTime: undefined,
            };
          }

          // After second rain, stop at floor
          if (body.position.y > window.innerHeight + 50 && resetCount >= 1 && !body.isStatic) {
            Matter.Body.setPosition(body, {
              x: body.position.x,
              y: floorY,
            });
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
            Matter.Body.setStatic(body, true);

            if (!floorTime) {
              floorTimeMap.set(bodyId, currentTime);
              return {
                ...emojiBody,
                floorTime: currentTime,
              };
            }
          }

          // Make body static when it stops on floor (for first rain)
          if (isStopped && !body.isStatic && body.position.y >= floorY - 20) {
            Matter.Body.setStatic(body, true);
          }

          return emojiBody;
        });
      });
    });

    // Start the physics engine
    const runner = Runner.create();
    Runner.run(runner, engine);
    runnerRef.current = runner;

    // Auto-disable after duration
    const timeout = setTimeout(() => {
      Runner.stop(runner);
      Engine.clear(engine);
      World.clear(engine.world, false);
      setEmojiBodies([]);
    }, duration);

    // Handle window resize
    const handleResize = () => {
      if (engine && ground) {
        const newFloorY = window.innerHeight - 10;
        Matter.Body.setPosition(ground, {
          x: window.innerWidth / 2,
          y: newFloorY + 5,
        });
        Matter.Body.scale(ground, window.innerWidth / (ground.bounds.max.x - ground.bounds.min.x), 1);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
      if (runner) {
        Runner.stop(runner);
      }
      if (engine) {
        Engine.clear(engine);
        World.clear(engine.world, false);
      }
    };
  }, [active, duration]);

  return (
    <div className="sad-faces-container" ref={containerRef}>
      {emojiBodies
        .filter((emojiBody) => emojiBody.isVisible)
        .map((emojiBody) => {
          const { body, emoji, size } = emojiBody;
          return (
            <div
              key={body.id}
              className="sad-face-particle"
              style={{
                left: `${body.position.x - size / 2}px`,
                top: `${body.position.y - size / 2}px`,
                fontSize: `${size}px`,
                transform: `rotate(${body.angle * (180 / Math.PI)}deg)`,
                position: 'fixed',
                pointerEvents: 'none',
                zIndex: 9999,
              }}
            >
              {emoji}
            </div>
          );
        })}
    </div>
  );
}
