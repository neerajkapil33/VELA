import { Grid } from '@react-three/drei'

/**
 * Stand-in until a WorldMirror reconstruction (or WorldGen output) is
 * exported as a mesh and loaded here the same way Character.jsx loads
 * an avatar — a mesh is a mesh once it's out of the pipeline, so this
 * component is where a real .glb/.obj environment would be dropped in.
 */
export default function PlaceholderEnvironment() {
  const blocks = [
    [-4, 1, 2, '#5dcaa5'],
    [3.5, 1.4, -3, '#4fb8c9'],
    [6, 0.9, 3.5, '#e7b75f'],
  ]
  return (
    <group>
      <Grid args={[40, 40]} cellColor="#3a3a42" sectionColor="#55555f" fadeDistance={28} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#e7ede9" />
      </mesh>
      {blocks.map(([x, h, z, color], i) => (
        <mesh key={i} position={[x, h, z]} castShadow>
          <boxGeometry args={[1.4, h * 2, 1.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}
