#!/usr/bin/env python3
"""
convert.py - Convert a 3D mesh (e.g. Hunyuan3D-2 output) between common formats.

This handles GEOMETRY + TEXTURE conversion only. It does NOT add a skeleton/rig --
see rig-it-with-mixamo.md for that step, which is a genuinely separate problem.

Usage:
    python3 convert.py character.glb --to obj stl ply dae 3mf
    python3 convert.py character.glb --to all
"""
import argparse
import sys
from pathlib import Path

import trimesh

SUPPORTED = ["glb", "gltf", "obj", "stl", "ply", "3mf"]


def load_mesh(path: Path):
    print(f"Loading {path} ...")
    mesh = trimesh.load(path, force="mesh" if path.suffix.lower() in (".stl", ".ply") else "scene")
    if isinstance(mesh, trimesh.Scene):
        geometries = list(mesh.geometry.values())
        if not geometries:
            raise ValueError("No geometry found in the input file")
        print(f"  {len(geometries)} sub-mesh(es), {sum(g.vertices.shape[0] for g in geometries)} vertices total")
    else:
        print(f"  {mesh.vertices.shape[0]} vertices, {mesh.faces.shape[0]} faces")
    return mesh


def convert(input_path: str, formats: list[str], out_dir: str | None):
    src = Path(input_path)
    if not src.exists():
        print(f"Error: {src} does not exist", file=sys.stderr)
        sys.exit(1)

    mesh = load_mesh(src)
    out_dir_path = Path(out_dir) if out_dir else src.parent
    out_dir_path.mkdir(parents=True, exist_ok=True)

    if "all" in formats:
        formats = [f for f in SUPPORTED if f != src.suffix.lstrip(".").lower()]

    results = []
    for fmt in formats:
        if fmt not in SUPPORTED:
            print(f"Skipping unsupported format: {fmt} (supported: {', '.join(SUPPORTED)})")
            continue
        out_path = out_dir_path / f"{src.stem}.{fmt}"
        try:
            mesh.export(out_path)
            size_kb = out_path.stat().st_size / 1024
            print(f"  -> {out_path.name} ({size_kb:.1f} KB)")
            results.append((fmt, out_path, True))
        except Exception as err:
            print(f"  -> {fmt} failed: {err}")
            results.append((fmt, None, False))

    ok = sum(1 for _, _, success in results if success)
    print(f"\n{ok}/{len(results)} conversions succeeded.")
    if any(f == "fbx" for f in formats):
        print("Note: FBX isn't in this script on purpose -- see blender_convert.py for that one.")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert a 3D mesh between common formats.")
    parser.add_argument("input", help="Path to the source mesh (glb, obj, ply, stl, ...)")
    parser.add_argument(
        "--to",
        nargs="+",
        default=["all"],
        help=f"Target format(s): {', '.join(SUPPORTED)}, or 'all'",
    )
    parser.add_argument("--out-dir", default=None, help="Output directory (default: next to input file)")
    args = parser.parse_args()
    convert(args.input, [f.lower() for f in args.to], args.out_dir)
