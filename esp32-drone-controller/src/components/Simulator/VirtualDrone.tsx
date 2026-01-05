import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VirtualDroneProps {
    position: [number, number, number];
    rotation: [number, number, number];
}

export const VirtualDrone = ({ position, rotation }: VirtualDroneProps) => {
    const meshRef = useRef<THREE.Group>(null);

    // Simple animation or state-based movement will go here
    useFrame((state) => {
        if (!meshRef.current) return;
        // Hover effect
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
        meshRef.current.position.x = position[0];
        meshRef.current.position.z = position[2];

        meshRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    });

    return (
        <group ref={meshRef}>
            {/* Main Body */}
            <mesh castShadow>
                <boxGeometry args={[0.4, 0.1, 0.4]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Arms */}
            <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
                <boxGeometry args={[0.6, 0.05, 0.05]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh rotation={[0, -Math.PI / 4, 0]} castShadow>
                <boxGeometry args={[0.6, 0.05, 0.05]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>

            {/* Rotors (Placeholders) */}
            {[[-0.3, 0.3], [0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]].map((pos, i) => (
                <mesh key={i} position={[pos[0], 0.08, pos[1]]}>
                    <cylinderGeometry args={[0.15, 0.15, 0.01, 16]} />
                    <meshStandardMaterial color="#94a3b8" transparent opacity={0.6} />
                </mesh>
            ))}

            {/* Front Indicator (Camera/LED) */}
            <mesh position={[0, 0, -0.21]}>
                <boxGeometry args={[0.1, 0.05, 0.02]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
            </mesh>
        </group>
    );
};
