import http from "node:http";
import fs from "node:fs/promises";

const PORT = process.env.PORT || 5175;
const apiKey = process.env.XAI_API_KEY;

const ADULT_LOCK =
  "The subject is a real adult human, 25 years or older. Natural skin texture, individual pores, peach fuzz, accurate anatomy, catchlights in the eyes.";

const STYLE_MAP = {
  photoreal: "Photorealistic portrait photograph, 85mm lens, shallow depth of field, studio-quality lighting.",
  cinematic: "Cinematic film still, naturalistic motivated light, 50mm lens, subtle grain, editorial color.",
  digital3d: "Hyper-real 3D digital human cinematic render, photoreal skin shading, individual hair strands, not a cartoon, not stylized anime.",
  editorial: "High-fashion editorial photograph, precise styling, medium format look, considered pose.",
  headshot: "Clean professional studio headshot, beauty dish with soft fill, gray seamless, 85mm.",
  linkedin: "Approachable professional portrait, even lighting, simple backdrop, wardrobe appropriate for work.",
};

const SETTING_MAP = {
  studio: "Photographed on a seamless studio cyclorama.",
  window: "Lit by a large window with gentle falloff.",
  golden: "Golden hour outdoor light, long warm highlights.",
  night: "Night city bokeh, practical lights in the distance.",
  gallery: "Museum gallery lighting, quiet architecture behind the subject.",
};

// Mirrors Vela's src/lib/prompts.ts buildHumanPrompt exactly, so this test
// bench sends the same shape of prompt the real "Create Human" flow does.
function buildHumanPrompt({ presentation, age, ancestry, style, setting, details }) {
  const who = `${age.replace("s", "")}-something ${ancestry} ${presentation.toLowerCase()}`;
  const styleText = STYLE_MAP[style] ?? STYLE_MAP.photoreal;
  const settingText = SETTING_MAP[setting] ?? SETTING_MAP.studio;
  const extra = (details || "").trim();
  return [
    `Portrait of an adult ${who}.`,
    extra ? extra.replace(/\.$/, "") + "." : "Calm, specific presence, unforced expression.",
    styleText,
    settingText,
    ADULT_LOCK,
    "No text, no watermark, no extra people.",
  ].join(" ");
}

async function callXai(fullPrompt, aspectRatio) {
  const xaiRes = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image-2.0",
      prompt: fullPrompt,
      n: 1,
      aspect_ratio: aspectRatio || "1:1",
      resolution: "1K",
    }),
  });

  const json = await xaiRes.json().catch(() => ({}));

  if (!xaiRes.ok) {
    const msg = json?.error?.message || json?.error || `xAI request failed (${xaiRes.status})`;
    const err = new Error(msg);
    err.status = xaiRes.status;
    throw err;
  }

  const row = json?.data?.[0];
  if (row?.b64_json) {
    return `data:image/png;base64,${row.b64_json}`;
  }
  if (row?.url) {
    const imgRes = await fetch(row.url);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    return `data:image/png;base64,${buf.toString("base64")}`;
  }
  throw new Error("xAI response had no image in it");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    try {
      const html = await fs.readFile(new URL("./public/index.html", import.meta.url));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Could not load public/index.html");
    }
    return;
  }

  if (req.method === "POST" && req.url === "/api/generate") {
    try {
      const body = await readBody(req);
      const { presentation, age, ancestry, style, setting, details, aspectRatio } = JSON.parse(body || "{}");

      if (!presentation || !age || !ancestry) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Missing presentation, age, or ancestry" }));
        return;
      }
      if (!apiKey) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "XAI_API_KEY is not set on the server" }));
        return;
      }

      const fullPrompt = buildHumanPrompt({ presentation, age, ancestry, style, setting, details });
      const image = await callXai(fullPrompt, aspectRatio);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, image, promptUsed: fullPrompt }));
    } catch (err) {
      res.writeHead(err.status || 500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(err?.message || err) }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Quick Studio running at http://localhost:${PORT}`);
  if (!apiKey) {
    console.log("Warning: XAI_API_KEY is not set — generation requests will fail until it is.");
  }
});
