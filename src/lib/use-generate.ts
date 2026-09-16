import { toast } from "sonner";
import { generateImage, pollVideo, startVideo } from "./ai";
import { compressDataUrl } from "./media";
import { saveJob } from "./studio-api";
import { useStudio } from "./store";
import type { AspectRatio, ResultKind } from "./types";
import { sessionId } from "./utils";

function errMsg(e: unknown, fallback = "Generation failed") {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "string") return e;
  return fallback;
}

export async function runImageJob(input: {
  kind: ResultKind;
  title: string;
  prompt: string;
  aspect: AspectRatio;
  sourceDataUrl?: string;
  sourceId?: string;
  n?: number;
}): Promise<string | null> {
  const store = useStudio.getState();
  const pending = store.addPending({
    kind: input.kind,
    title: input.title,
    prompt: input.prompt,
    aspect: input.aspect,
    sourceId: input.sourceId,
  });
  try {
    const res = await generateImage({
      data: {
        prompt: input.prompt,
        aspect: input.aspect,
        n: input.n ?? 1,
        sourceDataUrl: input.sourceDataUrl,
        sessionId: sessionId(),
      },
    });
    if (!res.ok) throw new Error(res.error);
    const first = res.images[0];
    if (!first) throw new Error("No image returned");
    const compact = await compressDataUrl(first.dataUrl, 1200, 0.84);
    await store.putSrc(pending.id, compact);
    store.markReady(pending.id, { remoteUrl: first.remoteUrl });

    for (const extra of res.images.slice(1)) {
      const copy = store.addPending({
        kind: input.kind,
        title: input.title,
        prompt: input.prompt,
        aspect: input.aspect,
        sourceId: input.sourceId,
      });
      const extraCompact = await compressDataUrl(extra.dataUrl, 1200, 0.84);
      await store.putSrc(copy.id, extraCompact);
      store.markReady(copy.id, { remoteUrl: extra.remoteUrl });
    }
    toast.success("Saved to Results");
    return pending.id;
  } catch (e) {
    const message = errMsg(e);
    store.markError(pending.id, message);
    toast.error(message);
    return null;
  }
}

export async function runVideoJob(input: {
  title: string;
  prompt: string;
  aspect: AspectRatio;
  sourceDataUrl: string;
  sourceId?: string;
}): Promise<string | null> {
  const store = useStudio.getState();
  const pending = store.addPending({
    kind: "motion",
    title: input.title,
    prompt: input.prompt,
    aspect: input.aspect,
    sourceId: input.sourceId,
  });
  try {
    const start = await startVideo({
      data: {
        prompt: input.prompt,
        sourceDataUrl: input.sourceDataUrl,
        sessionId: sessionId(),
      },
    });
    if (!start.ok) throw new Error(start.error);
    store.patchItem(pending.id, { jobId: start.requestId });
    void saveJob({
      data: {
        sessionId: sessionId(),
        id: start.requestId,
        generationId: pending.id,
        kind: "video",
        status: "pending",
        requestId: start.requestId,
      },
    }).catch(() => undefined);

    const deadline = Date.now() + 180_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 4000));
      const current = useStudio.getState().itemById(pending.id);
      if (!current || current.status !== "pending") return pending.id;
      const poll = await pollVideo({ data: { requestId: start.requestId } });
      if (!poll.ok) throw new Error(poll.error);
      if (poll.status === "done" && poll.videoUrl) {
        if (input.sourceDataUrl.startsWith("data:")) {
          await store.putSrc(pending.id, input.sourceDataUrl);
        }
        store.markReady(pending.id, { videoUrl: poll.videoUrl, remoteUrl: poll.videoUrl });
        void saveJob({
          data: {
            sessionId: sessionId(),
            id: start.requestId,
            generationId: pending.id,
            kind: "video",
            status: "done",
            requestId: start.requestId,
          },
        }).catch(() => undefined);
        toast.success("Motion saved to Results");
        return pending.id;
      }
      if (poll.status === "failed") throw new Error(poll.error || "Motion did not complete");
    }
    throw new Error("Motion is taking too long. Try a simpler clip.");
  } catch (e) {
    const message = errMsg(e);
    store.markError(pending.id, message);
    toast.error(message);
    return null;
  }
}

export async function resumeVideoJob(itemId: string, requestId: string) {
  const store = useStudio.getState();
  const existing = store.itemById(itemId);
  if (!existing || existing.status !== "pending") return false;
  try {
    const poll = await pollVideo({ data: { requestId } });
    if (!poll.ok) throw new Error(poll.error);
    if (poll.status === "done" && poll.videoUrl) {
      store.markReady(itemId, { videoUrl: poll.videoUrl, remoteUrl: poll.videoUrl });
      void saveJob({
        data: {
          sessionId: sessionId(),
          id: requestId,
          generationId: itemId,
          kind: "video",
          status: "done",
          requestId,
        },
      }).catch(() => undefined);
      toast.success("Motion saved to Results");
      return true;
    }
    if (poll.status === "failed") {
      store.markError(itemId, poll.error || "Motion did not complete");
      return false;
    }
    return false;
  } catch (e) {
    store.markError(itemId, errMsg(e));
    return false;
  }
}

export async function retryItem(id: string) {
  const item = useStudio.getState().itemById(id);
  if (!item) return null;
  if (item.kind === "motion") {
    const src =
      (await useStudio.getState().loadSrc(item.sourceId || item.id)) ||
      useStudio.getState().srcCache[item.id];
    if (!src) {
      toast.error("Original still is missing. Pick a source in Motion.");
      return null;
    }
    return runVideoJob({
      title: item.title,
      prompt: item.prompt,
      aspect: item.aspect,
      sourceDataUrl: src,
      sourceId: item.sourceId,
    });
  }
  let sourceDataUrl: string | undefined;
  if (item.sourceId) sourceDataUrl = await useStudio.getState().loadSrc(item.sourceId);
  return runImageJob({
    kind: item.kind,
    title: item.title,
    prompt: item.prompt,
    aspect: item.aspect,
    sourceDataUrl,
    sourceId: item.sourceId,
  });
}
