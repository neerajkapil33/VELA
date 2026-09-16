import { SegmentedTabs } from "@/components/ui/tabs";
import { LIBRARY } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function GeneratorLayout({
  form,
  preview,
}: {
  form: React.ReactNode;
  preview: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <aside className="max-h-[54%] shrink-0 overflow-y-auto border-b border-border p-4 lg:max-h-none lg:w-[380px] lg:border-b-0 lg:border-r lg:p-6">
        {form}
      </aside>
      <section className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 lg:p-7">{preview}</section>
    </div>
  );
}

export function PageIntro({
  kicker,
  title,
  copy,
}: {
  kicker: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="mb-5 stagger-in">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{kicker}</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</p>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function FormTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return <SegmentedTabs tabs={tabs} value={value} onChange={onChange} className="mb-4" />;
}

export function EngineNote() {
  return (
    <p className="text-[11px] leading-relaxed text-muted-foreground">
      Free on this studio. No credits, no watermark. Stills usually take a few seconds; motion about a minute.
    </p>
  );
}

export function SourceStrip({
  sourceId,
  onPick,
  sources,
  srcCache,
}: {
  sourceId: string | "lib" | null;
  onPick: (id: string | "lib") => void;
  sources: { id: string; title: string }[];
  srcCache: Record<string, string>;
}) {
  const lib = LIBRARY[0];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onPick("lib")}
        className={cn(
          "size-16 shrink-0 overflow-hidden rounded-lg border transition-[box-shadow] duration-150",
          sourceId === "lib" ? "border-primary" : "border-border",
        )}
      >
        <img src={lib?.src} alt="Library" className="h-full w-full object-cover" />
      </button>
      {sources.slice(0, 12).map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s.id)}
          className={cn(
            "size-16 shrink-0 overflow-hidden rounded-lg border transition-[box-shadow] duration-150",
            sourceId === s.id ? "border-primary" : "border-border",
          )}
        >
          {srcCache[s.id] ? (
            <img src={srcCache[s.id]} alt={s.title} className="h-full w-full object-cover" />
          ) : (
            <span className="block size-full bg-muted" />
          )}
        </button>
      ))}
    </div>
  );
}
