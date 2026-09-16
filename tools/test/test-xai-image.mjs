import fs from "node:fs/promises";

const apiKey = process.env.XAI_API_KEY;

if (!apiKey) {
  console.error("XAI_API_KEY is not set.");
  console.error("PowerShell:  $env:XAI_API_KEY=\"your_key_here\"");
  console.error("cmd.exe:     set XAI_API_KEY=your_key_here");
  process.exit(1);
}

const prompt =
  "A professional studio portrait of an adult woman, 25 years or older, " +
  "short black hair, neutral gray background, soft studio lighting.";

console.log("Calling https://api.x.ai/v1/images/generations ...");

let res;
try {
  res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image-2.0",
      prompt,
      n: 1,
      aspect_ratio: "1:1",
      resolution: "1K",
    }),
  });
} catch (err) {
  console.error("Network-level failure before a response came back:");
  console.error(err);
  process.exit(1);
}

const json = await res.json().catch(() => ({}));
console.log("HTTP status:", res.status);

if (!res.ok) {
  const msg = json?.error?.message || json?.error || `Request failed (${res.status})`;
  console.error("xAI returned an error:", msg);
  console.error("Full response:", JSON.stringify(json, null, 2));
  process.exit(1);
}

const row = json?.data?.[0];
if (!row) {
  console.error("Response was OK but had no image in it:");
  console.error(JSON.stringify(json, null, 2));
  process.exit(1);
}

if (row.b64_json) {
  await fs.writeFile("test-output.png", Buffer.from(row.b64_json, "base64"));
  console.log("Success. Saved image to ./test-output.png");
} else if (row.url) {
  console.log("Success. Remote image URL:", row.url);
  const imgRes = await fetch(row.url);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  await fs.writeFile("test-output.png", buf);
  console.log("Also downloaded a local copy to ./test-output.png");
} else {
  console.log("Unexpected response shape:", JSON.stringify(json, null, 2));
}
