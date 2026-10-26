import { useEffect, useRef } from "react";

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export function Spotlight({
  className = "",
  fill = "white",
}: SpotlightProps) {
  const spotlightRef = useRef<HTMLDivElement>(null);

  const targetPosition = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const currentPosition = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      targetPosition.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrame: number;

    const animate = () => {
      const target = targetPosition.current;
      const current = currentPosition.current;

      // Smaller value = smoother/slower
      // Larger value = faster response
      const ease = 0.12;

      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `
          translate3d(
            ${current.x - 210}px,
            ${current.y - 210}px,
            0
          )
        `;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      ref={spotlightRef}
      className={`cursor-spotlight ${className}`}
      style={{
        background: `radial-gradient(
          circle,
          ${fill} 0%,
          rgba(255, 255, 255, 0.35) 12%,
          rgba(255, 255, 255, 0.12) 28%,
          transparent 65%
        )`,
      }}
    />
  );
}