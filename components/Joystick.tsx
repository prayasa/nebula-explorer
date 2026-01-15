"use client";
import { useEffect, useRef, useState } from "react";

interface JoystickProps {
  onMove: (data: { x: number; y: number }) => void;
}

export default function Joystick({ onMove }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const center = useRef({ x: 0, y: 0 });

  const handleStart = (e: React.PointerEvent) => {
    e.preventDefault(); // Mencegah scroll saat drag joystick
    setActive(true);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
  };

  const handleMove = (e: PointerEvent) => {
    if (!active || !containerRef.current || !knobRef.current) return;
    
    // Hitung posisi relatif terhadap tengah joystick
    const dx = e.clientX - center.current.x;
    const dy = e.clientY - center.current.y;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 40; // Batas gerak knob
    
    // Clamp jarak agar tidak keluar lingkaran
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(distance, maxRadius);
    
    const x = Math.cos(angle) * clampedDist;
    const y = Math.sin(angle) * clampedDist;

    // Update posisi visual knob
    knobRef.current.style.transform = `translate(${x}px, ${y}px)`;

    // Kirim data normalisasi (-1 sampai 1) ke parent
    // X = Kanan/Kiri, Y = Maju/Mundur (dibalik karena Y screen ke bawah positif)
    onMove({ x: x / maxRadius, y: -y / maxRadius }); 
  };

  const handleEnd = () => {
    setActive(false);
    if (knobRef.current) knobRef.current.style.transform = `translate(0px, 0px)`;
    onMove({ x: 0, y: 0 }); // Reset speed
  };

  useEffect(() => {
    if (active) {
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleEnd);
    }
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
    };
  }, [active]);

  return (
    <div 
      className="relative w-24 h-24 bg-white/10 backdrop-blur-md rounded-full border border-white/20 touch-none"
      onPointerDown={handleStart}
      ref={containerRef}
    >
      <div 
        ref={knobRef}
        className="absolute top-1/2 left-1/2 w-10 h-10 bg-cyan-500/80 rounded-full shadow-[0_0_15px_cyan] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75 ease-out"
        style={{ marginTop: '-20px', marginLeft: '-20px' }} // Centering manual helper
      />
    </div>
  );
}