"""
voice_consent.py - Gate voice cloning behind an explicit, recorded consent
step. This does NOT do any cloning itself -- that's whatever TTS/voice API
ends up used (AI-Hologram already has one). This is the check in front of
it: no recorded consent, no clone. Cloning someone's voice without their
consent is where real harm happens with this technology; this script
exists so that step can't be skipped by accident.

Usage:
    python3 voice_consent.py check consent_recording.wav --name "Jane Doe"

Approves only if the file looks like a real spoken recording (long enough,
plausible size for its format) and writes a timestamped, hashed record to
consent_records.jsonl as an audit trail. Cloning your OWN voice still goes
through this on purpose -- consistency matters more than convenience here.
"""
import argparse
import hashlib
import json
import sys
import wave
from datetime import datetime, timezone
from pathlib import Path

CONSENT_LOG = Path("consent_records.jsonl")


def looks_like_audio(path: Path) -> tuple[bool, str]:
    try:
        with wave.open(str(path), "rb") as f:
            duration = f.getnframes() / f.getframerate()
            return duration >= 3.0, f"{duration:.1f}s WAV"
    except wave.Error:
        # Not a WAV file. Accept common compressed formats by extension and
        # a minimum size, since properly decoding them needs a real audio
        # library (pydub/ffmpeg) this script doesn't assume is installed.
        if path.suffix.lower() in (".mp3", ".m4a", ".webm", ".ogg"):
            return path.stat().st_size > 20_000, f"{path.suffix} file, size-based check only"
        return False, "unrecognized audio format"


def record_consent(name: str, audio_path: Path, note: str) -> dict:
    entry = {
        "name": name,
        "audio_file": audio_path.name,
        "audio_sha256": hashlib.sha256(audio_path.read_bytes()).hexdigest(),
        "check_note": note,
        "consented_at": datetime.now(timezone.utc).isoformat(),
    }
    with CONSENT_LOG.open("a") as f:
        f.write(json.dumps(entry) + "\n")
    return entry


def main():
    parser = argparse.ArgumentParser(description="Gate voice cloning behind a recorded consent check.")
    parser.add_argument("command", choices=["check"])
    parser.add_argument("audio_path", help="Path to the spoken-consent recording")
    parser.add_argument("--name", required=True, help="Name of the person giving consent")
    args = parser.parse_args()

    audio_path = Path(args.audio_path)
    if not audio_path.exists():
        print(f"No such file: {audio_path}", file=sys.stderr)
        sys.exit(1)

    ok, note = looks_like_audio(audio_path)
    if not ok:
        print(f"REJECTED: {note} -- doesn't look like a real spoken-consent recording.")
        print("Have the person say and record something like:")
        print(f'  "I, {args.name}, agree to let my voice be used to create an AI voice clone."')
        sys.exit(1)

    entry = record_consent(args.name, audio_path, note)
    print(f"APPROVED ({note}). Consent recorded for {args.name} at {entry['consented_at']}.")
    print(f"Record hash: {entry['audio_sha256'][:16]}...")
    print("Only now should this audio go to whatever voice-cloning API is in use.")


if __name__ == "__main__":
    main()
