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
            {/* Main Body — brighter, more vivid blue with stronger emissive glow */}
            <mesh castShadow>
                <boxGeometry args={[0.4, 0.1, 0.4]} />
                <meshStandardMaterial
                    color="#60a5fa"
                    roughness={0.2}
                    metalness={0.9}
                    emissive="#3b82f6"
                    emissiveIntensity={0.15}
                />
            </mesh>

            {/* Arms — lighter for better contrast */}
            <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
                <boxGeometry args={[0.6, 0.05, 0.05]} />
                <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh rotation={[0, -Math.PI / 4, 0]} castShadow>
                <boxGeometry args={[0.6, 0.05, 0.05]} />
                <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Rotors — brighter with emissive ring for visibility */}
            {[[-0.3, 0.3], [0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]].map((pos, i) => (
                <group key={i} position={[pos[0], 0.08, pos[1]]}>
                    {/* Rotor disc */}
                    <mesh>
                        <cylinderGeometry args={[0.15, 0.15, 0.01, 16]} />
                        <meshStandardMaterial
                            color="#cbd5e1"
                            transparent
                            opacity={0.4}
                        />
                    </mesh>
                    {/* Rotor ring glow */}
                    <mesh>
                        <torusGeometry args={[0.15, 0.008, 8, 24]} />
                        <meshStandardMaterial
                            color="#38bdf8"
                            emissive="#38bdf8"
                            emissiveIntensity={0.6}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                </group>
            ))}

            {/* Front Indicator (Camera/LED) — brighter and more visible */}
            <mesh position={[0, 0, -0.21]}>
                <boxGeometry args={[0.1, 0.05, 0.02]} />
                <meshStandardMaterial
                    color="#ef4444"
                    emissive="#ef4444"
                    emissiveIntensity={3}
                />
            </mesh>

            {/* Drone point light — creates a glow around the drone for visibility */}
            <pointLight
                position={[0, 0.15, 0]}
                color="#38bdf8"
                intensity={0.5}
                distance={2}
                decay={2}
            />
        </group>
    );
};
