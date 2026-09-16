import type { AspectRatio, ResultKind } from "./types";

export type LibraryItem = {
  id: string;
  src: string;
  title: string;
  kind: ResultKind;
  aspect: AspectRatio;
  prompt: string;
};

export const LIBRARY: LibraryItem[] = [
  {
    id: "lib-window",
    src: "/inspiration/01-window.jpg",
    title: "Window light",
    kind: "human",
    aspect: "3:4",
    prompt:
      "Photoreal cinematic close-up of a 34-year-old Korean woman beside a rain-streaked window at dusk, navy wool coat, quiet confidence, 85mm lens, natural skin texture, adult subject.",
  },
  {
    id: "lib-wool",
    src: "/inspiration/02-wool.jpg",
    title: "Wool editorial",
    kind: "human",
    aspect: "3:4",
    prompt:
      "Photoreal fashion editorial of a 29-year-old Nigerian man in a textured oatmeal wool sweater, charcoal seamless backdrop, warm rim light, medium format, adult subject.",
  },
  {
    id: "lib-gallery",
    src: "/inspiration/03-gallery.jpg",
    title: "Gallery render",
    kind: "avatar3d",
    aspect: "3:4",
    prompt:
      "Hyper-real 3D digital human portrait of a 41-year-old Indian woman, charcoal silk blouse, pearl studs, museum lighting on a gray cyclorama, photoreal skin, adult subject.",
  },
  {
    id: "lib-coast",
    src: "/inspiration/04-coast.jpg",
    title: "Coast still",
    kind: "human",
    aspect: "3:4",
    prompt:
      "Photoreal film still of a 36-year-old Scandinavian man on an overcast coastal path, pale linen shirt, wind in sandy-blond hair, 50mm lens, adult subject.",
  },
  {
    id: "lib-rooftop",
    src: "/inspiration/05-rooftop.jpg",
    title: "Golden hour",
    kind: "human",
    aspect: "3:4",
    prompt:
      "Photoreal golden-hour rooftop portrait of a 27-year-old Mexican woman glancing over her shoulder, gold hoops, dark wavy hair, 85mm lens, adult subject.",
  },
  {
    id: "lib-bust",
    src: "/inspiration/06-bust.jpg",
    title: "Studio bust",
    kind: "avatar3d",
    aspect: "3:4",
    prompt:
      "Hyper-real 3D bust of a 38-year-old Lebanese man in a charcoal turtleneck, museum spotlight, dark studio void, photoreal digital-human skin, adult subject.",
  },
  {
    id: "lib-blazer",
    src: "/inspiration/07-blazer.jpg",
    title: "Leadership",
    kind: "human",
    aspect: "3:4",
    prompt:
      "Photoreal professional studio portrait of a 46-year-old Black American woman in a charcoal tailored blazer, softbox lighting, short sculpted hair, adult subject.",
  },
  {
    id: "lib-silver",
    src: "/inspiration/08-silver.jpg",
    title: "Techwear twin",
    kind: "avatar3d",
    aspect: "3:4",
    prompt:
      "Hyper-real 3D fashion avatar of a 31-year-old Japanese man in a silver technical jacket, white cyclorama, cinematic digital-human face, adult subject.",
  },
];

export const ASPECTS: { id: AspectRatio; label: string }[] = [
  { id: "3:4", label: "3:4" },
  { id: "1:1", label: "1:1" },
  { id: "9:16", label: "9:16" },
  { id: "16:9", label: "16:9" },
  { id: "4:3", label: "4:3" },
];

export const PRESENTATIONS = ["Woman", "Man", "Androgynous"] as const;
export const AGES = ["20s", "30s", "40s", "50s", "60s"] as const;
export const ANCESTRIES = [
  "East Asian",
  "South Asian",
  "West African",
  "East African",
  "Northern European",
  "Southern European",
  "Middle Eastern",
  "Latin American",
  "Indigenous",
  "Mixed heritage",
] as const;
export const STYLES = [
  { id: "photoreal", label: "Photoreal" },
  { id: "cinematic", label: "Cinematic" },
  { id: "digital3d", label: "3D digital human" },
  { id: "editorial", label: "Fashion editorial" },
] as const;
export const SETTINGS = [
  { id: "studio", label: "Seamless studio" },
  { id: "window", label: "Window light" },
  { id: "golden", label: "Golden hour" },
  { id: "night", label: "Night city" },
  { id: "gallery", label: "Museum gallery" },
] as const;

export const PHOTO_LOOKS = [
  { id: "headshot", label: "Studio headshot" },
  { id: "cinematic", label: "Cinematic still" },
  { id: "digital3d", label: "3D digital double" },
  { id: "editorial", label: "Fashion editorial" },
  { id: "linkedin", label: "Professional" },
] as const;

export const WARDROBES = [
  "tailored charcoal suit",
  "oatmeal knit and trousers",
  "black technical wear",
  "ivory silk evening set",
  "sun-washed linen",
  "athletic layering",
] as const;

export const LOOK_SETTINGS = [
  "seamless taupe cyclorama",
  "loft with large windows",
  "rain-glossed city street at night",
  "quiet art gallery",
  "desert dusk with long shadows",
  "sunlit greenhouse",
] as const;

export const MOTIONS = [
  { id: "breath", label: "Breath & presence", prompt: "The adult subject breathes naturally, with a tiny head shift and living eyes, camera locked, cinematic." },
  { id: "turn", label: "Turn to camera", prompt: "The adult subject slowly turns toward camera and offers a small genuine smile, hair and fabric catching the motion, cinematic." },
  { id: "breeze", label: "Soft breeze", prompt: "A light breeze moves hair and clothing while the adult subject holds a calm pose, subtle life in the face, cinematic." },
  { id: "walk", label: "Walk in", prompt: "The adult subject takes two slow steps toward camera with natural gait and confident posture, cinematic." },
  { id: "speak", label: "Speak a line", prompt: "The adult subject looks into camera and speaks a short greeting with natural lip motion and a slight nod, cinematic." },
  { id: "run", label: "Easy jog", prompt: "The adult subject jogs toward camera with relaxed athletic form, cinematic." },
  { id: "wave", label: "Wave", prompt: "The adult subject looks into camera and waves once with a natural hand, cinematic." },
] as const;

export const CAMERAS = [
  { id: "orbit", label: "Orbit 360", prompt: "Camera slowly orbits three-hundred-sixty degrees around the adult subject on a studio cyclorama, cinematic 3D turntable, locked subject." },
  { id: "dolly", label: "Dolly in", prompt: "Camera dollies in slowly toward the adult subject's face, shallow depth of field, cinematic." },
  { id: "crane", label: "Crane up", prompt: "Camera cranes from waist height up to the face while the adult subject holds presence, cinematic." },
  { id: "track", label: "Tracking", prompt: "Camera tracks laterally beside the adult subject, cinematic film move." },
  { id: "low", label: "Low hero", prompt: "Low-angle hero camera looking up at the adult subject, cinematic." },
  { id: "lock", label: "Locked off", prompt: "Camera locked off on a tripod, no camera move, cinematic." },
] as const;
