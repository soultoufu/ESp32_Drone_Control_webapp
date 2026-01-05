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
                sectionColor="#334155"
                cellColor="#1e293b"
            />

            {/* Origin Marker */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.05]} />
                <meshBasicMaterial color="#ef4444" />
            </mesh>

            {/* Ground Plane (for shadows) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <shadowMaterial opacity={0.4} />
            </mesh>
        </>
    );
};
