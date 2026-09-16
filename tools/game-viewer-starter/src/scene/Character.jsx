import { useEffect, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'

/**
 * Loads a real GLB avatar (e.g. the avatar.glb + idle_standing.glb merge
 * from your AI Hologram pipeline) and plays its first animation clip.
 * Point AVATAR_URL in App.jsx at a hosted .glb and this replaces the
 * placeholder automatically — no other changes needed.
 */
export default function Character({ url, position = [0, 0, 0] }) {
  const group = useRef()
  const { scene, animations } = useGLTF(url)
  const { actions, names } = useAnimations(animations, group)

  useEffect(() => {
    const first = names[0]
    if (!first) return
    actions[first]?.reset().fadeIn(0.3).play()
    return () => actions[first]?.fadeOut(0.3)
  }, [actions, names])

  return <primitive ref={group} object={scene} position={position} />
}

/** Stand-in used until a real GLB avatar is wired in above. */
export function PlaceholderCharacter({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.9, 4, 8]} />
        <meshStandardMaterial color="#7f77dd" />
      </mesh>
      <mesh position={[0, 1.68, 0]} castShadow>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color="#f0997b" />
      </mesh>
    </group>
  )
}
