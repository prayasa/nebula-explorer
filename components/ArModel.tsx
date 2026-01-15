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
}

export default function ArModel({ url, isPlaced, isDriving, isHologram }: ArModelProps) {
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

  // Setup Model
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
      
      // ROTASI VISUAL: Tidurkan UFO (-90 derajat X) HANYA di visualRef
      // meshRef biarkan normal agar kalkulasi arah mudah
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
      const moveSpeed = keys.w ? 50 : (keys.s ? 0 : 0); // Kecepatan Maju
      const strafeSpeed = 20;

      // --- LOGIKA GERAK BERBASIS VEKTOR KAMERA (PASTI BENAR) ---
      
      // 1. Dapatkan arah hadap kamera (Forward Vector)
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; // Kunci gerakan agar tidak naik/turun otomatis (opsional, biar seperti pesawat datar dulu)
      forward.normalize();

      // 2. Dapatkan arah samping (Right Vector)
      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      // 3. Terapkan Gerakan ke Posisi Pesawat (meshRef)
      if (moveSpeed > 0) {
        meshRef.current.position.add(forward.multiplyScalar(moveSpeed * delta));
      }
      if (keys.a) {
        meshRef.current.position.add(right.multiplyScalar(-strafeSpeed * delta));
      }
      if (keys.d) {
        meshRef.current.position.add(right.multiplyScalar(strafeSpeed * delta));
      }

      // --- SINKRONISASI ROTASI PESAWAT ---
      // Pesawat menghadap kemana kamera menghadap (Yaw only)
      const camRot = camera.rotation;
      meshRef.current.rotation.y = camRot.y;

      // Efek Visual Banking (Miring saat belok)
      if (visualRef.current) {
          const targetTilt = keys.a ? 0.6 : (keys.d ? -0.6 : 0);
          visualRef.current.rotation.z = THREE.MathUtils.lerp(visualRef.current.rotation.z, targetTilt, 0.1);
          // Pastikan rotasi 'tidur' UFO tetap terjaga
          visualRef.current.rotation.x = -Math.PI / 2; 
      }

      // --- KAMERA POV (DI DALAM KOKPIT) ---
      if (isUFO) {
        // Tempelkan kamera persis di titik pivot pesawat (0,0,0)
        // Karena pesawat sudah bergerak maju, kamera akan ikut maju.
        // PointerLockControls menangani rotasi kamera (look), kita hanya menangani posisi.
        
        // Offset sedikit supaya pas di mata pilot (Naik dikit, Maju dikit)
        // Gunakan posisi dunia pesawat + offset vektor rotasi
        const offset = new THREE.Vector3(0, 0.5, 0); 
        offset.applyAxisAngle(new THREE.Vector3(0,1,0), meshRef.current.rotation.y);
        
        camera.position.copy(meshRef.current.position).add(offset);

        // Sembunyikan visual pesawat saat driving agar tidak menghalangi pandangan
        if (visualRef.current) visualRef.current.visible = false;
      } 
      
    } else {
      // MODE IDLE (Saat tidak menyetir)
      if (visualRef.current) visualRef.current.visible = true;
      const t = state.clock.getElapsedTime();
      meshRef.current.position.y = Math.sin(t * 1) * 0.5;
      meshRef.current.rotation.y += 0.005; 
      
      // Reset visual tilt
      if(visualRef.current) {
        visualRef.current.rotation.x = -Math.PI / 2;
        visualRef.current.rotation.z = 0;
      }
    }
  });

  if (!isPlaced) return null;

  return (
    <group>
      {/* KONTROL KAMERA (FPS STYLE) */}
      {isDriving && <PointerLockControls selector="#canvas-container" />}
      
      {/* WADAH UTAMA (Gerak & Rotasi Arah) */}
      <group ref={meshRef}>
        
        {/* WADAH VISUAL (Model 3D + Efek Miring) */}
        <group ref={visualRef}>
           <primitive object={obj} scale={computedScale} />
        </group>

        {/* Lampu Sorot */}
        {isDriving && (
            <spotLight 
                position={[0, 0, 0]} 
                target={meshRef.current} // Target ke wadah utama (selalu depan)
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