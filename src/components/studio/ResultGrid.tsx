import { Download, Heart, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { LIBRARY } from "@/lib/catalog";
import { aspectClass } from "@/lib/prompts";
import { useStudio } from "@/lib/store";
import type { ResultItem } from "@/lib/types";
import { retryItem } from "@/lib/use-generate";
import { cn, downloadDataUrl, kindLabel } from "@/lib/utils";

export function ResultThumb({
  item,
  onOpen,
}: {
  item: ResultItem;
  onOpen: (item: ResultItem) => void;
}) {
  const cached = useStudio((s) => s.srcCache[item.id]);
  const loadSrc = useStudio((s) => s.loadSrc);
  const toggleFavorite = useStudio((s) => s.toggleFavorite);
  const remove = useStudio((s) => s.remove);

  useEffect(() => {
    if (item.status === "ready" && !item.videoUrl) void loadSrc(item.id);
  }, [item.id, item.status, item.videoUrl, loadSrc]);

  const src = cached || item.remoteUrl;
  const media = item.videoUrl || src;

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card transition-[border-color,transform] duration-150 hover:-translate-y-0.5">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={cn("relative block w-full overflow-hidden bg-muted", aspectClass(item.aspect))}
      >
        {item.status === "pending" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Skeleton className="absolute inset-0 rounded-none" />
            <span className="relative text-xs text-muted-foreground">Rendering</span>
          </div>
        ) : item.status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <p className="text-xs text-muted-foreground">{item.error || "Failed"}</p>
            <span className="text-[11px] font-medium">Tap to inspect · Retry below</span>
          </div>
        ) : item.videoUrl ? (
          <video src={item.videoUrl} className="h-full w-full object-cover" muted playsInline loop autoPlay />
        ) : src ? (
          <img src={src} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}
      </button>
      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{item.title}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{kindLabel(item.kind)}</p>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label={item.favorite ? "Unstar" : "Star"}
            onClick={() => toggleFavorite(item.id)}
          >
            <Heart className={cn("size-3.5", item.favorite && "fill-foreground")} />
          </Button>
          {item.status === "error" ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label="Retry"
              onClick={() => void retryItem(item.id)}
            >
              <RefreshCw className="size-3.5" />
            </Button>
          ) : null}
          {media && item.status === "ready" ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label="Download"
              onClick={() => void downloadDataUrl(media, `vela-${item.id}.${item.videoUrl ? "mp4" : "jpg"}`)}
            >
              <Download className="size-3.5" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label="Delete"
            onClick={() => void remove(item.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function LibraryCard({
  src,
  title,
  kind,
  prompt,
  onRemix,
  onOpen,
}: {
  src: string;
  title: string;
  kind: string;
  prompt: string;
  onRemix: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card transition-[transform] duration-150 hover:-translate-y-0.5">
      <button type="button" onClick={onOpen} className="relative block aspect-[3/4] w-full overflow-hidden bg-muted">
        <img src={src} alt={title} className="h-full w-full object-cover" />
      </button>
      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{title}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{kindLabel(kind)}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemix}>
          Remix
        </Button>
      </div>
      <p className="sr-only">{prompt}</p>
    </article>
  );
}

export function ResultGrid({
  items,
  onOpen,
}: {
  items: ResultItem[];
  onOpen: (item: ResultItem) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <ResultThumb key={item.id} item={item} onOpen={onOpen} />
      ))}
    </div>
  );
}

export function LibraryGrid({
  onRemix,
  onOpen,
}: {
  onRemix: (item: (typeof LIBRARY)[number]) => void;
  onOpen: (item: (typeof LIBRARY)[number]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {LIBRARY.map((item) => (
        <LibraryCard
          key={item.id}
          src={item.src}
          title={item.title}
          kind={item.kind}
          prompt={item.prompt}
          onRemix={() => onRemix(item)}
          onOpen={() => onOpen(item)}
        />
      ))}
    </div>
  );
}

export function useResultSrc(id: string | undefined) {
  const cached = useStudio((s) => (id ? s.srcCache[id] : undefined));
  const loadSrc = useStudio((s) => s.loadSrc);
  const remote = useStudio((s) => (id ? s.results.find((r) => r.id === id)?.remoteUrl : undefined));
  const [src, setSrc] = useState(cached || remote);
  useEffect(() => {
    if (!id) return;
    if (cached) {
      setSrc(cached);
      return;
    }
    void loadSrc(id).then((v) => setSrc(v || remote));
  }, [id, cached, loadSrc, remote]);
  return src;
}
