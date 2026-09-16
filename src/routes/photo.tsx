import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { EngineNote, Field, FormTabs, GeneratorLayout, PageIntro } from "@/components/studio/GeneratorLayout";
import { ResultThumb } from "@/components/studio/ResultGrid";
import { ResultViewer } from "@/components/studio/ResultViewer";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Chip, Skeleton } from "@/components/ui/misc";
import { ASPECTS, PHOTO_LOOKS } from "@/lib/catalog";
import { prepareUpload } from "@/lib/media";
import { aspectClass, buildPhotoPrompt } from "@/lib/prompts";
import { useStudio } from "@/lib/store";
import type { AspectRatio, ResultItem } from "@/lib/types";
import { runImageJob } from "@/lib/use-generate";
import { toast } from "sonner";

export const Route = createFileRoute("/photo")({
  component: PhotoPage,
});

const TABS = [
  { id: "portrait", label: "Portrait" },
  { id: "treatment", label: "Treatment" },
] as const;

function PhotoPage() {
  const results = useStudio((s) => s.results);
  const srcCache = useStudio((s) => s.srcCache);
  const draft = useStudio((s) => s.draft);
  const setDraft = useStudio((s) => s.setDraft);
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("portrait");
  const [fileSrc, setFileSrc] = useState<string | null>(draft?.sourceSrc ?? null);
  const [look, setLook] = useState<(typeof PHOTO_LOOKS)[number]["id"]>("headshot");
  const [aspect, setAspect] = useState<AspectRatio>(draft?.aspect ?? "3:4");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<ResultItem | null>(null);
  const [latestId, setLatestId] = useState<string | null>(null);

  const mine = results.filter((r) => r.kind === "photo").slice(0, 8);
  const latest = (latestId && results.find((r) => r.id === latestId)) || mine.find((r) => r.status === "ready");
  const preview = latest ? srcCache[latest.id] || latest.remoteUrl : fileSrc;
  const rendering = busy || latest?.status === "pending";

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const src = await prepareUpload(file);
      setFileSrc(src);
      setTab("treatment");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that photo");
    }
  }

  async function onGenerate() {
    if (!fileSrc) {
      toast.error("Upload a front-facing adult portrait first");
      setTab("portrait");
      return;
    }
    setBusy(true);
    const id = await runImageJob({
      kind: "photo",
      title: PHOTO_LOOKS.find((l) => l.id === look)?.label ?? "Photo avatar",
      prompt: buildPhotoPrompt(look, notes),
      aspect,
      sourceDataUrl: fileSrc,
    });
    setBusy(false);
    if (id) setLatestId(id);
  }

  return (
    <GeneratorLayout
      form={
        <>
          <PageIntro
            kicker="Photo avatar"
            title="From one portrait"
            copy="A single forward-facing adult photo becomes a reusable digital double. Keep both ears visible when you can."
          />
          <FormTabs tabs={[...TABS]} value={tab} onChange={setTab} />
          <div className="space-y-4">
            {tab === "portrait" ? (
              <>
                <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/50 px-4 py-8 text-center">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => void onFile(e.target.files?.[0])}
                  />
                  {fileSrc ? (
                    <img src={fileSrc} alt="Upload" className="mb-3 h-28 w-28 rounded-lg object-cover" />
                  ) : null}
                  <p className="text-sm font-medium">{fileSrc ? "Replace photo" : "Upload portrait"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WebP · one adult face · up to 20 MB</p>
                </label>
                {fileSrc ? (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setFileSrc(null);
                      setDraft(null);
                    }}
                  >
                    Clear photo
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <Field label="Treatment">
                  {PHOTO_LOOKS.map((p) => (
                    <Chip key={p.id} active={look === p.id} onClick={() => setLook(p.id)}>
                      {p.label}
                    </Chip>
                  ))}
                </Field>
                <Field label="Frame">
                  {ASPECTS.map((p) => (
                    <Chip key={p.id} active={aspect === p.id} onClick={() => setAspect(p.id)}>
                      {p.label}
                    </Chip>
                  ))}
                </Field>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Direction</Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    maxLength={800}
                    placeholder="Keep the glasses. Dark knit. Soft window light."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </>
            )}
            <Button className="w-full" size="lg" disabled={busy} onClick={() => void onGenerate()}>
              {busy ? "Training look…" : "Create avatar"}
            </Button>
            <EngineNote />
          </div>
        </>
      }
      preview={
        <div className="space-y-6">
          <div className={aspectClass(aspect) + " relative max-h-[70dvh] overflow-hidden rounded-2xl border border-border bg-card"}>
            {rendering ? (
              <Skeleton className="absolute inset-0 rounded-none" />
            ) : preview ? (
              <button type="button" className="h-full w-full" onClick={() => latest && setOpen(latest)}>
                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
              </button>
            ) : (
              <div className="flex h-full items-end p-6">
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Identity stays locked to the upload. Public-figure lookalikes are not the point of this tool.
                </p>
              </div>
            )}
          </div>
          {latest?.status === "ready" ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void navigate({ to: "/results" })}>
                Open in Results
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!latest || !preview) return;
                  setDraft({ prompt: latest.prompt, aspect: latest.aspect, sourceId: latest.id, sourceSrc: preview, intent: "looks" });
                  void navigate({ to: "/looks" });
                }}
              >
                Restyle
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!latest || !preview) return;
                  setDraft({ prompt: latest.prompt, aspect: latest.aspect, sourceId: latest.id, sourceSrc: preview, intent: "motion" });
                  void navigate({ to: "/motion" });
                }}
              >
                Animate
              </Button>
            </div>
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
