"use client";
import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Stars } from "@react-three/drei";
import ArModel from "../components/ArModel";
import SpaceDebris from "../components/SpaceDebris";
import SolarSystem from "../components/SolarSystem";
import Image from "next/image"; 

export default function Home() {
  const [selectedModel, setSelectedModel] = useState("/assets/model1.obj");
  const [isPlaced, setIsPlaced] = useState(false);
  const [isDriving, setIsDriving] = useState(false);
  const [isHologram, setIsHologram] = useState(false);

  const isUFOSelected = selectedModel.includes("model1");
  const isCockpitMode = isDriving && isUFOSelected;

  const playSfx = () => {
    const audio = new Audio("/assets/click.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  return (
    <main className="h-screen w-screen bg-neutral-950 relative overflow-hidden font-mono text-white selection:bg-cyan-500/30">
      
      {/* ID container untuk PointerLock */}
      <div id="canvas-container" className="absolute inset-0 z-0" onClick={() => !isPlaced && setIsPlaced(true)}>
        <Canvas shadows camera={{ position: [0, 5, 15], fov: 75, far: 5000 }}>
          
          {/* Environment */}
          <Stars radius={200} depth={100} count={8000} factor={6} saturation={0} fade speed={isDriving ? 5 : 0.5} />
          
          {/* Objek Angkasa */}
          <SpaceDebris count={600} speed={isDriving ? 3.0 : 0.2} />
          <SolarSystem />

          {/* Lighting */}
          <ambientLight intensity={0.5} color="#4444ff" />
          <directionalLight position={[100, 50, 100]} intensity={2} color="#ffddaa" />
          <hemisphereLight groundColor="#000000" skyColor="#222244" intensity={0.5} />

          <Suspense fallback={null}>
            <ArModel url={selectedModel} isPlaced={isPlaced} isDriving={isDriving} isHologram={isHologram} />
          </Suspense>

          <Environment preset="night" blur={0.6} background={false} intensity={1.0} />
          
          {/* Orbit hanya aktif saat TIDAK menyetir */}
          {isPlaced && !isDriving && <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} minDistance={5} maxDistance={100} />}
        </Canvas>
      </div>

      {/* --- OVERLAY KOKPIT --- */}
      {isCockpitMode && (
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-end">
          <div className="relative w-full h-[60vh]"> 
             <Image 
                src="/assets/cockpit_overlay.png" 
                alt="Cockpit View" 
                fill 
                style={{ 
                  objectFit: "cover", 
                  objectPosition: "bottom center" 
                }} 
                priority
              />
          </div>
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-cyan-500/50 rounded-full flex items-center justify-center">
             <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]"></div>
          </div>
        </div>
      )}

      {/* UI HEADER */}
      <div className="absolute top-0 left-0 w-full p-6 z-40 pointer-events-none flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">NEBULA EXPLORER</h1>
          <p className="text-xs text-cyan-200/70 mt-1 font-semibold tracking-widest">
            STATUS: <span className={isDriving ? "text-red-400 animate-pulse" : "text-green-400"}>{isDriving ? "MANUAL PILOT ENGAGED" : "AUTOPILOT ORBIT"}</span>
          </p>
        </div>
        {isDriving && (
          <button 
            onClick={() => { setIsDriving(false); document.exitPointerLock(); playSfx(); }}
            className="pointer-events-auto bg-red-600/80 hover:bg-red-500 border border-red-400 text-white px-6 py-2 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(255,0,0,0.5)] transition-all"
          >
            EXIT COCKPIT [ESC]
          </button>
        )}
      </div>

      {/* INSTRUCTIONS */}
      {isDriving && (
        <div className="absolute top-1/2 left-6 transform -translate-y-1/2 text-left pointer-events-none opacity-80 bg-black/60 p-4 rounded-xl border border-cyan-500/30 z-40 backdrop-blur-sm">
            <h3 className="text-cyan-400 font-bold mb-3 text-sm tracking-wider border-b border-cyan-500/30 pb-2">FLIGHT CONTROLS</h3>
            <ul className="text-[11px] space-y-3 text-gray-300 font-sans font-semibold">
                <li className="flex items-center gap-3">
                   <div className="w-6 h-6 border border-white/30 rounded flex items-center justify-center">M</div> 
                   <span>LOOK TO STEER</span>
                </li>
                <li className="flex items-center gap-3">
                   <div className="flex gap-1">
                     <span className="w-6 h-6 bg-white/10 border border-white/30 rounded flex items-center justify-center">W</span>
                     <span className="w-6 h-6 bg-white/10 border border-white/30 rounded flex items-center justify-center">S</span>
                   </div>
                   <span>THRUST / BRAKE</span>
                </li>
                <li className="flex items-center gap-3">
                   <div className="flex gap-1">
                     <span className="w-6 h-6 bg-white/10 border border-white/30 rounded flex items-center justify-center">A</span>
                     <span className="w-6 h-6 bg-white/10 border border-white/30 rounded flex items-center justify-center">D</span>
                   </div>
                   <span>ROLL / STRAFE</span>
                </li>
            </ul>
        </div>
      )}

      {/* DASHBOARD BAWAH (REVISI: HAPUS TOMBOL ASTEROID) */}
      {isPlaced && !isCockpitMode && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-4xl flex flex-col md:flex-row gap-4 z-40">
          <div className="bg-black/80 backdrop-blur-xl border border-cyan-900/50 rounded-2xl p-4 flex-1 shadow-[0_0_30px_rgba(0,100,255,0.2)]">
            <p className="text-[10px] text-cyan-300/70 mb-3 uppercase tracking-wider font-bold">Deploy Vehicle</p>
            <div className="flex gap-2">
              <button onClick={() => { playSfx(); setSelectedModel("/assets/model1.obj"); }} 
                className={`flex-1 py-3 rounded-lg border transition-all font-bold tracking-wider bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.4)]`}>
                UFO-V1 (ACTIVE)
              </button>
              {/* Tombol Asteroid telah dihapus */}
            </div>
          </div>
          <div className="bg-black/80 backdrop-blur-xl border border-cyan-900/50 rounded-2xl p-4 flex-[1.5] shadow-[0_0_30px_rgba(0,100,255,0.2)] flex flex-col justify-center gap-4">
            <button
              onClick={() => { setIsDriving(true); playSfx(); }}
              className={`w-full py-4 rounded-xl font-extrabold tracking-[0.2em] transition-all duration-300 transform active:scale-95 shadow-lg flex items-center justify-center gap-3 border-2
              ${isDriving 
                ? "bg-red-600/90 hover:bg-red-500 border-red-400 text-white" 
                : "bg-cyan-600/90 hover:bg-cyan-500 border-cyan-400 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)] animate-pulse"}`}
            >
              ENGAGE COCKPIT VIEW
            </button>

            <div className={`flex items-center justify-between px-2 transition-opacity ${isUFOSelected ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
              <span className="text-xs font-bold text-cyan-300">HOLOGRAM CLOAK {isUFOSelected ? "" : "(UFO ONLY)"}</span>
              <button 
                onClick={() => isUFOSelected && setIsHologram(!isHologram)}
                disabled={!isUFOSelected}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 border ${isHologram ? "bg-green-500 border-green-300 shadow-[0_0_10px_rgba(0,255,0,0.5)]" : "bg-gray-800 border-gray-600"}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isHologram ? "translate-x-6" : "translate-x-0"}`}></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}