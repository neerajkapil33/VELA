import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EngineNote, Field, FormTabs, GeneratorLayout, PageIntro, SourceStrip } from "@/components/studio/GeneratorLayout";
import { ResultThumb } from "@/components/studio/ResultGrid";
import { ResultViewer } from "@/components/studio/ResultViewer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Chip, Skeleton } from "@/components/ui/misc";
import { CAMERAS, LIBRARY, MOTIONS } from "@/lib/catalog";
import { compressDataUrl } from "@/lib/media";
import { aspectClass } from "@/lib/prompts";
import { useStudio } from "@/lib/store";
import type { ResultItem } from "@/lib/types";
import { runVideoJob } from "@/lib/use-generate";
import { toast } from "sonner";

export const Route = createFileRoute("/motion")({
  component: MotionPage,
});

const TABS = [
  { id: "still", label: "Source" },
  { id: "camera", label: "Camera" },
  { id: "move", label: "Action" },
] as const;

function MotionPage() {
  const results = useStudio((s) => s.results);
  const draft = useStudio((s) => s.draft);
  const loadSrc = useStudio((s) => s.loadSrc);
  const srcCache = useStudio((s) => s.srcCache);
  const navigate = useNavigate();

  const sources = results.filter((r) => r.status === "ready" && r.kind !== "motion");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("still");
  const [sourceId, setSourceId] = useState<string | "lib">(draft?.sourceId ?? sources[0]?.id ?? "lib");
  const [libId, setLibId] = useState(LIBRARY[0]?.id ?? "");
  const [motion, setMotion] = useState<(typeof MOTIONS)[number]["id"]>("walk");
  const [camera, setCamera] = useState<(typeof CAMERAS)[number]["id"]>("orbit");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<ResultItem | null>(null);
  const [latestId, setLatestId] = useState<string | null>(null);

  useEffect(() => {
    if (draft?.sourceId) setSourceId(draft.sourceId);
  }, [draft?.sourceId]);

  useEffect(() => {
    if (sourceId !== "lib") void loadSrc(sourceId);
  }, [sourceId, loadSrc]);

  const libItem = LIBRARY.find((l) => l.id === libId) ?? LIBRARY[0];
  const sourceSrc =
    sourceId === "lib" ? libItem?.src : draft?.sourceSrc || (sourceId !== "lib" ? srcCache[sourceId] : undefined);
  const sourceItem = sources.find((s) => s.id === sourceId);
  const mine = results.filter((r) => r.kind === "motion").slice(0, 6);
  const preset = MOTIONS.find((m) => m.id === motion) ?? MOTIONS[0];
  const cam = CAMERAS.find((c) => c.id === camera) ?? CAMERAS[0];
  const latest = (latestId && results.find((r) => r.id === latestId)) || mine.find((r) => r.status === "ready");
  const rendering = busy || latest?.status === "pending";

  async function onGenerate() {
    if (!sourceSrc) {
      toast.error("Pick a still first");
      setTab("still");
      return;
    }
    setBusy(true);
    let dataUrl = sourceSrc;
    if (!dataUrl.startsWith("data:")) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Could not read still"));
          reader.readAsDataURL(blob);
        });
        dataUrl = await compressDataUrl(dataUrl, 1024, 0.82);
      } catch {
        toast.error("Could not prepare that still");
        setBusy(false);
        return;
      }
    }
    const id = await runVideoJob({
      title: `${preset.label} · ${cam.label}`,
      prompt: `${preset.prompt} ${cam.prompt}`,
      aspect: sourceItem?.aspect ?? "3:4",
      sourceDataUrl: dataUrl,
      sourceId: sourceId === "lib" ? undefined : sourceId,
    });
    setBusy(false);
    if (id) setLatestId(id);
  }

  return (
    <GeneratorLayout
      form={
        <>
          <PageIntro
            kicker="Video lab"
            title="Camera and action"
            copy="Still to clip with a chosen camera move — orbit, dolly, crane — always free, six seconds."
          />
          <FormTabs tabs={[...TABS]} value={tab} onChange={setTab} />
          <div className="space-y-4">
            {tab === "still" ? (
              <div className="space-y-1.5">
                <Label>Still</Label>
                <SourceStrip sourceId={sourceId} onPick={setSourceId} sources={sources} srcCache={srcCache} />
                {sourceId === "lib" ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {LIBRARY.map((item) => (
                      <Chip key={item.id} active={libId === item.id} onClick={() => setLibId(item.id)}>
                        {item.title}
                      </Chip>
                    ))}
                  </div>
                ) : null}
                <Button variant="ghost" className="w-full" onClick={() => void navigate({ to: "/avatar" })}>
                  Film from 3D studio
                </Button>
              </div>
            ) : null}
            {tab === "camera" ? (
              <Field label="Camera">
                {CAMERAS.map((c) => (
                  <Chip key={c.id} active={camera === c.id} onClick={() => setCamera(c.id)}>
                    {c.label}
                  </Chip>
                ))}
              </Field>
            ) : null}
            {tab === "move" ? (
              <Field label="Action">
                {MOTIONS.map((m) => (
                  <Chip key={m.id} active={motion === m.id} onClick={() => setMotion(m.id)}>
                    {m.label}
                  </Chip>
                ))}
              </Field>
            ) : null}
            <Button className="w-full" size="lg" disabled={busy} onClick={() => void onGenerate()}>
              {busy ? "Animating…" : "Generate 6s clip"}
            </Button>
            <EngineNote />
          </div>
        </>
      }
      preview={
        <div className="space-y-6">
          <div className={aspectClass("3:4") + " relative max-h-[70dvh] overflow-hidden rounded-2xl border border-border bg-card"}>
            {rendering ? (
              <div className="absolute inset-0">
                <Skeleton className="absolute inset-0 rounded-none" />
                <p className="relative flex h-full items-end p-6 text-sm text-muted-foreground">Animating still…</p>
              </div>
            ) : latest?.videoUrl ? (
              <video src={latest.videoUrl} className="h-full w-full object-cover" controls autoPlay loop />
            ) : sourceSrc ? (
              <img src={sourceSrc} alt="Still" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-end p-6">
                <p className="text-sm text-muted-foreground">Choose a portrait, a camera, then an action.</p>
              </div>
            )}
          </div>
          {latest?.status === "ready" ? (
            <Button size="sm" variant="outline" onClick={() => void navigate({ to: "/results" })}>
              Open in Results
            </Button>
          ) : null}
          {mine.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {mine.map((item) => (
                <ResultThumb key={item.id} item={item} onOpen={setOpen} />
              ))}
            </div>
          ) : null}
          <ResultViewer item={open} onClose={() => setOpen(null)} />
        </div>
      }
    />
  );
}
