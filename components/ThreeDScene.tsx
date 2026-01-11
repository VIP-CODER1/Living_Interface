'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ThreeDSceneProps {
  containerWidth: number;
  containerHeight: number;
}

export function ThreeDScene({ containerWidth, containerHeight }: ThreeDSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectsRef = useRef<THREE.Object3D[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointerMoveRef = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerWidth / containerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerEl.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x3b82f6, prefersReducedMotion ? 0.7 : 1.2);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xec4899, prefersReducedMotion ? 0.5 : 1);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Complex central form: outer dodeca + inner wireframe icosa + orbiting octas
    const complexGroup = new THREE.Group();

    const outerGeometry = new THREE.DodecahedronGeometry(1.6, 0);
    const outerMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7a59,
      metalness: 0.35,
      roughness: 0.45,
      emissive: 0xff7a59,
      emissiveIntensity: prefersReducedMotion ? 0.15 : 0.3,
      transparent: true,
      opacity: 0.9,
    });
    const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
    outerMesh.castShadow = true;
    outerMesh.receiveShadow = true;
    complexGroup.add(outerMesh);

    const innerGeometry = new THREE.IcosahedronGeometry(1, 0);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x4dd9c7,
      emissive: 0x4dd9c7,
      emissiveIntensity: prefersReducedMotion ? 0.08 : 0.18,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    complexGroup.add(innerMesh);

    const orbitingOctas: THREE.Mesh[] = [];
    const orbitColors = [0xff7a59, 0x4dd9c7, 0x45b7d1, 0xf9ca24, 0x6c5ce7, 0xff7675];
    for (let i = 0; i < 6; i++) {
      const octGeo = new THREE.OctahedronGeometry(0.35, 0);
      const octMat = new THREE.MeshStandardMaterial({
        color: orbitColors[i],
        emissive: orbitColors[i],
        emissiveIntensity: prefersReducedMotion ? 0.15 : 0.35,
        transparent: true,
        opacity: 0.75,
      });
      const oct = new THREE.Mesh(octGeo, octMat);
      const angle = (i / 6) * Math.PI * 2;
      oct.position.set(Math.cos(angle) * 2.6, Math.sin(angle) * 0.5, Math.sin(angle) * 2.6);
      (oct as any).userData = { angle, radius: 2.6 };
      complexGroup.add(oct);
      orbitingOctas.push(oct);
    }

    scene.add(complexGroup);
    objectsRef.current.push(complexGroup);

    // Create floating geometric shards (tetrahedrons) around the complex form
    const shards: THREE.Mesh[] = [];
    const shardCount = 8;
    const shardColors = [0x06b6d4, 0x10b981, 0x3b82f6, 0x8b5cf6, 0xec4899, 0xf59e0b, 0x84cc16, 0x06b6d4];

    for (let i = 0; i < shardCount; i++) {
      const shardGeometry = new THREE.TetrahedronGeometry(0.5, 0);
      const shardMaterial = new THREE.MeshStandardMaterial({
        color: shardColors[i],
        metalness: 0.6,
        roughness: 0.3,
        emissive: shardColors[i],
        emissiveIntensity: 0.3,
      });
      const shard = new THREE.Mesh(shardGeometry, shardMaterial);
      shard.castShadow = true;
      shard.receiveShadow = true;

      // Random positioning around center
      const angle = (i / shardCount) * Math.PI * 2;
      const distance = 3 + Math.random() * 1.5;
      const height = (Math.random() - 0.5) * 4;

      shard.position.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      (shard as any).userData = {
        positionAngle: angle,
        positionDistance: distance,
        positionHeight: height,
        initialRotation: {
          x: shard.rotation.x,
          y: shard.rotation.y,
          z: shard.rotation.z,
        },
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02,
        },
        orbitSpeed: (Math.random() - 0.5) * 0.001,
      };

      scene.add(shard);
      shards.push(shard);
      objectsRef.current.push(shard);
    }

    // Create network particles and lines
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    const particleData: any[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 8;
      const z = (Math.random() - 0.5) * 10;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      particleData.push({
        x,
        y,
        z,
        velocityX: (Math.random() - 0.5) * 0.02,
        velocityY: (Math.random() - 0.5) * 0.02,
        velocityZ: (Math.random() - 0.5) * 0.02,
      });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xfbf51d,
      size: 0.1,
      sizeAttenuation: true,
      opacity: 0.8,
      transparent: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    objectsRef.current.push(particles);

    // Create network lines
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions: number[] = [];
    let staticLinePositions: Float32Array;

    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = particleData[j].x - particleData[i].x;
        const dy = particleData[j].y - particleData[i].y;
        const dz = particleData[j].z - particleData[i].z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < 3) {
          linePositions.push(particleData[i].x, particleData[i].y, particleData[i].z);
          linePositions.push(particleData[j].x, particleData[j].y, particleData[j].z);
        }
      }
    }

    staticLinePositions = new Float32Array(linePositions);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(staticLinePositions, 3));
    lineGeometry.setDrawRange(0, staticLinePositions.length / 3);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x64748b,
      linewidth: 1,
      opacity: 0.4,
      transparent: true,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);
    objectsRef.current.push(lines);

    // Create glow layer (post-processing effect with overlays)
    const glowGeometry = new THREE.IcosahedronGeometry(2.1, 0);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff7a59,
      transparent: true,
      opacity: prefersReducedMotion ? 0.05 : 0.12,
      wireframe: false,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    complexGroup.add(glow);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const now = Date.now();
      const isPointerActive = now - lastPointerMoveRef.current < 800; // active only shortly after pointer move
      const motionScale = prefersReducedMotion ? 0.25 : 1;

      // Rotate complex centerpiece
      complexGroup.rotation.x += 0.0012 * motionScale;
      complexGroup.rotation.y += 0.002 * motionScale;
      complexGroup.rotation.z += 0.0007 * motionScale;

      innerMesh.rotation.x -= 0.0015 * motionScale;
      innerMesh.rotation.y += 0.001 * motionScale;

      orbitingOctas.forEach((oct) => {
        const data = (oct as any).userData;
        data.angle += 0.0008 * motionScale;
        oct.position.x = Math.cos(data.angle) * data.radius;
        oct.position.z = Math.sin(data.angle) * data.radius;
        oct.position.y = Math.sin(data.angle * 2) * 0.5;
        oct.rotation.x += 0.002 * motionScale;
        oct.rotation.y += 0.0025 * motionScale;
      });

      // Animate shards
      shards.forEach((shard) => {
        const data = (shard as any).userData;

        // Orbit around center
        data.positionAngle += data.orbitSpeed;
        shard.position.x = Math.cos(data.positionAngle) * data.positionDistance;
        shard.position.z = Math.sin(data.positionAngle) * data.positionDistance;
        shard.position.y = data.positionHeight + Math.sin(Date.now() * 0.0005) * 0.5;

        // Rotate shard
        shard.rotation.x += data.rotationSpeed.x;
        shard.rotation.y += data.rotationSpeed.y;
        shard.rotation.z += data.rotationSpeed.z;
      });

      // Animate particles
      const positionAttribute = particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const posArray = positionAttribute.array as Float32Array;

      for (let i = 0; i < particleData.length; i++) {
        const particle = particleData[i];

        // When pointer is active, attract particles toward cursor plane; otherwise gently slow them
        if (isPointerActive) {
          const mouseTargetX = mouseRef.current.x * 8;
          const mouseTargetY = mouseRef.current.y * -6;
          particle.velocityX += (mouseTargetX - particle.x) * 0.0004 * (prefersReducedMotion ? 0.6 : 1);
          particle.velocityY += (mouseTargetY - particle.y) * 0.0004 * (prefersReducedMotion ? 0.6 : 1);
        } else {
          particle.velocityX *= prefersReducedMotion ? 0.9 : 0.96;
          particle.velocityY *= prefersReducedMotion ? 0.9 : 0.96;
          particle.velocityZ *= prefersReducedMotion ? 0.9 : 0.96;
        }

        // Update position
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.z += particle.velocityZ;

        // Bounce off boundaries
        if (Math.abs(particle.x) > 5) particle.velocityX *= -1;
        if (Math.abs(particle.y) > 4) particle.velocityY *= -1;
        if (Math.abs(particle.z) > 5) particle.velocityZ *= -1;

        posArray[i * 3] = particle.x;
        posArray[i * 3 + 1] = particle.y;
        posArray[i * 3 + 2] = particle.z;
      }
      positionAttribute.needsUpdate = true;

      // Rebuild dynamic lines only when the pointer is active; otherwise show the static network
      if (isPointerActive) {
        const dynamicLinePositions: number[] = [];
        for (let i = 0; i < particleData.length; i++) {
          for (let j = i + 1; j < particleData.length; j++) {
            const dx = particleData[j].x - particleData[i].x;
            const dy = particleData[j].y - particleData[i].y;
            const dz = particleData[j].z - particleData[i].z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Slightly larger connect radius when the cursor is near either particle
            const mouseTargetX = mouseRef.current.x * 8;
            const mouseTargetY = mouseRef.current.y * -6;
            const distToMouseA = Math.hypot(particleData[i].x - mouseTargetX, particleData[i].y - mouseTargetY);
            const distToMouseB = Math.hypot(particleData[j].x - mouseTargetX, particleData[j].y - mouseTargetY);
            const proximityBoost = distToMouseA < 2.5 || distToMouseB < 2.5 ? 0.8 : 0;

            if (distance < 3 + proximityBoost) {
              dynamicLinePositions.push(
                particleData[i].x, particleData[i].y, particleData[i].z,
                particleData[j].x, particleData[j].y, particleData[j].z
              );
            }
          }
        }
        const dynArray = new Float32Array(dynamicLinePositions);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(dynArray, 3));
        lineGeometry.setDrawRange(0, dynArray.length / 3);
        lineMaterial.opacity = (prefersReducedMotion ? 0.25 : 0.35) + Math.min(0.35, Math.abs(mouseRef.current.x) + Math.abs(mouseRef.current.y)) * (prefersReducedMotion ? 0.2 : 0.35);
      } else {
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(staticLinePositions, 3));
        lineGeometry.setDrawRange(0, staticLinePositions.length / 3);
        lineMaterial.opacity = prefersReducedMotion ? 0.18 : 0.25;
      }

      // Subtle camera movement
      camera.position.x = Math.sin(Date.now() * 0.0002) * 0.5 * motionScale;
      camera.position.y = Math.cos(Date.now() * 0.0001) * 0.3 * motionScale;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Track pointer movement to influence network flow
    const handlePointerMove = (event: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      mouseRef.current = { x: nx, y: ny };
      lastPointerMoveRef.current = Date.now();
    };

    containerRef.current.addEventListener('pointermove', handlePointerMove);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;

      const width = containerWidth;
      const height = containerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      containerEl.removeEventListener('pointermove', handlePointerMove);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (renderer.domElement.parentNode === containerEl) {
        containerEl.removeChild(renderer.domElement);
      }
      renderer.dispose();
      outerGeometry.dispose();
      outerMaterial.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      orbitingOctas.forEach((oct) => {
        (oct.geometry as THREE.BufferGeometry).dispose();
        (oct.material as THREE.Material).dispose();
      });
      shards.forEach((shard) => {
        (shard.geometry as THREE.BufferGeometry).dispose();
        (shard.material as THREE.Material).dispose();
      });
      particleGeometry.dispose();
      (particleMaterial as THREE.Material).dispose();
      lineGeometry.dispose();
      (lineMaterial as THREE.Material).dispose();
      glowGeometry.dispose();
      (glowMaterial as THREE.Material).dispose();
    };
  }, [containerWidth, containerHeight, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
    />
  );
}
