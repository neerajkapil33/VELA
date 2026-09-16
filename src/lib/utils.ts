import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "vela"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "vela.session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = uid("ses");
    localStorage.setItem(key, id);
  }
  return id;
}

export async function downloadDataUrl(dataUrl: string, filename: string) {
  let href = dataUrl;
  let revoke: string | null = null;
  if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    href = URL.createObjectURL(blob);
    revoke = href;
  }
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) URL.revokeObjectURL(revoke);
}

export function kindLabel(kind: string) {
  switch (kind) {
    case "human":
      return "Human";
    case "photo":
      return "Photo";
    case "look":
      return "Look";
    case "avatar3d":
      return "3D";
    case "motion":
      return "Motion";
    default:
      return kind;
  }
}
