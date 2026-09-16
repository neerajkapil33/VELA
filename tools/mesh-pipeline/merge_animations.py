"""
merge_animations.py - Combine multiple Mixamo animation clips (walk, run,
sit, wave, ...) onto one rigged character, so the result carries every
clip as a separate, named action in one exportable file.

This generalizes the exact thing already being done by hand for
avatar.glb + idle_standing.glb -- merging one animation onto one armature
-- to N animations instead of one.

Mixamo workflow this expects:
  1. Download your rigged character ONCE "with skin" -- this is the base.
  2. Download every other animation (walk, run, sit, wave, ...) "without
     skin" -- Mixamo's setting for exactly this retargeting case, so each
     clip file is just the animation on a matching skeleton, no duplicate
     mesh to clean up.

Run inside Blender (not plain python3):
    blender --background --python merge_animations.py -- \\
        character_with_skin.fbx walk.fbx run.fbx sit.fbx wave.fbx \\
        --out character_rigged_animated.glb

Not executed in the sandbox this was written in -- no Blender available
there. Written against Blender 4.x's documented API; say what error you
get if an operator name has moved in your version and I'll adjust it.
"""
import bpy
import os
import sys


def parse_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1 :] if "--" in argv else []
    if "--out" not in argv:
        print("Usage: ... base_with_skin.fbx clip1.fbx clip2.fbx ... --out output.glb")
        sys.exit(1)
    out_index = argv.index("--out")
    inputs = argv[:out_index]
    output = argv[out_index + 1]
    if len(inputs) < 1:
        print("Need at least the base rigged character file")
        sys.exit(1)
    return os.path.abspath(inputs[0]), [os.path.abspath(p) for p in inputs[1:]], os.path.abspath(output)


def import_fbx_tracked(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path)
    return [o for o in bpy.data.objects if o not in before]


base_path, clip_paths, output_path = parse_args()
bpy.ops.wm.read_factory_settings(use_empty=True)

print(f"Importing base character (with skin): {base_path}")
base_objects = import_fbx_tracked(base_path)
armature = next((o for o in base_objects if o.type == "ARMATURE"), None)
if armature is None:
    print("No armature in the base file -- is it actually the rigged export?")
    sys.exit(1)

kept_actions = []
if armature.animation_data and armature.animation_data.action:
    base_action = armature.animation_data.action
    base_action.name = os.path.splitext(os.path.basename(base_path))[0]
    base_action.use_fake_user = True
    kept_actions.append(base_action)

for clip_path in clip_paths:
    print(f"Importing animation clip (without skin): {clip_path}")
    clip_objects = import_fbx_tracked(clip_path)
    clip_armature = next((o for o in clip_objects if o.type == "ARMATURE"), None)
    has_action = clip_armature and clip_armature.animation_data and clip_armature.animation_data.action
    if not has_action:
        print(f"  Warning: no animation found in {clip_path}, skipping")
    else:
        action = clip_armature.animation_data.action
        action.name = os.path.splitext(os.path.basename(clip_path))[0]
        action.use_fake_user = True
        kept_actions.append(action)
    for obj in clip_objects:
        bpy.data.objects.remove(obj, do_unlink=True)

if not armature.animation_data:
    armature.animation_data_create()
track = armature.animation_data.nla_tracks.new()
track.name = "clips"
for action in kept_actions:
    track.strips.new(action.name, int(action.frame_range[0]), action)

bpy.ops.export_scene.gltf(filepath=output_path, export_format="GLB", export_animations=True, export_nla_strips=True)
print(f"Exported {len(kept_actions)} animation(s) into {output_path}:")
for action in kept_actions:
    print(f"  - {action.name}")
