import { Grid } from '@react-three/drei';

export const Scene = () => {
    return (
        <>
            {/* Floor Grid — improved contrast with brighter grid lines */}
            <Grid
                infiniteGrid
                fadeDistance={50}
                fadeStrength={5}
                cellSize={1}
                sectionSize={5}
                sectionColor="#475569"
                cellColor="#334155"
            />

            {/* Origin Marker — brighter red for better visibility */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial
                    color="#ef4444"
                    emissive="#ef4444"
                    emissiveIntensity={0.8}
                />
            </mesh>

            {/* Axis indicators at origin for spatial orientation */}
            {/* X axis (red) */}
            <mesh position={[0.5, 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.015, 0.015, 1, 8]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
            </mesh>
            {/* Z axis (blue) */}
            <mesh position={[0, 0.01, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 1, 8]} />
                <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.4} />
            </mesh>
            {/* Y axis (green) */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 1, 8]} />
                <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.4} />
            </mesh>

            {/* Ground Plane (for shadows - slightly visible) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#0f172a" opacity={0.7} transparent />
            </mesh>
        </>
    );
};
