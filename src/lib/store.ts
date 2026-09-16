import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deleteGeneration, saveGeneration } from "./studio-api";
import { idbDel, idbGet, idbSet } from "./idb";
import type { AspectRatio, ResultItem, ResultKind } from "./types";
import { sessionId, uid } from "./utils";

type Draft = {
  prompt: string;
  aspect: AspectRatio;
  sourceId?: string;
  sourceSrc?: string;
  intent?: "create" | "looks" | "motion" | "photo";
};

type Quota = {
  engine: boolean;
  imagesLeft: number;
  videosLeft: number;
  imagesMax: number;
  videosMax: number;
};

type StudioState = {
  results: ResultItem[];
  srcCache: Record<string, string>;
  draft: Draft | null;
  hydrated: boolean;
  synced: boolean;
  quota: Quota | null;
  setHydrated: () => void;
  setDraft: (draft: Draft | null) => void;
  setQuota: (quota: Quota) => void;
  addPending: (input: {
    kind: ResultKind;
    title: string;
    prompt: string;
    aspect: AspectRatio;
    sourceId?: string;
    jobId?: string;
  }) => ResultItem;
  patchItem: (id: string, patch: Partial<ResultItem>) => void;
  markReady: (id: string, patch?: Partial<ResultItem>) => void;
  markError: (id: string, error: string) => void;
  toggleFavorite: (id: string) => void;
  remove: (id: string) => Promise<void>;
  putSrc: (id: string, src: string) => Promise<void>;
  loadSrc: (id: string) => Promise<string | undefined>;
  pullRemote: () => Promise<void>;
  itemById: (id: string) => ResultItem | undefined;
};

const MAX_RESULTS = 48;

function persistItem(item: ResultItem) {
  if (typeof window === "undefined") return;
  void saveGeneration({ data: { sessionId: sessionId(), item } }).catch(() => undefined);
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      results: [],
      srcCache: {},
      draft: null,
      hydrated: false,
      synced: false,
      quota: null,
      setHydrated: () => set({ hydrated: true }),
      setDraft: (draft) => set({ draft }),
      setQuota: (quota) => set({ quota }),
      itemById: (id) => get().results.find((r) => r.id === id),
      addPending: (input) => {
        const item: ResultItem = {
          id: uid("r"),
          kind: input.kind,
          title: input.title,
          prompt: input.prompt,
          aspect: input.aspect,
          createdAt: Date.now(),
          favorite: false,
          status: "pending",
          sourceId: input.sourceId,
          jobId: input.jobId,
        };
        set((s) => {
          const next = [item, ...s.results];
          const extras = next.slice(MAX_RESULTS).filter((r) => !r.favorite);
          const drop = new Set(extras.map((r) => r.id));
          extras.forEach((r) => void idbDel(r.id));
          return { results: next.filter((r) => !drop.has(r.id)).slice(0, MAX_RESULTS) };
        });
        persistItem(item);
        return item;
      },
      patchItem: (id, patch) => {
        set((s) => ({
          results: s.results.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }));
        const item = get().results.find((r) => r.id === id);
        if (item) persistItem(item);
      },
      markReady: (id, patch) => {
        set((s) => ({
          results: s.results.map((r) =>
            r.id === id ? { ...r, status: "ready" as const, error: undefined, ...patch } : r,
          ),
        }));
        const item = get().results.find((r) => r.id === id);
        if (item) persistItem(item);
      },
      markError: (id, error) => {
        set((s) => ({
          results: s.results.map((r) =>
            r.id === id ? { ...r, status: "error" as const, error } : r,
          ),
        }));
        const item = get().results.find((r) => r.id === id);
        if (item) persistItem(item);
      },
      toggleFavorite: (id) => {
        set((s) => ({
          results: s.results.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)),
        }));
        const item = get().results.find((r) => r.id === id);
        if (item) persistItem(item);
      },
      remove: async (id) => {
        await idbDel(id);
        set((s) => {
          const srcCache = { ...s.srcCache };
          delete srcCache[id];
          return { results: s.results.filter((r) => r.id !== id), srcCache };
        });
        if (typeof window !== "undefined") {
          void deleteGeneration({ data: { sessionId: sessionId(), id } }).catch(() => undefined);
        }
      },
      putSrc: async (id, src) => {
        await idbSet(id, src);
        set((s) => ({ srcCache: { ...s.srcCache, [id]: src } }));
      },
      loadSrc: async (id) => {
        const cached = get().srcCache[id];
        if (cached) return cached;
        const stored = await idbGet(id);
        if (stored) {
          set((s) => ({ srcCache: { ...s.srcCache, [id]: stored } }));
          return stored;
        }
        const item = get().results.find((r) => r.id === id);
        const remote = item?.remoteUrl;
        if (!remote) return undefined;
        try {
          const res = await fetch(remote);
          if (!res.ok) return undefined;
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
          await idbSet(id, dataUrl);
          set((s) => ({ srcCache: { ...s.srcCache, [id]: dataUrl } }));
          return dataUrl;
        } catch {
          return remote;
        }
      },
      pullRemote: async () => {
        if (typeof window === "undefined") return;
        try {
          const { listGenerations } = await import("./studio-api");
          const res = await listGenerations({ data: { sessionId: sessionId() } });
          if (!res.ok) return;
          const local = get().results;
          const map = new Map(local.map((r) => [r.id, r]));
          for (const item of res.items) {
            const prev = map.get(item.id);
            if (!prev) map.set(item.id, item);
            else {
              const status =
                prev.status === "pending" && item.status === "pending"
                  ? "pending"
                  : item.status === "ready" || item.status === "error"
                    ? item.status
                    : prev.status;
              map.set(item.id, { ...prev, ...item, status, jobId: item.jobId || prev.jobId });
            }
          }
          for (const item of local) {
            if (!res.items.some((r) => r.id === item.id)) persistItem(item);
          }
          set({
            results: [...map.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_RESULTS),
            synced: true,
          });
        } catch {
          set({ synced: false });
        }
      },
    }),
    {
      name: "vela.results",
      partialize: (s) => ({ results: s.results, draft: s.draft }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
