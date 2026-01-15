"use client";
import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function SpaceDebris({ count = 1000 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  
  // Area sebaran debris (Kubus 400x400x400 di sekitar player)
  const range = 400; 

  // Inisialisasi posisi awal secara acak
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * range;
      const y = (Math.random() - 0.5) * range;
      const z = (Math.random() - 0.5) * range;
      // Simpan posisi asli di memori agar bisa dimanipulasi relatif terhadap kamera
      temp.push({ 
        x, y, z, 
        scale: Math.random() * 0.8 + 0.2, // Variasi ukuran
        rotationSpeed: (Math.random() - 0.5) * 0.02 
      });
    }
    return temp;
  }, [count]);

  const dummy = new THREE.Object3D();

  useFrame(() => {
    if (!mesh.current) return;

    // Ambil posisi kamera saat ini
    const camPos = camera.position;

    particles.forEach((particle, i) => {
      // 1. Logika ENDLESS (Infinite Tiling)
      // Kita hitung posisi relatif partikel terhadap kamera
      // Jika partikel terlalu jauh di belakang/kiri/kanan, kita "lempar" ke sisi sebaliknya.
      
      let x = particle.x;
      let y = particle.y;
      let z = particle.z;

      // Hitung offset berdasarkan posisi kamera (Modulo logic untuk seamless looping)
      // Ini membuat seolah-olah kita terbang di lautan debris yang tak berujung
      
      // Rumus: (PosisiAwal - PosisiKamera) % Range
      // Kita tambahkan logic agar tetap center di 0
      
      const relativeX = (x - camPos.x) % range;
      const relativeY = (y - camPos.y) % range;
      const relativeZ = (z - camPos.z) % range;

      // Koreksi batas (wrapping) agar debris selalu ada di radius -range/2 sampai +range/2
      const finalX = camPos.x + (Math.abs(relativeX) > range/2 ? relativeX - Math.sign(relativeX)*range : relativeX);
      const finalY = camPos.y + (Math.abs(relativeY) > range/2 ? relativeY - Math.sign(relativeY)*range : relativeY);
      const finalZ = camPos.z + (Math.abs(relativeZ) > range/2 ? relativeZ - Math.sign(relativeZ)*range : relativeZ);

      // 2. Update Matrix
      dummy.position.set(finalX, finalY, finalZ);
      dummy.scale.setScalar(particle.scale);
      
      // Rotasi batu asteroidnya saja (kosmetik)
      dummy.rotation.x += particle.rotationSpeed;
      dummy.rotation.z += particle.rotationSpeed;
      
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      {/* Menggunakan Dodecahedron agar terlihat seperti batu tajam */}
      <dodecahedronGeometry args={[0.5, 0]} /> 
      <meshStandardMaterial 
        color="#888888" 
        roughness={0.8} 
        metalness={0.2}
      />
    </instancedMesh>
  );
}