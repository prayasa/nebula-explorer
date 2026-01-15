"use client";
import { useLoader, useFrame } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export default function SolarSystem() {
  // 1. MEMUAT MODEL 3 s/d 9 (Sesuai instruksi Anda)
  // Pastikan file-file ini ada di folder: public/assets/
  const urls = [
    "/assets/model2.obj", // Asteroid (Model 2)
    "/assets/model3.obj", "/assets/model4.obj", "/assets/model5.obj", 
    "/assets/model6.obj", "/assets/model7.obj", "/assets/model8.obj", "/assets/model9.obj"
  ];
  
  const models = useLoader(OBJLoader, urls) as THREE.Group[];
  const blackHoleRef = useRef<THREE.Mesh>(null);

  const planets = useMemo(() => {
    return models.map((originalModel, index) => {
        const clone = originalModel.clone();
        
        // --- LOGIKA SKALA & POSISI BARU (RAPI) ---
        const box = new THREE.Box3().setFromObject(clone);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxAxis = Math.max(size.x, size.y, size.z);
        
        // Skala Planet Besar
        const targetSize = index === 0 ? 10 : 35; // Asteroid kecil, Planet besar
        const scaleFactor = targetSize / maxAxis;
        clone.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Center Pivot
        const center = new THREE.Vector3();
        box.getCenter(center);
        clone.position.sub(center);

        // ROTASI HORIZONTAL (Sesuai request)
        clone.rotation.x = -Math.PI / 2; // Agar tidak berdiri vertikal
        clone.rotation.z = Math.random() * Math.PI; // Variasi putaran

        // --- POSISI YANG DITENTUKAN (TIDAK ACAK LAGI) ---
        // Kita buat mereka mengelilingi pemain dalam lingkaran besar
        const angle = (index / models.length) * Math.PI * 2; // Bagi rata 360 derajat
        const radius = 150 + (index * 40); // Jarak bertingkat (spiral)
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 20; // Sedikit variasi tinggi biar natural

        const wrapper = new THREE.Group();
        wrapper.add(clone);
        wrapper.position.set(x, y, z);

        // Warna-warni Planet
        const colors = ["#888888", "#ff4400", "#0088ff", "#00ff88", "#aa00ff", "#ffaa00", "#00ffff", "#ff0088"];
        
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.material = new THREE.MeshStandardMaterial({
                    color: colors[index % colors.length],
                    roughness: 0.8,
                    metalness: 0.2
                });
            }
        });

        return wrapper;
    });
  }, [models]);

  // Animasi Blackhole
  useFrame((state, delta) => {
    if (blackHoleRef.current) {
        blackHoleRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group>
      {planets.map((obj, i) => <primitive key={i} object={obj} />)}

      {/* Black Hole di posisi tetap (Depan Jauh) */}
      <group position={[0, 20, -500]}>
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <torusGeometry args={[150, 20, 32, 100]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} />
        </mesh>
        <mesh ref={blackHoleRef}>
            <sphereGeometry args={[100, 32, 32]} />
            <meshBasicMaterial color="black" />
        </mesh>
      </group>
    </group>
  );
}