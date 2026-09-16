import * as THREE from "three";
import { CLOTH, EYES, HAIR, SKIN, type AvatarRig } from "./rig";

function col(hex: string) {
  return new THREE.Color(hex);
}

function physical(color: string, extra?: ConstructorParameters<typeof THREE.MeshPhysicalMaterial>[0]) {
  return new THREE.MeshPhysicalMaterial({
    color: col(color),
    roughness: 0.45,
    metalness: 0.04,
    sheen: 0.22,
    sheenColor: col("#f3efe8"),
    ...extra,
  });
}

function mesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx = 1,
  sy = 1,
  sz = 1,
  rx = 0,
  ry = 0,
  rz = 0,
) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

export function buildFigure(rig: AvatarRig): THREE.Group {
  const g = rig.gender;
  const root = new THREE.Group();

  const skin = physical(SKIN[rig.skin] ?? SKIN[2], { roughness: 0.38, sheen: 0.4 });
  const hairMat = physical(HAIR[rig.hairColor] ?? HAIR[1], { roughness: 0.58 });
  const cloth = physical(CLOTH[rig.outfitColor] ?? CLOTH[0], { roughness: 0.64, sheen: 0.5 });
  const dark = physical("#17141c", { roughness: 0.72 });
  const white = new THREE.MeshStandardMaterial({ color: "#f7f4ef", roughness: 0.28 });
  const iris = new THREE.MeshStandardMaterial({ color: EYES[rig.eye] ?? EYES[0], roughness: 0.22 });
  const pupil = new THREE.MeshStandardMaterial({ color: "#0b0a0d", roughness: 0.18 });
  const brow = physical(HAIR[rig.hairColor] ?? HAIR[1], { roughness: 0.5 });
  const lip = physical(SKIN[rig.skin] ?? SKIN[2], { roughness: 0.3, sheen: 0.55 });
  lip.color.offsetHSL(0.02, 0.12, -0.08);

  const shoulderW = 0.34 + g * 0.14;
  const hipW = 0.3 - g * 0.05;
  const chestD = 0.16 + g * 0.04;

  const hipY = 0.92;
  mesh(root, new THREE.SphereGeometry(hipW * 0.55, 20, 14), skin, 0, hipY, 0, 1, 0.62, 0.78);

  const torsoH = 0.42;
  const torso = new THREE.Group();
  torso.position.y = hipY + 0.34;
  root.add(torso);

  if (rig.outfit === 1) {
    mesh(torso, new THREE.CapsuleGeometry(0.16, torsoH, 8, 16), cloth, 0, 0, 0, shoulderW / 0.32, 1, chestD / 0.16 + 0.15);
    mesh(torso, new THREE.BoxGeometry(0.018, 0.36, 0.01), new THREE.MeshStandardMaterial({ color: "#d9d4cb" }), 0, 0.02, 0.175);
  } else if (rig.outfit === 2) {
    mesh(torso, new THREE.CapsuleGeometry(0.17, 0.5, 8, 16), cloth, 0, 0.04, 0, shoulderW / 0.34, 1, 0.95);
  } else if (rig.outfit === 3) {
    mesh(torso, new THREE.CylinderGeometry(shoulderW * 0.42, hipW * 0.48, 0.34, 16), cloth, 0, -0.02, 0);
  } else {
    mesh(torso, new THREE.CylinderGeometry(shoulderW * 0.48, hipW * 0.5, 0.38, 16), cloth, 0, -0.02, 0);
  }

  mesh(root, new THREE.CylinderGeometry(0.048, 0.055, 0.12, 14), skin, 0, 1.48, 0);

  const head = new THREE.Group();
  head.position.set(0, 1.66, 0);
  root.add(head);
  mesh(head, new THREE.SphereGeometry(0.155, 28, 22), skin, 0, 0.02, 0, 0.9, 1.02, 0.88);
  mesh(head, new THREE.SphereGeometry(0.12, 22, 16), skin, 0, -0.06, 0.02, 0.95, 0.78, 0.9);
  mesh(head, new THREE.SphereGeometry(0.03, 12, 10), skin, 0, -0.02, 0.12, 0.55, 0.85, 0.7);
  mesh(head, new THREE.SphereGeometry(0.028, 12, 10), lip, 0, -0.085, 0.118, 1.2, 0.38, 0.7);

  for (const s of [-1, 1]) {
    mesh(head, new THREE.SphereGeometry(0.028, 14, 12), white, s * 0.048, 0.02, 0.118);
    mesh(head, new THREE.SphereGeometry(0.016, 12, 10), iris, s * 0.048, 0.02, 0.136);
    mesh(head, new THREE.SphereGeometry(0.008, 10, 8), pupil, s * 0.048, 0.018, 0.146);
    mesh(head, new THREE.SphereGeometry(0.004, 8, 8), new THREE.MeshBasicMaterial({ color: "#fffaf4" }), s * 0.054, 0.028, 0.15);
    mesh(head, new THREE.CapsuleGeometry(0.007, 0.034, 4, 8), brow, s * 0.05, 0.055, 0.12, 1, 1, 0.55, 0, 0, s * 0.12);
    mesh(head, new THREE.SphereGeometry(0.035, 10, 8), skin, s * 0.138, -0.01, -0.01, 0.42, 0.72, 0.5);
  }

  if (rig.hair !== 4) {
    const cap = new THREE.SphereGeometry(0.168, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    mesh(head, cap, hairMat, 0, 0.04, -0.01, 1.02, 0.95, 1.05);
    if (rig.hair === 0) {
      mesh(head, new THREE.SphereGeometry(0.09, 14, 10), hairMat, 0, 0.12, -0.02, 1.15, 0.4, 1.05);
    } else if (rig.hair === 1) {
      mesh(head, new THREE.SphereGeometry(0.14, 16, 12), hairMat, 0, -0.12, -0.1, 0.95, 1.25, 0.72);
      mesh(head, new THREE.CapsuleGeometry(0.08, 0.28, 6, 12), hairMat, 0, -0.28, -0.12);
    } else if (rig.hair === 2) {
      mesh(head, new THREE.SphereGeometry(0.075, 14, 12), hairMat, 0, 0.16, -0.03);
    } else {
      mesh(head, new THREE.SphereGeometry(0.145, 16, 12), hairMat, 0, 0.08, 0.01, 1.08, 0.42, 1.08);
    }
  }

  const sleeve = rig.outfit === 3 ? skin : cloth;
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  for (const [arm, s] of [
    [leftArm, -1],
    [rightArm, 1],
  ] as const) {
    arm.position.set(s * (shoulderW * 0.72), 1.38, 0);
    const restZ = s * (0.18 + (1 - g) * 0.08);
    arm.rotation.z = restZ;
    arm.userData.restZ = restZ;
    root.add(arm);
    mesh(arm, new THREE.CapsuleGeometry(0.048, 0.46, 6, 10), sleeve, 0, -0.26, 0);
    mesh(arm, new THREE.SphereGeometry(0.045, 12, 10), skin, 0, -0.54, 0.01, 1, 0.85, 0.72);
  }

  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  for (const [leg, s] of [
    [rightLeg, 1],
    [leftLeg, -1],
  ] as const) {
    leg.position.set(s * hipW * 0.36, 0.92, 0);
    root.add(leg);
    const legMat = rig.outfit === 3 ? skin : rig.outfit === 2 ? cloth : dark;
    mesh(leg, new THREE.CapsuleGeometry(0.082, 0.52, 6, 12), legMat, 0, -0.4, 0);
    mesh(leg, new THREE.SphereGeometry(0.055, 12, 10), dark, 0, -0.84, 0.04, 1.15, 0.45, 1.7);
  }

  root.userData.parts = { torso, head, leftArm, rightArm, leftLeg, rightLeg };
  return root;
}

export function createStudio(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.setClearColor(0x121016, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x121016, 7, 16);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
  camera.position.set(0.7, 1.42, 2.55);
  camera.lookAt(0, 1.22, 0);

  scene.add(new THREE.HemisphereLight(0xd5dbe6, 0x1c1612, 0.7));
  const key = new THREE.DirectionalLight(0xfff6ea, 2.4);
  key.position.set(2.2, 3.2, 2.8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xb7c4d6, 0.62);
  fill.position.set(-2.6, 1.4, 1.8);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xeef2ff, 1.35);
  rim.position.set(-0.4, 2.6, -2.4);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 72),
    new THREE.MeshStandardMaterial({ color: 0x18161c, roughness: 0.9, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 40),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.01;
  scene.add(contact);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 6),
    new THREE.MeshStandardMaterial({ color: 0x1c1a22, roughness: 1, metalness: 0 }),
  );
  wall.position.set(0, 2.4, -2.4);
  scene.add(wall);

  return { renderer, scene, camera };
}

export function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const meshObj = obj as THREE.Mesh;
    if (meshObj.geometry) meshObj.geometry.dispose();
    const material = meshObj.material;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else if (material) material.dispose();
  });
}
