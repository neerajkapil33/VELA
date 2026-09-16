import type { AspectRatio } from "./types";

const ADULT_LOCK =
  "The subject is a real adult human, 25 years or older. Natural skin texture, individual pores, peach fuzz, accurate anatomy, catchlights in the eyes.";

const STYLE_MAP: Record<string, string> = {
  photoreal:
    "Photorealistic portrait photograph, 85mm lens, shallow depth of field, studio-quality lighting.",
  cinematic:
    "Cinematic film still, naturalistic motivated light, 50mm lens, subtle grain, editorial color.",
  digital3d:
    "Hyper-real 3D digital human cinematic render, photoreal skin shading, individual hair strands, not a cartoon, not stylized anime.",
  editorial:
    "High-fashion editorial photograph, precise styling, medium format look, considered pose.",
  headshot:
    "Clean professional studio headshot, beauty dish with soft fill, gray seamless, 85mm.",
  linkedin:
    "Approachable professional portrait, even lighting, simple backdrop, wardrobe appropriate for work.",
};

const SETTING_MAP: Record<string, string> = {
  studio: "Photographed on a seamless studio cyclorama.",
  window: "Lit by a large window with gentle falloff.",
  golden: "Golden hour outdoor light, long warm highlights.",
  night: "Night city bokeh, practical lights in the distance.",
  gallery: "Museum gallery lighting, quiet architecture behind the subject.",
};

export function buildHumanPrompt(input: {
  presentation: string;
  age: string;
  ancestry: string;
  style: string;
  setting: string;
  details: string;
}): string {
  const who = `${input.age.replace("s", "")}-something ${input.ancestry} ${input.presentation.toLowerCase()}`;
  const style = STYLE_MAP[input.style] ?? STYLE_MAP.photoreal;
  const setting = SETTING_MAP[input.setting] ?? SETTING_MAP.studio;
  const extra = input.details.trim();
  return [
    `Portrait of an adult ${who}.`,
    extra ? extra.replace(/\.$/, "") + "." : "Calm, specific presence, unforced expression.",
    style,
    setting,
    ADULT_LOCK,
    "No text, no watermark, no extra people.",
  ].join(" ");
}

export function buildPhotoPrompt(look: string, notes: string): string {
  const style = STYLE_MAP[look] ?? STYLE_MAP.headshot;
  const extra = notes.trim();
  return [
    "Create a new photorealistic portrait of the same adult person in the reference photo.",
    "Preserve exact facial identity, bone structure, eye color, skin tone, age, and hairline.",
    style,
    extra || "Keep wardrobe plausible and flattering.",
    ADULT_LOCK,
    "No text, no watermark, no identity change, no extra people.",
  ].join(" ");
}

export function buildLookPrompt(wardrobe: string, setting: string, notes: string): string {
  const extra = notes.trim();
  return [
    "Restyle this adult person as a new photograph. Keep the same face and identity exactly.",
    `Wardrobe: ${wardrobe}.`,
    `Setting: ${setting}.`,
    extra || "Natural pose, considered composition.",
    ADULT_LOCK,
    "No text, no watermark, no extra people.",
  ].join(" ");
}

export function buildTwinPrompt(traits: string): string {
  return [
    "Hyper-real 3D digital human cinematic portrait matching this character:",
    traits,
    "Photoreal skin, individual hair strands, studio cyclorama, adult subject.",
    ADULT_LOCK,
    "No text, no watermark.",
  ].join(" ");
}

export function aspectClass(aspect: AspectRatio): string {
  switch (aspect) {
    case "1:1":
      return "aspect-square";
    case "16:9":
      return "aspect-video";
    case "9:16":
      return "aspect-[9/16]";
    case "4:3":
      return "aspect-[4/3]";
    default:
      return "aspect-[3/4]";
  }
}
