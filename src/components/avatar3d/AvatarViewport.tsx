import { useEffect, useRef } from "react";
import * as THREE from "three";
import { applyClip, type ClipId } from "./animate";
import { buildFigure, createStudio, disposeObject } from "./scene";
import type { AvatarRig } from "./rig";

type Api = { snapshot: () => string };

type Props = {
  rig: AvatarRig;
  autoRotate?: boolean;
  clip?: ClipId;
  inPlace?: boolean;
  onReady?: (api: Api) => void;
};

export function AvatarViewport({ rig, autoRotate = false, clip = "idle", inPlace = true, onReady }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const figureRef = useRef<THREE.Group | null>(null);
  const rotateRef = useRef(autoRotate);
  const clipRef = useRef(clip);
  const inPlaceRef = useRef(inPlace);
  const draggingRef = useRef(false);
  const readyRef = useRef(onReady);
  rotateRef.current = autoRotate;
  clipRef.current = clip;
  inPlaceRef.current = inPlace;
  readyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const { renderer, scene, camera } = createStudio(canvas);
    sceneRef.current = scene;
    const figure = buildFigure(rig);
    figureRef.current = figure;
    scene.add(figure);

    const spherical = new THREE.Spherical(2.7, 1.22, 0.26);
    const target = new THREE.Vector3(0, 1.22, 0);
    let lastX = 0;
    let lastY = 0;
    let raf = 0;
    let last = performance.now();
    let t = 0;

    const applyCam = () => {
      camera.position.setFromSpherical(spherical).add(target);
      camera.lookAt(target);
    };

    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const onDown = (e: PointerEvent) => {
      draggingRef.current = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      spherical.theta -= (e.clientX - lastX) * 0.008;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + (e.clientY - lastY) * 0.006, 0.85, 1.45);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      draggingRef.current = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = THREE.MathUtils.clamp(spherical.radius + e.deltaY * 0.002, 1.9, 4.4);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    readyRef.current?.({ snapshot: () => renderer.domElement.toDataURL("image/jpeg", 0.92) });

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const current = figureRef.current;
      if (current) {
        applyClip(current, clipRef.current, t, inPlaceRef.current);
        if (rotateRef.current && !draggingRef.current && clipRef.current === "idle") {
          current.rotation.y = Math.sin(t * 0.32) * 0.35;
        }
      }
      applyCam();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      if (figureRef.current) {
        disposeObject(figureRef.current);
        scene.remove(figureRef.current);
        figureRef.current = null;
      }
      sceneRef.current = null;
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (figureRef.current) {
      disposeObject(figureRef.current);
      scene.remove(figureRef.current);
    }
    const next = buildFigure(rig);
    figureRef.current = next;
    scene.add(next);
  }, [rig]);

  return (
    <div ref={wrapRef} className="relative h-full min-h-[380px] w-full overflow-hidden rounded-xl bg-card">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}
