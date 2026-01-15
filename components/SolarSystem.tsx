"use client";
import { useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export default function SolarSystem() {
  // 1. GANTI URL KE .GLB
  const urls = [
    "/assets/model2.glb", 
    "/assets/model3.glb", "/assets/model4.glb", "/assets/model5.glb", 
    "/assets/model6.glb", "/assets/model7.glb", "/assets/model8.glb", "/assets/model9.glb"
  ];
  
  // 2. GANTI LOADER JADI GLTFLoader
  // Hasil load GLTF bukan langsung Group, tapi object { scene, animations, ... }
  const gltfs = useLoader(GLTFLoader, urls);
  
  const blackHoleRef = useRef<THREE.Mesh>(null);

  const planets = useMemo(() => {
    return gltfs.map((gltf, index) => {
        // Ambil 'scene' dari hasil load GLTF
        const originalScene = gltf.scene;
        
        // Clone deep agar independen
        const clone = originalScene.clone(true);
        
        // --- Optimasi & Culling ---
        clone.traverse((child) => {
             if ((child as THREE.Mesh).isMesh) {
                 child.frustumCulled = true;
                 child.castShadow = false; 
                 child.receiveShadow = false;
             }
        });

        // --- Logika Skala & Posisi (Sama seperti sebelumnya) ---
        const box = new THREE.Box3().setFromObject(clone);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxAxis = Math.max(size.x, size.y, size.z);
        
        const targetSize = index === 0 ? 10 : 35;
        const scaleFactor = targetSize / maxAxis;
        clone.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const center = new THREE.Vector3();
        box.getCenter(center);
        clone.position.sub(center);

        clone.rotation.x = -Math.PI / 2; // Sesuaikan jika orientasi GLB beda
        clone.rotation.z = Math.random() * Math.PI;

        const angle = (index / gltfs.length) * Math.PI * 2;
        const radius = 150 + (index * 40);
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 20;

        const wrapper = new THREE.Group();
        wrapper.add(clone);
        wrapper.position.set(x, y, z);

        // --- Override Material (Opsional) ---
        // Jika GLB sudah ada texture bagus, hapus bagian ini agar texture asli muncul.
        // Jika ingin tetap warna-warni flat, biarkan kode ini.
        const colors = ["#888888", "#ff4400", "#0088ff", "#00ff88", "#aa00ff", "#ffaa00", "#00ffff", "#ff0088"];
        
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                // Hapus baris di bawah ini jika ingin mempertahankan texture asli dari GLB
                mesh.material = new THREE.MeshStandardMaterial({
                    color: colors[index % colors.length],
                    roughness: 0.8,
                    metalness: 0.2
                });
            }
        });

        return wrapper;
    });
  }, [gltfs]);

  useFrame((state, delta) => {
    if (blackHoleRef.current) {
        blackHoleRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group>
      {planets.map((obj, i) => <primitive key={i} object={obj} />)}

      <group position={[0, 20, -500]}>
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <torusGeometry args={[150, 20, 16, 32]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} />
        </mesh>
        <mesh ref={blackHoleRef}>
            <sphereGeometry args={[100, 16, 16]} />
            <meshBasicMaterial color="black" />
        </mesh>
      </group>
    </group>
  );
}