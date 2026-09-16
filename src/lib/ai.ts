import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const IMAGE_MODEL = "grok-imagine-image-2.0";
const VIDEO_MODEL = "grok-imagine-video-1.5";

const BLOCKED =
  /\b(child|children|kid|kids|toddler|infant|baby|babies|minor|underage|preteen|tween|loli|shota|teen(?:ager)?s?|schoolgirl|schoolboy)\b/i;

type Bucket = number[];
const imagesBySession = new Map<string, Bucket>();
const videosBySession = new Map<string, Bucket>();
const globalImages: Bucket = [];
const globalVideos: Bucket = [];

const HOUR = 60 * 60 * 1000;

function prune(bucket: Bucket, windowMs = HOUR) {
  const cut = Date.now() - windowMs;
  while (bucket.length && bucket[0]! < cut) bucket.shift();
}

const IMAGE_SESSION_MAX = 48;
const VIDEO_SESSION_MAX = 10;
const IMAGE_GLOBAL_MAX = 160;
const VIDEO_GLOBAL_MAX = 24;

export function quotaFor(session: string) {
  const images = imagesBySession.get(session) ?? [];
  const videos = videosBySession.get(session) ?? [];
  prune(images);
  prune(videos);
  prune(globalImages);
  prune(globalVideos);
  return {
    imagesLeft: Math.max(0, IMAGE_SESSION_MAX - images.length),
    videosLeft: Math.max(0, VIDEO_SESSION_MAX - videos.length),
    imagesMax: IMAGE_SESSION_MAX,
    videosMax: VIDEO_SESSION_MAX,
  };
}

function allow(
  session: string,
  kind: "image" | "video",
): { ok: true } | { ok: false; error: string } {
  const now = Date.now();
  const per = kind === "image" ? imagesBySession : videosBySession;
  const global = kind === "image" ? globalImages : globalVideos;
  const sessionMax = kind === "image" ? IMAGE_SESSION_MAX : VIDEO_SESSION_MAX;
  const globalMax = kind === "image" ? IMAGE_GLOBAL_MAX : VIDEO_GLOBAL_MAX;
  let bucket = per.get(session);
  if (!bucket) {
    bucket = [];
    per.set(session, bucket);
  }
  prune(bucket);
  prune(global);
  if (bucket.length >= sessionMax) {
    return { ok: false, error: "Studio is cooling down. Try again in a few minutes." };
  }
  if (global.length >= globalMax) {
    return { ok: false, error: "Studio is at capacity. Try again shortly." };
  }
  bucket.push(now);
  global.push(now);
  return { ok: true };
}

function guardPrompt(prompt: string): string | null {
  if (BLOCKED.test(prompt)) {
    return "VELA only generates adult subjects.";
  }
  return null;
}

async function xaiJson(path: string, body: unknown): Promise<{ ok: boolean; status: number; json: any }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, status: 0, json: { error: "AI is not available in this environment" } };
  const res = await fetch(`https://api.x.ai/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function xaiGet(path: string): Promise<{ ok: boolean; json: any }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, json: { error: "AI is not available in this environment" } };
  const res = await fetch(`https://api.x.ai/v1${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not retrieve generated image");
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") || "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const GenerateInput = z.object({
  prompt: z.string().min(4).max(2500),
  aspect: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]),
  n: z.number().int().min(1).max(2).optional(),
  sourceDataUrl: z.string().max(2_500_000).optional(),
  sessionId: z.string().min(4).max(80),
});

export const generateImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data }) => {
    const blocked = guardPrompt(data.prompt);
    if (blocked) return { ok: false as const, error: blocked };
    const gate = allow(data.sessionId, "image");
    if (!gate.ok) return { ok: false as const, error: gate.error };

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI is not available in this environment" };

    const prompt = `${data.prompt}\n\nThe subject is an adult, 25 years or older.`;
    const n = data.n ?? 1;

    const body: Record<string, unknown> = {
      model: IMAGE_MODEL,
      prompt,
      n,
      aspect_ratio: data.aspect,
      resolution: "1K",
    };

    const path = data.sourceDataUrl ? "/images/edits" : "/images/generations";
    if (data.sourceDataUrl) {
      body.image = { url: data.sourceDataUrl, type: "image_url" };
    }

    const { ok, status, json } = await xaiJson(path, body);
    if (!ok) {
      const msg =
        json?.error?.message ||
        json?.error ||
        `Generation failed (${status || "offline"})`;
      return { ok: false as const, error: String(msg) };
    }

    const rows: { url?: string; b64_json?: string }[] = json?.data ?? [];
    if (!rows.length && json?.url) rows.push({ url: json.url });
    if (!rows.length) return { ok: false as const, error: "No image returned" };

    const images: { dataUrl: string; remoteUrl?: string }[] = [];
    for (const row of rows.slice(0, n)) {
      if (row.b64_json) {
        images.push({ dataUrl: `data:image/png;base64,${row.b64_json}`, remoteUrl: row.url });
      } else if (row.url) {
        images.push({ dataUrl: await toDataUrl(row.url), remoteUrl: row.url });
      }
    }
    if (!images.length) return { ok: false as const, error: "No image returned" };
    return { ok: true as const, images };
  });

const VideoStartInput = z.object({
  prompt: z.string().min(4).max(1500),
  sourceDataUrl: z.string().min(20).max(2_500_000),
  sessionId: z.string().min(4).max(80),
});

export const startVideo = createServerFn({ method: "POST" })
  .validator((input: unknown) => VideoStartInput.parse(input))
  .handler(async ({ data }) => {
    const blocked = guardPrompt(data.prompt);
    if (blocked) return { ok: false as const, error: blocked };
    const gate = allow(data.sessionId, "video");
    if (!gate.ok) return { ok: false as const, error: gate.error };

    const { ok, status, json } = await xaiJson("/videos/generations", {
      model: VIDEO_MODEL,
      prompt: `${data.prompt} Adult subject, 25 years or older.`,
      image: { url: data.sourceDataUrl },
      duration: 6,
      resolution: "720p",
    });
    if (!ok) {
      const msg = json?.error?.message || json?.error || `Motion failed (${status || "offline"})`;
      return { ok: false as const, error: String(msg) };
    }
    const requestId = json?.request_id || json?.id;
    if (!requestId) return { ok: false as const, error: "Motion job did not start" };
    return { ok: true as const, requestId: String(requestId) };
  });

export const pollVideo = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ requestId: z.string().min(4).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { ok, json } = await xaiGet(`/videos/${encodeURIComponent(data.requestId)}`);
    if (!ok && json?.error) {
      return { ok: false as const, error: String(json.error.message || json.error) };
    }
    const status = String(json?.status || "pending");
    if (status === "done") {
      const videoUrl = json?.video?.url || json?.url;
      if (!videoUrl) return { ok: false as const, error: "Motion finished without a file" };
      return { ok: true as const, status: "done" as const, videoUrl: String(videoUrl) };
    }
    if (status === "failed" || status === "expired") {
      return {
        ok: true as const,
        status: "failed" as const,
        error: json?.error?.message || "Motion did not complete",
      };
    }
    return { ok: true as const, status: "pending" as const };
  });
