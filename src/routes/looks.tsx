import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EngineNote, Field, FormTabs, GeneratorLayout, PageIntro, SourceStrip } from "@/components/studio/GeneratorLayout";
import { ResultThumb } from "@/components/studio/ResultGrid";
import { ResultViewer } from "@/components/studio/ResultViewer";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Chip, Skeleton } from "@/components/ui/misc";
import { LIBRARY, LOOK_SETTINGS, WARDROBES } from "@/lib/catalog";
import { aspectClass, buildLookPrompt } from "@/lib/prompts";
import { useStudio } from "@/lib/store";
import type { ResultItem } from "@/lib/types";
import { runImageJob } from "@/lib/use-generate";
import { toast } from "sonner";

export const Route = createFileRoute("/looks")({
  component: LooksPage,
});

const TABS = [
  { id: "face", label: "Face" },
  { id: "style", label: "Style" },
] as const;

function LooksPage() {
  const results = useStudio((s) => s.results);
  const draft = useStudio((s) => s.draft);
  const loadSrc = useStudio((s) => s.loadSrc);
  const srcCache = useStudio((s) => s.srcCache);
  const navigate = useNavigate();

  const sources = results.filter((r) => r.status === "ready" && r.kind !== "motion");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("face");
  const [sourceId, setSourceId] = useState<string | "lib">(draft?.sourceId ?? sources[0]?.id ?? "lib");
  const [libId, setLibId] = useState(LIBRARY[0]?.id ?? "");
  const [wardrobe, setWardrobe] = useState<(typeof WARDROBES)[number]>(WARDROBES[0]);
  const [setting, setSetting] = useState<(typeof LOOK_SETTINGS)[number]>(LOOK_SETTINGS[0]);
  const [notes, setNotes] = useState("");
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
    sourceId === "lib" ? libItem?.src : draft?.sourceSrc || (sourceId ? srcCache[sourceId] : undefined);
  const sourceItem = sources.find((s) => s.id === sourceId);
  const mine = results.filter((r) => r.kind === "look").slice(0, 6);
  const latest = (latestId && results.find((r) => r.id === latestId)) || mine.find((r) => r.status === "ready");
  const preview = latest && latest.status !== "pending" ? srcCache[latest.id] || latest.remoteUrl : sourceSrc;
  const rendering = busy || latest?.status === "pending";

  async function onGenerate() {
    if (!sourceSrc) {
      toast.error("Pick a source portrait first");
      setTab("face");
      return;
    }
    setBusy(true);
    const id = await runImageJob({
      kind: "look",
      title: "Restyle",
      prompt: buildLookPrompt(wardrobe, setting, notes),
      aspect: sourceItem?.aspect ?? "3:4",
      sourceDataUrl: sourceSrc,
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
            kicker="Looks"
            title="Wardrobe and world"
            copy="Keep the face. Change the clothes, the room, the hour of day."
          />
          <FormTabs tabs={[...TABS]} value={tab} onChange={setTab} />
          <div className="space-y-4">
            {tab === "face" ? (
              <div className="space-y-1.5">
                <Label>Source</Label>
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
              </div>
            ) : (
              <>
                <Field label="Wardrobe">
                  {WARDROBES.map((w) => (
                    <Chip key={w} active={wardrobe === w} onClick={() => setWardrobe(w)}>
                      {w}
                    </Chip>
                  ))}
                </Field>
                <Field label="Setting">
                  {LOOK_SETTINGS.map((w) => (
                    <Chip key={w} active={setting === w} onClick={() => setSetting(w)}>
                      {w}
                    </Chip>
                  ))}
                </Field>
                <div className="space-y-1.5">
                  <Label htmlFor="look-notes">Notes</Label>
                  <Textarea
                    id="look-notes"
                    rows={3}
                    maxLength={600}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Wet hair. Gold jewelry. Looking off-camera."
                  />
                </div>
              </>
            )}
            <Button className="w-full" size="lg" disabled={busy} onClick={() => void onGenerate()}>
              {busy ? "Restyling…" : "Generate look"}
            </Button>
            <EngineNote />
          </div>
        </>
      }
      preview={
        <div className="space-y-6">
          <div className={aspectClass("3:4") + " relative max-h-[70dvh] overflow-hidden rounded-2xl border border-border bg-card"}>
            {rendering ? (
              <Skeleton className="absolute inset-0 rounded-none" />
            ) : preview ? (
              <img src={preview} alt="Look preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-end p-6">
                <p className="text-sm text-muted-foreground">Select a face from Results or the library.</p>
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
