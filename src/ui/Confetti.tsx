import { useEffect, useState } from 'react';

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'square' | 'rectangle' | 'circle';
  width: number;
  height: number;
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

export default function Confetti({ active, duration = 5000 }: ConfettiProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Auto-disable after duration
    const timeout = setTimeout(() => {
      setParticles([]);
    }, duration);

    // Create initial particles
    const initialParticles: ConfettiParticle[] = [];
    const particleCount = 150;

    for (let i = 0; i < particleCount; i++) {
      const shape = Math.random() > 0.5 ? (Math.random() > 0.5 ? 'square' : 'rectangle') : 'circle';
      const baseSize = 6 + Math.random() * 10;
      const width = shape === 'rectangle' ? baseSize * 1.5 : baseSize;
      const height = shape === 'rectangle' ? baseSize * 0.6 : baseSize;
      
      initialParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10 - Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: baseSize,
        width,
        height,
        shape: shape as 'square' | 'rectangle' | 'circle',
        speedX: -2 + Math.random() * 4,
        speedY: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: -5 + Math.random() * 10,
      });
    }

    setParticles(initialParticles);

    let animationFrameId: number;
    let isActive = true;

    function animate() {
      if (!isActive) return;

      setParticles((prevParticles) => {
        if (prevParticles.length === 0) return prevParticles;
        
        return prevParticles.map((particle) => {
          let newY = particle.y + particle.speedY;
          let newX = particle.x + particle.speedX;
          let newRotation = particle.rotation + particle.rotationSpeed;

          // Add slight gravity effect
          const newSpeedY = particle.speedY + 0.1;

          // Reset particle if it goes off screen
          if (newY > window.innerHeight + 50) {
            const shape = Math.random() > 0.5 ? (Math.random() > 0.5 ? 'square' : 'rectangle') : 'circle';
            const baseSize = 6 + Math.random() * 10;
            const width = shape === 'rectangle' ? baseSize * 1.5 : baseSize;
            const height = shape === 'rectangle' ? baseSize * 0.6 : baseSize;
            
            return {
              ...particle,
              x: Math.random() * window.innerWidth,
              y: -10,
              speedY: 2 + Math.random() * 4,
              color: colors[Math.floor(Math.random() * colors.length)],
              shape: shape as 'square' | 'rectangle' | 'circle',
              width,
              height,
              size: baseSize,
            };
          }

          // Keep particles within horizontal bounds with slight bounce
          if (newX < 0 || newX > window.innerWidth) {
            return {
              ...particle,
              x: newX < 0 ? 0 : window.innerWidth,
              speedX: -particle.speedX * 0.8,
            };
          }

          return {
            ...particle,
            x: newX,
            y: newY,
            speedY: newSpeedY,
            rotation: newRotation,
          };
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clearTimeout(timeout);
    };
  }, [active, duration]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="confetti-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`confetti-particle confetti-${particle.shape}`}
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            backgroundColor: particle.color,
            width: `${particle.width}px`,
            height: `${particle.height}px`,
            transform: `rotate(${particle.rotation}deg)`,
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      ))}
    </div>
  );
}

