import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Character, { PlaceholderCharacter } from './scene/Character.jsx'
import PlaceholderEnvironment from './scene/Environment.jsx'

// Point this at a hosted .glb (e.g. AI Hologram's avatar.glb) once you have
// one reachable by URL. Leave it null to see the placeholder capsule figure.
const AVATAR_URL = null

export default function App() {
  return (
    <Canvas shadows camera={{ position: [6, 4, 9], fov: 50 }}>
      <color attach="background" args={['#0c0c0f']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 9, 4]} intensity={1.1} castShadow />
      <Suspense fallback={null}>
        <PlaceholderEnvironment />
        {AVATAR_URL ? (
          <Character url={AVATAR_URL} position={[0, 0, 0]} />
        ) : (
          <PlaceholderCharacter position={[0, 0, 0]} />
        )}
      </Suspense>
      <OrbitControls target={[0, 1.2, 0]} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  )
}
