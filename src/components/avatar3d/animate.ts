import type * as THREE from "three";

export const CLIPS = [
  { id: "idle", label: "Idle" },
  { id: "walk", label: "Walk" },
  { id: "run", label: "Run" },
  { id: "wave", label: "Wave" },
  { id: "turn", label: "Look around" },
  { id: "sit", label: "Sit" },
  { id: "jump", label: "Jump" },
  { id: "dance", label: "Sway" },
] as const;

export type ClipId = (typeof CLIPS)[number]["id"];

export const CLIP_PROMPTS: Record<ClipId, string> = {
  idle: "The adult subject stands in a natural idle, breathing and shifting weight slightly, cinematic.",
  walk: "The adult subject walks forward with a natural gait, arms swinging, cinematic.",
  run: "The adult subject jogs in place then forward with athletic form, cinematic.",
  wave: "The adult subject looks to camera and waves with a relaxed right hand, cinematic.",
  turn: "The adult subject slowly turns and glances over the shoulder, cinematic.",
  sit: "The adult subject sits down into a composed seated pose, cinematic.",
  jump: "The adult subject makes a small grounded jump and lands softly, cinematic.",
  dance: "The adult subject sways in a subtle rhythmic dance, cinematic.",
};

type Parts = {
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
};

export function applyClip(root: THREE.Group, clip: ClipId, t: number, inPlace: boolean) {
  const p = root.userData.parts as Parts | undefined;
  if (!p) return;

  const lz = Number(p.leftArm.userData.restZ) || -0.2;
  const rz = Number(p.rightArm.userData.restZ) || 0.2;
  p.head.rotation.set(0, 0, 0);
  p.torso.rotation.set(0, 0, 0);
  p.torso.position.y = 1.26;
  p.leftArm.rotation.set(0, 0, lz);
  p.rightArm.rotation.set(0, 0, rz);
  p.leftLeg.rotation.set(0, 0, 0);
  p.rightLeg.rotation.set(0, 0, 0);
  root.position.set(0, 0, 0);
  if (clip !== "turn") root.rotation.y = 0;

  switch (clip) {
    case "idle": {
      p.torso.position.y = 1.26 + Math.sin(t * 2.1) * 0.012;
      p.head.rotation.y = Math.sin(t * 0.6) * 0.08;
      p.leftArm.rotation.x = Math.sin(t * 2.1) * 0.04;
      p.rightArm.rotation.x = -Math.sin(t * 2.1) * 0.04;
      break;
    }
    case "walk": {
      const s = Math.sin(t * 7);
      p.leftArm.rotation.x = s * 0.55;
      p.rightArm.rotation.x = -s * 0.55;
      p.leftLeg.rotation.x = -s * 0.65;
      p.rightLeg.rotation.x = s * 0.65;
      p.torso.rotation.y = s * 0.05;
      if (!inPlace) root.position.z = ((t * 0.55) % 2.4) - 1.2;
      break;
    }
    case "run": {
      const s = Math.sin(t * 11);
      p.leftArm.rotation.x = s * 0.85;
      p.rightArm.rotation.x = -s * 0.85;
      p.leftLeg.rotation.x = -s * 0.9;
      p.rightLeg.rotation.x = s * 0.9;
      p.torso.position.y = 1.26 + Math.abs(s) * 0.04;
      p.torso.rotation.x = 0.12;
      if (!inPlace) root.position.z = ((t * 1.1) % 2.4) - 1.2;
      break;
    }
    case "wave": {
      p.rightArm.rotation.z = rz - 1.35;
      p.rightArm.rotation.x = Math.sin(t * 8) * 0.45;
      p.head.rotation.y = 0.12;
      break;
    }
    case "turn": {
      root.rotation.y = Math.sin(t * 0.7) * 0.85;
      p.head.rotation.y = Math.sin(t * 0.7) * 0.2;
      break;
    }
    case "sit": {
      p.leftLeg.rotation.x = -1.15;
      p.rightLeg.rotation.x = -1.15;
      root.position.y = -0.28;
      p.torso.rotation.x = 0.08;
      p.leftArm.rotation.x = 0.35;
      p.rightArm.rotation.x = 0.35;
      break;
    }
    case "jump": {
      const cycle = (t % 1.2) / 1.2;
      const up = cycle < 0.45 ? Math.sin((cycle / 0.45) * Math.PI) : 0;
      root.position.y = up * 0.42;
      p.leftLeg.rotation.x = up * -0.4;
      p.rightLeg.rotation.x = up * -0.4;
      p.leftArm.rotation.x = -up * 0.5;
      p.rightArm.rotation.x = -up * 0.5;
      break;
    }
    case "dance": {
      p.torso.rotation.y = Math.sin(t * 3) * 0.25;
      p.torso.rotation.z = Math.sin(t * 1.5) * 0.08;
      p.leftArm.rotation.z = lz - 0.4 + Math.sin(t * 3) * 0.35;
      p.rightArm.rotation.z = rz + 0.4 + Math.cos(t * 3) * 0.35;
      p.head.rotation.y = Math.sin(t * 3) * 0.15;
      break;
    }
    default:
      break;
  }
}
