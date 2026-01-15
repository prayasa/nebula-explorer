"use client";
import { useLoader, useFrame, useThree } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { useRef, useLayoutEffect, useState, useEffect } from "react";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";

interface ArModelProps {
  url: string;
  isPlaced: boolean;
  isDriving: boolean;
  isHologram: boolean;
  // TAMBAHAN: Terima Ref Joystick dari page.tsx
  joystickRef?: React.MutableRefObject<{ x: number; y: number }>;
}

export default function ArModel({ url, isPlaced, isDriving, isHologram, joystickRef }: ArModelProps) {
  const obj = useLoader(OBJLoader, url) as THREE.Group;
  
  // meshRef = Wadah Utama (Mengontrol Posisi Dunia)
  const meshRef = useRef<THREE.Group>(null);
  
  // visualRef = Wadah Visual (Mengontrol Rotasi Gambar/Model agar pas)
  const visualRef = useRef<THREE.Group>(null);
  
  const [computedScale, setComputedScale] = useState<[number, number, number]>([1, 1, 1]);
  const { camera } = useThree();
  
  const [keys, setKeys] = useState({ w: false, s: false, a: false, d: false });
  const isUFO = url.includes("model1");

  // Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase(); 
        if(['w','a','s','d'].includes(k)) setKeys(p => ({...p, [k]: true}));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase(); 
        if(['w','a','s','d'].includes(k)) setKeys(p => ({...p, [k]: false}));
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Setup Model (Logic Asli Anda)
  useLayoutEffect(() => {
    if (obj && meshRef.current) {
      obj.rotation.set(0,0,0);
      
      const box = new THREE.Box3().setFromObject(obj);
      const s = new THREE.Vector3();
      box.getSize(s);
      const maxAxis = Math.max(s.x, s.y, s.z);
      
      let targetSize = 5.0; 
      if (!isUFO) targetSize = 25.0; 

      const scaleFactor = targetSize / maxAxis;
      setComputedScale([scaleFactor, scaleFactor, scaleFactor]);
      
      const center = new THREE.Vector3();
      box.getCenter(center);
      obj.position.sub(center);
      
      if (isUFO && visualRef.current) {
         visualRef.current.rotation.x = -Math.PI / 2; 
      }

      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
    }
  }, [obj, url, isUFO]);

  // GAME LOOP
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Update Material
    meshRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (isHologram && isUFO) {
          mesh.material = new THREE.MeshBasicMaterial({ color: "#00ff88", wireframe: true, transparent: true, opacity: 0.4 });
        } else {
          mesh.material = new THREE.MeshStandardMaterial({
            color: isUFO ? "#c0c0c0" : "#8c7b70",
            roughness: isUFO ? 0.3 : 0.9,
            metalness: isUFO ? 0.8 : 0.1,
          });
        }
      }
    });

    if (isDriving && isPlaced) {
      // --- LOGIKA INPUT HYBRID (KEYBOARD + JOYSTICK) ---
      
      // Ambil nilai Joystick (jika ada, default 0)
      const joyX = joystickRef?.current?.x || 0; // Kanan/Kiri (-1 s/d 1)
      const joyY = joystickRef?.current?.y || 0; // Maju/Mundur (-1 s/d 1)

      // Gabungkan input: Jika tekan W atau Joystick didorong ke atas
      // Gunakan Math.max/min agar input tidak tembus batas 1.0
      
      // Input Maju/Mundur (Forward/Backward)
      // Keyboard W=1, S=-1. Joystick Y=1 (Maju), Y=-1 (Mundur)
      let inputForward = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
      if (Math.abs(joyY) > 0.1) inputForward += joyY; // Deadzone 0.1
      inputForward = Math.max(-1, Math.min(1, inputForward)); // Clamp

      // Input Kiri/Kanan (Strafe)
      let inputStrafe = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      if (Math.abs(joyX) > 0.1) inputStrafe += joyX;
      inputStrafe = Math.max(-1, Math.min(1, inputStrafe));

      // Kecepatan
      const maxSpeed = 50;
      const strafeMaxSpeed = 20;

      // --- LOGIKA GERAK BERBASIS VEKTOR KAMERA ---
      
      // 1. Dapatkan arah hadap kamera (Forward Vector)
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; 
      forward.normalize();

      // 2. Dapatkan arah samping (Right Vector)
      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      // 3. Terapkan Gerakan (Support Maju & Mundur Sekarang)
      // Jika inputForward positif (Maju), negatif (Mundur)
      if (Math.abs(inputForward) > 0.01) {
        meshRef.current.position.add(forward.multiplyScalar(inputForward * maxSpeed * delta));
      }
      
      if (Math.abs(inputStrafe) > 0.01) {
        meshRef.current.position.add(right.multiplyScalar(inputStrafe * strafeMaxSpeed * delta));
      }

      // --- SINKRONISASI ROTASI PESAWAT ---
      const camRot = camera.rotation;
      meshRef.current.rotation.y = camRot.y;

      // Efek Visual Banking (Miring saat belok) - Update agar responsif ke Joystick juga
      if (visualRef.current) {
          // Target miring: Kanan (-), Kiri (+)
          // inputStrafe positif = Kanan (D), jadi tilt harus negatif
          const targetTilt = -inputStrafe * 0.6; 
          visualRef.current.rotation.z = THREE.MathUtils.lerp(visualRef.current.rotation.z, targetTilt, 0.1);
          
          visualRef.current.rotation.x = -Math.PI / 2; 
      }

      // --- KAMERA POV (DI DALAM KOKPIT) ---
      if (isUFO) {
        const offset = new THREE.Vector3(0, 0.5, 0); 
        offset.applyAxisAngle(new THREE.Vector3(0,1,0), meshRef.current.rotation.y);
        camera.position.copy(meshRef.current.position).add(offset);
        if (visualRef.current) visualRef.current.visible = false;
      } 
      
    } else {
      // MODE IDLE (Saat tidak menyetir)
      if (visualRef.current) visualRef.current.visible = true;
      const t = state.clock.getElapsedTime();
      meshRef.current.position.y = Math.sin(t * 1) * 0.5;
      meshRef.current.rotation.y += 0.005; 
      
      if(visualRef.current) {
        visualRef.current.rotation.x = -Math.PI / 2;
        visualRef.current.rotation.z = 0;
      }
    }
  });

  if (!isPlaced) return null;

  return (
    <group>
      {/* NOTE UNTUK MOBILE: 
        PointerLockControls tidak berjalan sempurna di Mobile (layar sentuh).
        Idealnya di page.tsx, saat isDriving=true di Mobile, Anda aktifkan OrbitControls (tanpa zoom/pan)
        agar user bisa geser layar untuk menengok (Camera Look), dan Joystick untuk jalan.
      */}
      {isDriving && <PointerLockControls selector="#canvas-container" />}
      
      <group ref={meshRef}>
        <group ref={visualRef}>
           <primitive object={obj} scale={computedScale} />
        </group>

        {isDriving && (
            <spotLight 
                position={[0, 0, 0]} 
                target={meshRef.current}
                angle={0.6} 
                penumbra={1} 
                intensity={800} 
                color="#ccffff" 
                distance={600}
                castShadow
            />
        )}
      </group>
    </group>
  );
}