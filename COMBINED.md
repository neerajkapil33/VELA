# Vela Combined App

This is the merged Vela project (Grok workspace + Claude files).

## Main App
- Full AI Studio for photoreal human generation, looks, motion, photo, and 3D avatar
- Routes: `/`, `/create`, `/looks`, `/motion`, `/photo`, `/avatar`, `/results`
- Tech: TanStack Router + React + Three.js + Zustand + Tailwind

## Added from Claude files

### Assets (kept)
- `public/models/sample_character.glb` – sample 3D character mesh
- `public/audio/sample_consent.wav` – voice consent sample (audio kept as requested)

### Tools
- `tools/mesh-pipeline/` – mesh format conversion (GLB→OBJ/STL/PLY/…), Blender FBX helper, animation merge, voice consent gate, routing notes
- `tools/test/test-xai-image.mjs` – quick xAI image generation test
- `tools/vela-test-studio/` – lightweight standalone test server that mirrors Vela prompts
- `tools/game-viewer-starter/` – simple React Three Fiber character viewer (reference)

## How to run
```bash
npm install
npm run dev
```
App runs on http://0.0.0.0:8080

## Mesh tools usage
```bash
cd tools/mesh-pipeline
pip install trimesh pygltflib
python3 convert.py ../../public/models/sample_character.glb --to obj stl
```
