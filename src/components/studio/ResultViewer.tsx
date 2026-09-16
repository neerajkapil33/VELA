import { useNavigate } from "@tanstack/react-router";
import { Clapperboard, Copy, Download, Heart, RefreshCw, Shirt, Shuffle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { useStudio } from "@/lib/store";
import type { ResultItem } from "@/lib/types";
import { retryItem } from "@/lib/use-generate";
import { downloadDataUrl, kindLabel } from "@/lib/utils";
import { toast } from "sonner";
import { useResultSrc } from "./ResultGrid";

type LibView = { src: string; title: string; prompt: string; kind: string; aspect?: string };

export function ResultViewer({
  item,
  onClose,
}: {
  item: ResultItem | null;
  onClose: () => void;
}) {
  const src = useResultSrc(item?.id);
  const toggleFavorite = useStudio((s) => s.toggleFavorite);
  const remove = useStudio((s) => s.remove);
  const setDraft = useStudio((s) => s.setDraft);
  const navigate = useNavigate();
  const media = item?.videoUrl || src || item?.remoteUrl;

  if (!item) return null;

  function useAs(path: "/looks" | "/motion" | "/create" | "/photo") {
    if (!item || !media) return;
    setDraft({
      prompt: item.prompt,
      aspect: item.aspect,
      sourceId: item.id,
      sourceSrc: media,
      intent: path === "/looks" ? "looks" : path === "/motion" ? "motion" : path === "/photo" ? "photo" : "create",
    });
    onClose();
    void navigate({ to: path });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="grid max-h-[92dvh] grid-rows-[auto_1fr_auto] p-0">
        <div className="border-b border-border px-5 py-4 pr-14">
          <DialogTitle>{item.title}</DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            <Badge className="mr-2">{kindLabel(item.kind)}</Badge>
            {item.status === "pending" ? "Rendering" : new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="min-h-0 overflow-auto bg-background">
          {item.videoUrl ? (
            <video src={item.videoUrl} className="mx-auto max-h-[70dvh] w-full object-contain" controls autoPlay loop />
          ) : media && item.status !== "error" ? (
            <img src={media} alt={item.title} className="mx-auto max-h-[70dvh] w-full object-contain" />
          ) : (
            <p className="p-8 text-sm text-muted-foreground">{item.error || "Still rendering."}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
          {media && item.status === "ready" ? (
            <Button
              size="sm"
              onClick={() => void downloadDataUrl(media, `vela-${item.id}.${item.videoUrl ? "mp4" : "jpg"}`)}
            >
              <Download /> Download
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => toggleFavorite(item.id)}>
            <Heart className={item.favorite ? "fill-foreground" : ""} />
            {item.favorite ? "Starred" : "Star"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(item.prompt);
              toast.success("Prompt copied");
            }}
          >
            <Copy /> Copy prompt
          </Button>
          {item.status === "error" ? (
            <Button size="sm" onClick={() => void retryItem(item.id)}>
              <RefreshCw /> Retry
            </Button>
          ) : null}
          {media && !item.videoUrl && item.status === "ready" ? (
            <>
              <Button size="sm" variant="outline" onClick={() => useAs("/create")}>
                <Shuffle /> Remix
              </Button>
              <Button size="sm" variant="outline" onClick={() => useAs("/looks")}>
                <Shirt /> Restyle
              </Button>
              <Button size="sm" variant="outline" onClick={() => useAs("/motion")}>
                <Clapperboard /> Animate
              </Button>
            </>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-muted-foreground"
            onClick={() => {
              void remove(item.id);
              onClose();
            }}
          >
            <Trash2 /> Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LibraryViewer({
  item,
  onClose,
  onRemix,
  onRestyle,
  onAnimate,
}: {
  item: LibView | null;
  onClose: () => void;
  onRemix: () => void;
  onRestyle?: () => void;
  onAnimate?: () => void;
}) {
  if (!item) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="grid max-h-[92dvh] grid-rows-[auto_1fr_auto] p-0">
        <div className="border-b border-border px-5 py-4 pr-14">
          <DialogTitle>{item.title}</DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground">{kindLabel(item.kind)} · Studio library</p>
        </div>
        <div className="min-h-0 overflow-auto bg-background">
          <img src={item.src} alt={item.title} className="mx-auto max-h-[70dvh] w-full object-contain" />
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
          <Button size="sm" onClick={onRemix}>
            Remix this look
          </Button>
          {onRestyle ? (
            <Button size="sm" variant="outline" onClick={onRestyle}>
              Restyle
            </Button>
          ) : null}
          {onAnimate ? (
            <Button size="sm" variant="outline" onClick={onAnimate}>
              Animate
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
