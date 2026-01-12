import { Grid } from '@react-three/drei';

export const Scene = () => {
    return (
        <>
            {/* Floor Grid */}
            <Grid
                infiniteGrid
                fadeDistance={50}
                fadeStrength={5}
                cellSize={1}
                sectionSize={5}
                sectionColor="#94a3b8"
                cellColor="#cbd5e1"
            />

            {/* Origin Marker */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.08]} />
                <meshBasicMaterial color="#ef4444" />
            </mesh>

            {/* Ground Plane (for shadows - slightly visible) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#e2e8f0" opacity={0.5} transparent />
            </mesh>
        </>
    );
};
