"""
blender_convert.py - Export a mesh to FBX (or between Blender-native formats)
using Blender's own headless mode. trimesh (convert.py) does not write FBX
reliably; Blender does, and you already have Blender for the avatar work.

This runs INSIDE Blender, not with plain python3:

    blender --background --python blender_convert.py -- character.glb character.fbx

Note: I can't run actual Blender in the sandbox I built this in, so unlike
convert.py (which I tested end to end), this one is written against
Blender 4.x's documented operator names but not executed here. If an
operator name has changed in your Blender version, the error message will
name the missing operator -- older versions use import_scene.obj /
export_scene.obj instead of the wm.obj_* names below.
"""
import bpy
import os
import sys

argv = sys.argv
argv = argv[argv.index("--") + 1 :] if "--" in argv else []

if len(argv) < 2:
    print("Usage: blender --background --python blender_convert.py -- input.glb output.fbx")
    sys.exit(1)

input_path = os.path.abspath(argv[0])
output_path = os.path.abspath(argv[1])

bpy.ops.wm.read_factory_settings(use_empty=True)

in_ext = os.path.splitext(input_path)[1].lower()
if in_ext in (".glb", ".gltf"):
    bpy.ops.import_scene.gltf(filepath=input_path)
elif in_ext == ".obj":
    bpy.ops.wm.obj_import(filepath=input_path)
elif in_ext == ".fbx":
    bpy.ops.import_scene.fbx(filepath=input_path)
else:
    print(f"Unsupported input format: {in_ext}")
    sys.exit(1)

out_ext = os.path.splitext(output_path)[1].lower()
if out_ext == ".fbx":
    bpy.ops.export_scene.fbx(filepath=output_path, use_selection=False)
elif out_ext in (".glb", ".gltf"):
    bpy.ops.export_scene.gltf(filepath=output_path, export_format="GLB" if out_ext == ".glb" else "GLTF_SEPARATE")
elif out_ext == ".obj":
    bpy.ops.wm.obj_export(filepath=output_path)
else:
    print(f"Unsupported output format: {out_ext}")
    sys.exit(1)

print(f"Exported {input_path} -> {output_path}")
