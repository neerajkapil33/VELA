export type AvatarRig = {
  skin: number;
  gender: number;
  hair: number;
  hairColor: number;
  outfit: number;
  outfitColor: number;
  eye: number;
};

export const DEFAULT_RIG: AvatarRig = {
  skin: 2,
  gender: 0.45,
  hair: 1,
  hairColor: 1,
  outfit: 0,
  outfitColor: 2,
  eye: 0,
};

export const SKIN = ["#f3dcc4", "#e8c39a", "#d4a06e", "#b07a45", "#8a5528", "#5a3518"];
export const HAIR = ["#1a1410", "#3b2414", "#6b3a1f", "#c4a574", "#d8d4ce", "#5c1c28"];
export const EYES = ["#3b2a1a", "#5b3a1e", "#2f4a38", "#2a3c5a", "#1c1c1c"];
export const CLOTH = ["#ebe6dc", "#1c1a21", "#4a5560", "#6b3a2a", "#2c3a4a", "#8a7a62"];
export const HAIR_STYLES = ["Short", "Long", "Bun", "Pixie", "Bald"] as const;
export const OUTFITS = ["Tee", "Suit", "Knit", "Tank"] as const;

export type CastMember = {
  id: string;
  name: string;
  tag: string;
  src: string;
  rig: AvatarRig;
};

export const CAST: CastMember[] = [
  { id: "nara", name: "Nara", tag: "Editorial", src: "/inspiration/01-window.jpg", rig: { skin: 2, gender: 0.18, hair: 1, hairColor: 1, outfit: 2, outfitColor: 0, eye: 0 } },
  { id: "kofi", name: "Kofi", tag: "Knitwear", src: "/inspiration/02-wool.jpg", rig: { skin: 4, gender: 0.82, hair: 0, hairColor: 0, outfit: 2, outfitColor: 0, eye: 1 } },
  { id: "mira", name: "Mira", tag: "Gallery", src: "/inspiration/03-gallery.jpg", rig: { skin: 3, gender: 0.22, hair: 2, hairColor: 1, outfit: 2, outfitColor: 1, eye: 0 } },
  { id: "soren", name: "Soren", tag: "Coast", src: "/inspiration/04-coast.jpg", rig: { skin: 1, gender: 0.78, hair: 0, hairColor: 3, outfit: 0, outfitColor: 0, eye: 3 } },
  { id: "luz", name: "Luz", tag: "Golden hour", src: "/inspiration/05-rooftop.jpg", rig: { skin: 3, gender: 0.2, hair: 1, hairColor: 1, outfit: 3, outfitColor: 4, eye: 0 } },
  { id: "rami", name: "Rami", tag: "Studio bust", src: "/inspiration/06-bust.jpg", rig: { skin: 3, gender: 0.8, hair: 0, hairColor: 1, outfit: 2, outfitColor: 1, eye: 0 } },
  { id: "amina", name: "Amina", tag: "Tailoring", src: "/inspiration/07-blazer.jpg", rig: { skin: 5, gender: 0.24, hair: 3, hairColor: 0, outfit: 1, outfitColor: 1, eye: 0 } },
  { id: "kenji", name: "Kenji", tag: "Techwear", src: "/inspiration/08-silver.jpg", rig: { skin: 2, gender: 0.8, hair: 0, hairColor: 0, outfit: 0, outfitColor: 2, eye: 0 } },
];

export function describeRig(rig: AvatarRig): string {
  const skinNames = ["fair", "light", "medium", "tan", "deep", "rich deep"];
  const hairNames = ["black", "dark brown", "auburn", "blonde", "silver", "burgundy"];
  const eyeNames = ["dark brown", "hazel", "green", "blue-gray", "near-black"];
  const present = rig.gender < 0.35 ? "woman" : rig.gender > 0.65 ? "man" : "androgynous adult";
  return `Adult ${present}, ${skinNames[rig.skin] ?? "medium"} skin, ${HAIR_STYLES[rig.hair] ?? "short"} ${hairNames[rig.hairColor] ?? "brown"} hair, ${eyeNames[rig.eye] ?? "brown"} eyes, wearing a ${OUTFITS[rig.outfit]?.toLowerCase() ?? "tee"} in a studio.`;
}
