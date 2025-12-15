import { useEffect, useState } from 'react';

interface SadFaceParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

interface SadFacesProps {
  active: boolean;
  duration?: number;
}

const sadFaces = ['😢', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫'];

export default function SadFaces({ active, duration = 5000 }: SadFacesProps) {
  const [particles, setParticles] = useState<SadFaceParticle[]>([]);

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
    const initialParticles: SadFaceParticle[] = [];
    const particleCount = 100;

    for (let i = 0; i < particleCount; i++) {
      initialParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10 - Math.random() * 100,
        size: 20 + Math.random() * 20,
        speedX: -1 + Math.random() * 2,
        speedY: 2 + Math.random() * 3,
        rotation: Math.random() * 360,
        rotationSpeed: -3 + Math.random() * 6,
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

          // Add gravity effect
          const newSpeedY = particle.speedY + 0.15;

          // Reset particle if it goes off screen
          if (newY > window.innerHeight + 50) {
            return {
              ...particle,
              x: Math.random() * window.innerWidth,
              y: -10,
              speedY: 2 + Math.random() * 3,
            };
          }

          // Keep particles within horizontal bounds
          if (newX < 0 || newX > window.innerWidth) {
            return {
              ...particle,
              x: newX < 0 ? 0 : window.innerWidth,
              speedX: -particle.speedX * 0.7,
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
    <div className="sad-faces-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="sad-face-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            fontSize: `${particle.size}px`,
            transform: `rotate(${particle.rotation}deg)`,
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          {sadFaces[particle.id % sadFaces.length]}
        </div>
      ))}
    </div>
  );
}

