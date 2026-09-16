# Game Viewer Starter

A minimal React Three Fiber scene that stands in for the "3D viewer" node in
the architecture — an environment and a character rendered together, with
orbit camera controls. Both the environment and the character are currently
placeholders; the code is structured so real assets drop in without
restructuring anything.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## What's real vs. placeholder

- **Character** (`src/scene/Character.jsx`) — `Character` already does real
  GLB loading + animation playback via `useGLTF`/`useAnimations` from drei.
  Host your AI Hologram `avatar.glb` somewhere this app can fetch it (e.g.
  drop it in `public/models/avatar.glb` for local testing), then set
  `AVATAR_URL` in `src/App.jsx` to that path. The idle animation baked into
  the GLB will autoplay. `PlaceholderCharacter` (the purple capsule figure)
  is only shown when `AVATAR_URL` is `null`.
- **Environment** (`src/scene/Environment.jsx`) — currently a flat grid with
  a few placeholder blocks. Once you have a reconstructed or generated scene
  exported as a mesh, load it the same way `Character.jsx` loads the avatar
  (`useGLTF` if you convert the output to `.glb`, or a plain
  `PLYLoader`/`OBJLoader` if you keep it as `.ply`/`.obj`).

## Getting a real environment (on your own GPU machine — not runnable here)

This step needs an NVIDIA GPU with CUDA 12.8 and can't run in this sandbox.
On your own machine:

```bash
git clone https://github.com/Tencent-Hunyuan/HY-World-2.0
cd HY-World-2.0
conda create -n hyworld2 python=3.11.15 -y
conda activate hyworld2
pip install -r requirements.txt
pip install flash-attn --no-build-isolation
python -m hyworld2.worldrecon.gradio_app
```

That launches a local Gradio demo — upload a handful of photos or a short
video of a real space, and WorldMirror 2.0 reconstructs it as depth maps,
camera poses, a point cloud, and Gaussian splats (`.ply`). Convert or
re-render that into a mesh/`.glb` to load it here the same way the character
loads. This is the reconstruction path (WorldMirror alone, single GPU) — the
full generate-from-scratch pipeline (panorama → trajectory → 3DGS training)
is a bigger lift and worth coming back to once this path is proven out.

## Notes

- Licensing: HY-World 2.0 ships under Tencent's Community License — it
  explicitly excludes the EU, UK, and South Korea, and requires a separate
  license past 1M monthly active users. Worth a real legal check before this
  goes into a shipped product.
- Not yet in this starter: character movement (WASD / gamepad), collision
  with the environment mesh, and a first-person camera mode — all reasonable
  next additions once real assets are in place.
