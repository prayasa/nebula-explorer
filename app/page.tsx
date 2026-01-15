"use client";
import { useState, Suspense, useEffect, useRef } from "react";
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
  
  // State Audio
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // State deteksi Mobile
  const [isMobile, setIsMobile] = useState(false);
  const [dpr, setDpr] = useState(1.5);

  const isUFOSelected = selectedModel.includes("model1");
  const isCockpitMode = isDriving && isUFOSelected && !isMobile;

  useEffect(() => {
    // 1. Cek Mobile
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setDpr(mobile ? 1 : 1.5); 
      if (mobile && isDriving) {
        setIsDriving(false);
        if(document.pointerLockElement) document.exitPointerLock();
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // 2. PAKSA LOAD AUDIO DI BACKGROUND (Fix Delay)
    if (audioRef.current) {
        // Set volume rendah dulu agar tidak kaget kalau autoplay tembus
        audioRef.current.volume = 0.4;
        audioRef.current.load();
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, [isDriving]); // Dependency array

  const playSfx = () => {
    const audio = new Audio("/assets/click.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const handleStartExperience = () => {
    // Play Audio
    if (audioRef.current) {
        // Kita gunakan Promise untuk memastikan play
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
            playPromise
            .then(() => {
                console.log("Audio started immediately.");
            })
            .catch((error) => {
                console.log("Playback prevented, trying again on next interaction.");
            });
        }
    }
    
    setHasInteracted(true);
    setIsPlaced(true); 
    playSfx();
  };

  const toggleMute = () => {
    if (audioRef.current) {
        audioRef.current.muted = !audioRef.current.muted;
        setIsMuted(!isMuted);
    }
  };

  return (
    <main className="h-screen w-screen bg-neutral-950 relative overflow-hidden font-mono text-white selection:bg-cyan-500/30">
      
      {/* Tambahkan preload="auto" */}
      <audio ref={audioRef} src="/assets/bgm.mp3" loop preload="auto" />

      {/* --- START SCREEN --- */}
      {!hasInteracted && (
        <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 transition-opacity duration-500">
           <h1 className="text-4xl md:text-6xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(0,255,255,0.6)] tracking-tighter mb-2 text-center">
              NEBULA EXPLORER
           </h1>
           <p className="text-cyan-200/60 text-sm tracking-[0.3em] mb-10 text-center">INTERSTELLAR SIMULATION</p>
           
           <button 
             onClick={handleStartExperience}
             className="group relative px-8 py-4 bg-transparent border-2 border-cyan-500 text-cyan-400 font-bold tracking-widest text-xl uppercase hover:bg-cyan-500 hover:text-black transition-all duration-300 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.2)]"
           >
             <span className="absolute inset-0 w-full h-full bg-cyan-400 opacity-0 group-hover:opacity-20 animate-pulse rounded-lg"></span>
             Initialize System
           </button>
           <p className="mt-6 text-gray-500 text-[10px] animate-pulse">HEADPHONES RECOMMENDED</p>
        </div>
      )}

      {/* KANVAS 3D */}
      <div id="canvas-container" className="absolute inset-0 z-0">
        <Canvas 
            dpr={dpr} 
            camera={{ position: [0, 5, 15], fov: 75, far: 2000 }} 
            gl={{ antialias: !isMobile, powerPreference: "high-performance" }} 
            shadows={!isMobile} 
        >
          <Stars radius={200} depth={100} count={isMobile ? 1000 : 5000} factor={4} saturation={0} fade speed={isDriving ? 3 : 0.5} />
          <SpaceDebris count={isMobile ? 200 : 600} />
          <SolarSystem />

          <ambientLight intensity={0.3} color="#4444ff" />
          <directionalLight position={[50, 50, 50]} intensity={1.5} color="#ffddaa" />
          <hemisphereLight groundColor="#000000" skyColor="#222244" intensity={0.4} />

          <Suspense fallback={null}>
            <ArModel 
                url={selectedModel} 
                isPlaced={isPlaced} 
                isDriving={isDriving} 
                isHologram={isHologram}
            />
          </Suspense>

          <Environment preset="night" blur={0.6} background={false} />
          
          {(!isDriving || isMobile) && (
            <OrbitControls 
                enableZoom={true} 
                enablePan={true} 
                maxPolarAngle={Math.PI / 1.5} 
                minDistance={5} 
                maxDistance={100}
                rotateSpeed={0.5} 
            />
          )}
        </Canvas>
      </div>

      {/* --- OVERLAY KOKPIT (Desktop Only) --- */}
      {isCockpitMode && (
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-end">
          <div className="relative w-full h-[60vh]"> 
             <Image 
                src="/assets/cockpit_overlay.png" 
                alt="Cockpit View" 
                fill 
                style={{ objectFit: "cover", objectPosition: "bottom center" }} 
                priority
                className="opacity-90"
              />
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-cyan-500/50 rounded-full flex items-center justify-center">
             <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]"></div>
          </div>
        </div>
      )}

      {/* --- UI HEADER --- */}
      {hasInteracted && (
        <div className="absolute top-0 left-0 w-full p-6 z-40 pointer-events-none flex justify-between items-start animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
            <h1 className="text-3xl font-bold tracking-tighter text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">NEBULA EXPLORER</h1>
            <p className="text-xs text-cyan-200/70 mt-1 font-semibold tracking-widest">
                SYSTEM: <span className="text-white">{isMobile ? "MOBILE ORBITAL VIEW" : "DESKTOP COMMAND"}</span>
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
                STATUS: <span className={isDriving ? "text-red-400 animate-pulse" : "text-green-400"}>
                    {isDriving ? "MANUAL PILOT ENGAGED" : "AUTOPILOT ORBIT"}
                </span>
            </p>
            </div>
            
            <div className="pointer-events-auto flex gap-3">
                <button onClick={toggleMute} className="bg-black/50 border border-cyan-800 text-cyan-400 px-3 py-1 text-xs rounded hover:bg-cyan-900/50">
                    {isMuted ? "UNMUTE BGM" : "MUTE BGM"}
                </button>

                {isDriving && (
                <button 
                    onClick={() => { setIsDriving(false); if(document.pointerLockElement) document.exitPointerLock(); playSfx(); }}
                    className="bg-red-600/80 hover:bg-red-500 border border-red-400 text-white px-6 py-2 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(255,0,0,0.5)] transition-all"
                >
                    EXIT COCKPIT [ESC]
                </button>
                )}
            </div>
        </div>
      )}

      {/* --- INSTRUKSI DESKTOP --- */}
      {isDriving && !isMobile && (
        <div className="absolute top-1/2 left-6 transform -translate-y-1/2 text-left pointer-events-none opacity-80 bg-black/60 p-4 rounded-xl border border-cyan-500/30 z-40 backdrop-blur-sm">
            <h3 className="text-cyan-400 font-bold mb-3 text-sm tracking-wider border-b border-cyan-500/30 pb-2">FLIGHT CONTROLS</h3>
            <ul className="text-[11px] space-y-3 text-gray-300 font-sans font-semibold">
                <li className="flex items-center gap-3">
                   <div className="w-6 h-6 border border-white/30 rounded flex items-center justify-center">M</div> 
                   <span>MOUSE LOOK TO STEER</span>
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
                   <span>STRAFE</span>
                </li>
            </ul>
        </div>
      )}

      {/* --- DASHBOARD BAWAH --- */}
      {isPlaced && !isCockpitMode && hasInteracted && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-4xl flex flex-col md:flex-row gap-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-black/80 backdrop-blur-xl border border-cyan-900/50 rounded-2xl p-4 flex-1 shadow-[0_0_30px_rgba(0,100,255,0.2)]">
            <p className="text-[10px] text-cyan-300/70 mb-3 uppercase tracking-wider font-bold">Deploy Vehicle</p>
            <div className="flex gap-2">
              <button onClick={() => { playSfx(); setSelectedModel("/assets/model1.obj"); }} 
                className={`flex-1 py-3 rounded-lg border transition-all font-bold tracking-wider ${isUFOSelected ? "bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.4)]" : "bg-transparent text-cyan-400 border-cyan-800 hover:bg-cyan-900/50"}`}>
                UFO-V1
              </button>
            </div>
          </div>
          
          <div className="bg-black/80 backdrop-blur-xl border border-cyan-900/50 rounded-2xl p-4 flex-[1.5] shadow-[0_0_30px_rgba(0,100,255,0.2)] flex flex-col justify-center gap-4">
            
            {!isMobile ? (
                <button
                onClick={() => { setIsDriving(true); playSfx(); }}
                className={`w-full py-4 rounded-xl font-extrabold tracking-[0.2em] transition-all duration-300 transform active:scale-95 shadow-lg flex items-center justify-center gap-3 border-2
                bg-cyan-600/90 hover:bg-cyan-500 border-cyan-400 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)] animate-pulse`}
                >
                ENGAGE COCKPIT VIEW
                </button>
            ) : (
                <div className="w-full py-4 rounded-xl border border-gray-700 bg-gray-900/50 text-gray-400 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold tracking-widest">ORBITAL VIEWER MODE ACTIVE</span>
                    <span className="text-[10px] opacity-60 mt-1">Cockpit Pilot available on Desktop only</span>
                </div>
            )}

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