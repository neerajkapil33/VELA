import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EngineNote, Field, FormTabs, GeneratorLayout, PageIntro } from "@/components/studio/GeneratorLayout";
import { ResultThumb } from "@/components/studio/ResultGrid";
import { ResultViewer } from "@/components/studio/ResultViewer";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Chip, Skeleton } from "@/components/ui/misc";
import { AGES, ANCESTRIES, ASPECTS, PRESENTATIONS, SETTINGS, STYLES } from "@/lib/catalog";
import { aspectClass, buildHumanPrompt } from "@/lib/prompts";
import { useStudio } from "@/lib/store";
import type { AspectRatio, ResultItem } from "@/lib/types";
import { runImageJob } from "@/lib/use-generate";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

const TABS = [
  { id: "subject", label: "Subject" },
  { id: "look", label: "Look" },
  { id: "frame", label: "Frame" },
] as const;

function CreatePage() {
  const draft = useStudio((s) => s.draft);
  const results = useStudio((s) => s.results);
  const srcCache = useStudio((s) => s.srcCache);
  const setDraft = useStudio((s) => s.setDraft);
  const quota = useStudio((s) => s.quota);
  const navigate = useNavigate();

  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("subject");
  const [presentation, setPresentation] = useState<(typeof PRESENTATIONS)[number]>("Woman");
  const [age, setAge] = useState<(typeof AGES)[number]>("30s");
  const [ancestry, setAncestry] = useState<(typeof ANCESTRIES)[number]>("East Asian");
  const [style, setStyle] = useState<(typeof STYLES)[number]["id"]>("photoreal");
  const [setting, setSetting] = useState<(typeof SETTINGS)[number]["id"]>("studio");
  const [aspect, setAspect] = useState<AspectRatio>(draft?.aspect ?? "3:4");
  const [details, setDetails] = useState(draft?.prompt ?? "");
  const [count, setCount] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<ResultItem | null>(null);
  const [latestId, setLatestId] = useState<string | null>(null);

  const prompt = useMemo(
    () =>
      details.trim().length > 80
        ? details
        : buildHumanPrompt({ presentation, age, ancestry, style, setting, details }),
    [presentation, age, ancestry, style, setting, details],
  );

  const mine = results.filter((r) => r.kind === "human").slice(0, 8);
  const latest = (latestId && results.find((r) => r.id === latestId)) || mine.find((r) => r.status === "ready") || mine[0];
  const preview = latest ? srcCache[latest.id] || latest.remoteUrl : undefined;
  const rendering = busy || latest?.status === "pending";

  async function onGenerate() {
    setBusy(true);
    setDraft(null);
    const id = await runImageJob({
      kind: "human",
      title: `${presentation} · ${age}`,
      prompt,
      aspect,
      n: count,
    });
    setBusy(false);
    if (id) setLatestId(id);
  }

  return (
    <GeneratorLayout
      form={
        <>
          <PageIntro
            kicker="Create"
            title="Photoreal human"
            copy="Describe an adult character. VELA builds a photography-grade portrait — free, no credits."
          />
          <FormTabs tabs={[...TABS]} value={tab} onChange={setTab} />
          <div className="space-y-4">
            {tab === "subject" ? (
              <>
                <Field label="Presentation">
                  {PRESENTATIONS.map((p) => (
                    <Chip key={p} active={presentation === p} onClick={() => setPresentation(p)}>
                      {p}
                    </Chip>
                  ))}
                </Field>
                <Field label="Age">
                  {AGES.map((p) => (
                    <Chip key={p} active={age === p} onClick={() => setAge(p)}>
                      {p}
                    </Chip>
                  ))}
                </Field>
                <Field label="Ancestry">
                  {ANCESTRIES.map((p) => (
                    <Chip key={p} active={ancestry === p} onClick={() => setAncestry(p)}>
                      {p}
                    </Chip>
                  ))}
                </Field>
              </>
            ) : null}
            {tab === "look" ? (
              <>
                <Field label="Style">
                  {STYLES.map((p) => (
                    <Chip key={p.id} active={style === p.id} onClick={() => setStyle(p.id)}>
                      {p.label}
                    </Chip>
                  ))}
                </Field>
                <Field label="Setting">
                  {SETTINGS.map((p) => (
                    <Chip key={p.id} active={setting === p.id} onClick={() => setSetting(p.id)}>
                      {p.label}
                    </Chip>
                  ))}
                </Field>
                <div className="space-y-1.5">
                  <Label htmlFor="details">Details</Label>
                  <Textarea
                    id="details"
                    rows={5}
                    maxLength={1200}
                    placeholder="Wardrobe, expression, hair, mood…"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                </div>
              </>
            ) : null}
            {tab === "frame" ? (
              <>
                <Field label="Frame">
                  {ASPECTS.map((p) => (
                    <Chip key={p.id} active={aspect === p.id} onClick={() => setAspect(p.id)}>
                      {p.label}
                    </Chip>
                  ))}
                </Field>
                <Field label="Variations">
                  <Chip active={count === 1} onClick={() => setCount(1)}>
                    One
                  </Chip>
                  <Chip active={count === 2} onClick={() => setCount(2)}>
                    Two
                  </Chip>
                </Field>
              </>
            ) : null}
            <Button className="w-full" size="lg" disabled={busy} onClick={() => void onGenerate()}>
              {busy ? "Rendering…" : quota?.engine === false ? "Engine offline" : "Generate human"}
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
                <img src={preview} alt="Latest human" className="h-full w-full object-cover" />
              </button>
            ) : (
              <div className="flex h-full items-end p-6">
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Output appears here, then archives to Results. Tune the tabs or paste a full brief.
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
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Recent</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {mine.map((item) => (
                  <ResultThumb key={item.id} item={item} onOpen={setOpen} />
                ))}
              </div>
            </div>
          ) : null}
          <ResultViewer item={open} onClose={() => setOpen(null)} />
        </div>
      }
    />
  );
}
