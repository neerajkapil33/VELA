"""
router.py - One entry point for prompt / image / video input. Detects which
kind of input it got, calls the matching pipeline's Gradio app running on
your RunPod pod, then feeds the resulting mesh straight into convert.py.

    Hunyuan3D-2 (prompt or single image) --\\
                                             >--> mesh --> convert.py --> formats
    WorldMirror   (video, multi-view)     --/

Set your pod URLs first (RunPod shows these as the pod's proxied HTTP port):
    export HUNYUAN3D_ENDPOINT="https://xxxx-7860.proxy.runpod.net"
    export WORLDMIRROR_ENDPOINT="https://xxxx-7861.proxy.runpod.net"

    python3 router.py --prompt "a woman in a red dress" --to glb obj
    python3 router.py --image photo.jpg --to all
    python3 router.py --video scan.mp4 --to all

BE HONEST WITH YOURSELF ABOUT THIS ONE: the api_name and argument names
below (generation_all, caption, image, video) are best-guess placeholders
based on common Gradio conventions in these repos, not confirmed against
either app's actual interface -- I don't have a running pod to check
against from this sandbox. Open your pod's own API page first:
    https://<your-pod-url>/?view=api
and it will list the real endpoint name and argument names. Update
run_hunyuan3d() / run_worldmirror() below to match what that page says
before this will actually work -- treat this file as the wiring, not a
finished, verified integration.
"""
import argparse
import os
import sys
from pathlib import Path

from gradio_client import Client, handle_file

from convert import convert as convert_formats

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTS = {".mp4", ".mov", ".avi", ".webm"}


def classify(prompt, file_path):
    if file_path:
        ext = Path(file_path).suffix.lower()
        if ext in VIDEO_EXTS:
            return "video"
        if ext in IMAGE_EXTS:
            return "image"
        raise ValueError(f"Unrecognized file type: {ext}")
    if prompt:
        return "text"
    raise ValueError("Provide one of --prompt, --image, or --video")


def run_hunyuan3d(endpoint, prompt=None, image_path=None):
    print(f"Routing to Hunyuan3D-2 at {endpoint} ...")
    client = Client(endpoint)
    kwargs = {}
    if image_path:
        kwargs["image"] = handle_file(image_path)
    if prompt:
        kwargs["caption"] = prompt
    # api_name is a guess -- check /?view=api on your own pod and fix this
    return client.predict(**kwargs, api_name="/generation_all")


def run_worldmirror(endpoint, video_path):
    print(f"Routing to WorldMirror at {endpoint} ...")
    client = Client(endpoint)
    # api_name is a guess -- check /?view=api on your own pod and fix this
    return client.predict(video=handle_file(video_path), api_name="/predict")


def main():
    parser = argparse.ArgumentParser(description="Route a prompt/image/video to the right 3D pipeline.")
    parser.add_argument("--prompt", help="Text description for text-to-3D")
    parser.add_argument("--image", help="Path to a reference image for image-to-3D")
    parser.add_argument("--video", help="Path to a video for video-based reconstruction")
    parser.add_argument("--to", nargs="+", default=["all"], help="Formats to convert the result into")
    args = parser.parse_args()

    file_path = args.image or args.video
    try:
        kind = classify(args.prompt, file_path)
    except ValueError as err:
        print(err, file=sys.stderr)
        sys.exit(1)

    if kind in ("text", "image"):
        endpoint = os.environ.get("HUNYUAN3D_ENDPOINT")
        if not endpoint:
            print("Set HUNYUAN3D_ENDPOINT to your RunPod Gradio URL first.", file=sys.stderr)
            sys.exit(1)
        mesh_path = run_hunyuan3d(endpoint, prompt=args.prompt, image_path=args.image)
    else:
        endpoint = os.environ.get("WORLDMIRROR_ENDPOINT")
        if not endpoint:
            print("Set WORLDMIRROR_ENDPOINT to your RunPod Gradio URL first.", file=sys.stderr)
            sys.exit(1)
        mesh_path = run_worldmirror(endpoint, args.video)

    print(f"Got a result back: {mesh_path}")
    print("Feeding it into convert.py for format conversion...")
    convert_formats(mesh_path, [f.lower() for f in args.to], out_dir=None)


if __name__ == "__main__":
    main()
