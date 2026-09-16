# Mesh format-conversion pipeline

Takes a 3D character (e.g. Hunyuan3D-2's GLB output) and converts it into
the other formats different tools expect. This solves *format* conversion —
rigging (adding an animatable skeleton) is a separate step, covered
honestly in RIGGING.md rather than faked here.

## What's tested and working: `convert.py`

Uses `trimesh`, and was run end-to-end against a sample mesh before this
was written up — not just written and assumed to work.

```bash
pip install trimesh pygltflib --break-system-packages
python3 convert.py character.glb --to obj stl ply gltf 3mf
python3 convert.py character.glb --to all
```

Verified: GLB in, OBJ/STL/PLY/GLTF/3MF out, vertex count identical after a
round trip (196 vertices in, 196 vertices out on the sample mesh included
here — `sample_character.glb`, a placeholder stand-in since I don't have a
real Hunyuan3D-2 output to test against in this sandbox).

## What needs actual Blender: `blender_convert.py`

FBX specifically — trimesh doesn't export it reliably, Blender does. This
one is written against Blender 4.x's documented API but **not executed
here** (no Blender in this sandbox) — say so if the operator names don't
match your version and I'll adjust.

```bash
blender --background --python blender_convert.py -- character.glb character.fbx
```

## What's a genuinely different problem: rigging

See `RIGGING.md`. Short version: neither script here adds a skeleton —
that's Mixamo's job, for free, and it's the right tool for it.

## Files

- `convert.py` — tested mesh format converter (GLB/GLTF/OBJ/STL/PLY/3MF)
- `blender_convert.py` — FBX export via Blender, untested here, standard API
- `merge_animations.py` — combines Mixamo animation clips onto one rigged
  character (walk, run, sit, dance, ...), untested here, standard API
- `router.py` — one entry point for prompt/image/video, dispatches to
  Hunyuan3D-2 or WorldMirror, then auto-converts the result. Routing logic
  is tested; the actual Gradio API calls are wiring, not verified against
  a real pod — see the warning at the top of the file
- `voice_consent.py` — tested consent gate for voice cloning: no recorded
  consent, no clone, whoever's voice it is
- `RIGGING.md` — the honest rigging path (Mixamo), plus body vs. face
  animation scope
- `sample_character.glb` — placeholder test mesh, swap for a real one
