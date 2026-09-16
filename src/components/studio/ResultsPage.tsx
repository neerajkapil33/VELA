import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LibraryGrid, ResultGrid } from "@/components/studio/ResultGrid";
import { LibraryViewer, ResultViewer } from "@/components/studio/ResultViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedTabs } from "@/components/ui/tabs";
import { LIBRARY } from "@/lib/catalog";
import { useStudio } from "@/lib/store";
import type { ResultItem, ResultKind } from "@/lib/types";

const TABS = [
  { id: "yours", label: "Yours" },
  { id: "library", label: "Library" },
] as const;

const FILTERS: { id: "all" | "starred" | ResultKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "starred", label: "Starred" },
  { id: "human", label: "Humans" },
  { id: "photo", label: "Photo" },
  { id: "avatar3d", label: "3D" },
  { id: "look", label: "Looks" },
  { id: "motion", label: "Motion" },
];

export function ResultsPage() {
  const results = useStudio((s) => s.results);
  const setDraft = useStudio((s) => s.setDraft);
  const navigate = useNavigate();
  const [tab, setTab] = useState<"yours" | "library">("yours");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<ResultItem | null>(null);
  const [libOpen, setLibOpen] = useState<(typeof LIBRARY)[number] | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return results.filter((r) => {
      if (filter === "starred" && !r.favorite) return false;
      if (filter !== "all" && filter !== "starred" && r.kind !== filter) return false;
      if (!query) return true;
      return (r.title + r.prompt).toLowerCase().includes(query);
    });
  }, [results, filter, q]);

  const live = results.filter((r) => r.status === "pending").length;

  function remix(item: (typeof LIBRARY)[number], path: "/create" | "/looks" | "/motion" = "/create") {
    setDraft({ prompt: item.prompt, aspect: item.aspect, sourceSrc: item.src, intent: path === "/create" ? "create" : path === "/looks" ? "looks" : "motion" });
    void navigate({ to: path });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 md:flex-row md:items-end md:justify-between lg:px-7">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Archive</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Results</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Everything you generate lands here and syncs to the studio backend. Free, no credits.
            {live ? ` ${live} still rendering.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void navigate({ to: "/create" })}>New human</Button>
          <Button variant="outline" onClick={() => void navigate({ to: "/photo" })}>
            Photo avatar
          </Button>
          <Button variant="outline" onClick={() => void navigate({ to: "/avatar" })}>
            3D studio
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:px-7">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
          <div className="ml-auto w-full sm:w-56">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search results" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={
                filter === f.id
                  ? "h-8 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground"
                  : "h-8 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-7">
        {tab === "yours" && filtered.length > 0 ? (
          <ResultGrid items={filtered} onOpen={setOpen} />
        ) : tab === "yours" ? (
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5">
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                {q || filter !== "all"
                  ? "Nothing matches that filter. Clear search or try another tab."
                  : "Your generations archive here and stay in sync. Remix a library portrait or start from a blank brief."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void navigate({ to: "/create" })}>Create human</Button>
                <Button variant="outline" onClick={() => { setTab("library"); setFilter("all"); setQ(""); }}>
                  Browse library
                </Button>
              </div>
            </div>
            {!q && filter === "all" ? (
              <>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Studio library</p>
                <LibraryGrid onOpen={(item) => setLibOpen(item)} onRemix={(item) => remix(item)} />
              </>
            ) : null}
          </div>
        ) : (
          <LibraryGrid onOpen={(item) => setLibOpen(item)} onRemix={(item) => remix(item)} />
        )}
      </div>

      <ResultViewer item={open} onClose={() => setOpen(null)} />
      <LibraryViewer
        item={libOpen}
        onClose={() => setLibOpen(null)}
        onRemix={() => {
          if (!libOpen) return;
          remix(libOpen, "/create");
          setLibOpen(null);
        }}
        onRestyle={() => {
          if (!libOpen) return;
          remix(libOpen, "/looks");
          setLibOpen(null);
        }}
        onAnimate={() => {
          if (!libOpen) return;
          remix(libOpen, "/motion");
          setLibOpen(null);
        }}
      />
    </div>
  );
}
