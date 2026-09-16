import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { CLIPS, CLIP_PROMPTS, type ClipId } from "@/components/avatar3d/animate";
import { AvatarViewport } from "@/components/avatar3d/AvatarViewport";
import {
  CAST,
  CLOTH,
  DEFAULT_RIG,
  describeRig,
  EYES,
  HAIR,
  HAIR_STYLES,
  OUTFITS,
  SKIN,
  type AvatarRig,
} from "@/components/avatar3d/rig";
import { EngineNote, Field, FormTabs, PageIntro } from "@/components/studio/GeneratorLayout";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Chip } from "@/components/ui/misc";
import { Slider } from "@/components/ui/slider";
import { CAMERAS } from "@/lib/catalog";
import { compressDataUrl } from "@/lib/media";
import { buildTwinPrompt } from "@/lib/prompts";
import { useStudio } from "@/lib/store";
import { runImageJob, runVideoJob } from "@/lib/use-generate";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/avatar")({
  component: AvatarPage,
});

const TABS = [
  { id: "cast", label: "Cast" },
  { id: "figure", label: "Figure" },
  { id: "move", label: "Move" },
] as const;

function AvatarPage() {
  const [rig, setRig] = useState<AvatarRig>(DEFAULT_RIG);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("cast");
  const [castId, setCastId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [clip, setClip] = useState<ClipId>("idle");
  const [inPlace, setInPlace] = useState(true);
  const [rotate, setRotate] = useState(false);
  const [busy, setBusy] = useState(false);
  const snapApi = useRef<{ snapshot: () => string } | null>(null);
  const snapshotRef = useCallback((api: { snapshot: () => string }) => {
    snapApi.current = api;
  }, []);
  const putSrc = useStudio((s) => s.putSrc);
  const addPending = useStudio((s) => s.addPending);
  const markReady = useStudio((s) => s.markReady);
  const setDraft = useStudio((s) => s.setDraft);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CAST;
    return CAST.filter((c) => (c.name + c.tag).toLowerCase().includes(q));
  }, [query]);

  function patch(p: Partial<AvatarRig>) {
    setRig((r) => ({ ...r, ...p }));
    setCastId(null);
  }

  async function grabStill() {
    const api = snapApi.current;
    if (!api) throw new Error("Studio is still warming up");
    const raw = api.snapshot();
    return compressDataUrl(raw, 1200, 0.9);
  }

  async function snapshot() {
    try {
      const compact = await grabStill();
      const item = addPending({
        kind: "avatar3d",
        title: castId ? CAST.find((c) => c.id === castId)?.name ?? "3D snapshot" : "3D snapshot",
        prompt: describeRig(rig),
        aspect: "3:4",
      });
      await putSrc(item.id, compact);
      markReady(item.id);
      toast.success("Snapshot saved to Results");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not snapshot");
    }
  }

  async function renderTwin() {
    setBusy(true);
    const id = await runImageJob({
      kind: "avatar3d",
      title: "Photoreal twin",
      prompt: buildTwinPrompt(describeRig(rig)),
      aspect: "3:4",
    });
    setBusy(false);
    if (id) {
      const src = useStudio.getState().srcCache[id];
      if (src) setDraft({ prompt: describeRig(rig), aspect: "3:4", sourceId: id, sourceSrc: src });
    }
  }

  async function filmClip() {
    setBusy(true);
    try {
      const still = await grabStill();
      const item = addPending({
        kind: "avatar3d",
        title: "3D snapshot",
        prompt: describeRig(rig),
        aspect: "3:4",
      });
      await putSrc(item.id, still);
      markReady(item.id);
      const cam = CAMERAS.find((c) => c.id === "orbit") ?? CAMERAS[0];
      await runVideoJob({
        title: `${CLIPS.find((c) => c.id === clip)?.label ?? "Move"} · orbit`,
        prompt: `${CLIP_PROMPTS[clip]} ${cam.prompt} Adult digital human on a studio cyclorama.`,
        aspect: "3:4",
        sourceDataUrl: still,
        sourceId: item.id,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not film");
    }
    setBusy(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <aside className="max-h-[48%] shrink-0 overflow-y-auto border-b border-border p-4 lg:max-h-none lg:w-[380px] lg:border-b-0 lg:border-r lg:p-6">
        <PageIntro
          kicker="3D studio"
          title="Cast and move"
          copy="Pick a character, apply a clip, orbit the set, snapshot it, or film a free 6s turntable."
        />
        <FormTabs tabs={[...TABS]} value={tab} onChange={setTab} />
        <div className="space-y-5">
          {tab === "cast" ? (
            <>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cast" />
              <div className="grid grid-cols-2 gap-2">
                {filtered.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setRig(member.rig);
                      setCastId(member.id);
                    }}
                    className={cn(
                      "overflow-hidden rounded-xl border text-left transition-[border-color,transform] duration-150 active:scale-[0.98]",
                      castId === member.id ? "border-primary" : "border-border",
                    )}
                  >
                    <img src={member.src} alt="" className="aspect-[3/4] w-full object-cover" />
                    <span className="block px-2 py-1.5">
                      <span className="block text-xs font-medium">{member.name}</span>
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">{member.tag}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {tab === "figure" ? (
            <>
              <SliderField
                label="Presentation"
                value={rig.gender}
                onChange={(v) => patch({ gender: v })}
                left="Softer"
                right="Stronger"
              />
              <Swatch label="Skin" colors={SKIN} index={rig.skin} onPick={(i) => patch({ skin: i })} />
              <Swatch label="Eyes" colors={EYES} index={rig.eye} onPick={(i) => patch({ eye: i })} />
              <Field label="Hair">
                {HAIR_STYLES.map((name, i) => (
                  <Chip key={name} active={rig.hair === i} onClick={() => patch({ hair: i })}>
                    {name}
                  </Chip>
                ))}
              </Field>
              <Swatch label="Hair color" colors={HAIR} index={rig.hairColor} onPick={(i) => patch({ hairColor: i })} />
              <Field label="Outfit">
                {OUTFITS.map((name, i) => (
                  <Chip key={name} active={rig.outfit === i} onClick={() => patch({ outfit: i })}>
                    {name}
                  </Chip>
                ))}
              </Field>
              <Swatch
                label="Outfit color"
                colors={CLOTH}
                index={rig.outfitColor}
                onPick={(i) => patch({ outfitColor: i })}
              />
              <Button variant="ghost" onClick={() => { setRig(DEFAULT_RIG); setCastId(null); }}>
                Reset figure
              </Button>
            </>
          ) : null}
          {tab === "move" ? (
            <>
              <Field label="Clip">
                {CLIPS.map((c) => (
                  <Chip key={c.id} active={clip === c.id} onClick={() => setClip(c.id)}>
                    {c.label}
                  </Chip>
                ))}
              </Field>
              <Chip active={inPlace} onClick={() => setInPlace((v) => !v)}>
                {inPlace ? "In place on" : "In place off"}
              </Chip>
              <Chip active={rotate} onClick={() => setRotate((v) => !v)}>
                {rotate ? "Turntable on" : "Turntable off"}
              </Chip>
            </>
          ) : null}
          <div className="flex flex-col gap-2 pt-1">
            <Button size="lg" onClick={() => void snapshot()}>
              Snapshot to Results
            </Button>
            <Button size="lg" variant="outline" disabled={busy} onClick={() => void filmClip()}>
              {busy ? "Filming…" : "Film 6s clip"}
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => void renderTwin()}>
              {busy ? "Rendering twin…" : "Photoreal twin"}
            </Button>
            <Button variant="ghost" onClick={() => void navigate({ to: "/motion" })}>
              Open video lab
            </Button>
          </div>
          <EngineNote />
        </div>
      </aside>
      <section className="min-h-0 min-w-0 flex-1 p-3 lg:p-5">
        <AvatarViewport rig={rig} autoRotate={rotate} clip={clip} inPlace={inPlace} onReady={snapshotRef} />
      </section>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  left,
  right,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  left: string;
  right: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Slider min={0} max={1} step={0.01} value={[value]} onValueChange={(v) => onChange(v[0] ?? 0)} />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

function Swatch({
  label,
  colors,
  index,
  onPick,
}: {
  label: string;
  colors: string[];
  index: number;
  onPick: (i: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <button
            key={c}
            type="button"
            aria-label={`${label} ${i + 1}`}
            onClick={() => onPick(i)}
            className="size-8 rounded-full border border-border"
            style={{
              background: c,
              boxShadow: index === i ? "0 0 0 2px var(--color-primary)" : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
