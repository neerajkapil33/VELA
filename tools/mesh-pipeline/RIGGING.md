# Adding a skeleton (rigging) is a separate problem from format conversion

`convert.py` and `blender_convert.py` change the *file format*. Neither adds
a skeleton. A raw Hunyuan3D-2 mesh has no bones and no skin weights, so
nothing can animate it yet, no matter what format it's saved in.

## The free, reliable path: Mixamo

1. Go to mixamo.com (free Adobe account).
2. Mixamo accepts FBX or OBJ, not GLB. Convert first:
   `python3 convert.py character.glb --to obj`
   (or use `blender_convert.py` to save an FBX directly, if you have Blender).
3. Upload the OBJ/FBX. Mixamo auto-detects a humanoid skeleton — you place a
   handful of markers (chin, wrists, elbows, knees, groin) and it computes
   the bone placement and skin weights for you.
4. Download the result as FBX — rigged, and optionally with an animation
   already applied from Mixamo's free library (walk, idle, wave, etc.).
5. Import that rigged FBX into Blender, or straight into your app's format
   with `blender_convert.py` — from here it behaves like your existing
   `avatar.glb` + `idle_standing.glb` setup: a real skeleton other tools
   (and AI-Hologram's animation pipeline) can drive.

## Why this isn't a script

Auto-rigging is a genuinely hard geometry problem — finding joint locations
inside a mesh with no prior structure, then computing per-vertex bone
weights that deform naturally when a joint rotates. Mixamo's model for this
is proprietary, well-tested, and free to use. It isn't something worth
reimplementing from scratch, for the same reason Hunyuan3D-2 is the right
tool for shape generation instead of training a diffusion model from
scratch: use the specialized tool that already solved this problem.

## Body animation vs. face animation — two different systems

Mixamo's free library covers the body: walk, run, jump, sit, dance, clap,
boxing/martial arts, bends, waves — download each "without skin" once you
have a rigged base character, then run `merge_animations.py` to combine
them all onto one file as separate named clips.

It does **not** cover the face: blinking, eyebrow/mouth expressions, or
lip sync. Mixamo rigs are body skeletons, not blend-shape/morph-target
faces. That's a different system — and it's the one AI-Hologram already
has, for exactly this reason (viseme and expression morph targets on the
GLB avatar). A Mixamo-rigged body and an AI-Hologram-style face rig are
complementary pieces, not the same problem solved twice.
