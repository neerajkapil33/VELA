import { useEffect, useRef, useState } from "react";
import { getQuota } from "@/lib/studio-api";
import { useStudio } from "@/lib/store";
import { resumeVideoJob } from "@/lib/use-generate";
import { sessionId } from "@/lib/utils";

export function StudioSync() {
  const [live, setLive] = useState(false);
  useEffect(() => setLive(true), []);
  if (!live) return null;
  return <StudioSyncLive />;
}

function StudioSyncLive() {
  const hydrated = useStudio((s) => s.hydrated);
  const results = useStudio((s) => s.results);
  const pullRemote = useStudio((s) => s.pullRemote);
  const setQuota = useStudio((s) => s.setQuota);
  const ticking = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    const refreshQuota = async () => {
      try {
        const q = await getQuota({ data: { sessionId: sessionId() } });
        if (!alive || !q.ok) return;
        setQuota({
          engine: q.engine,
          imagesLeft: q.imagesLeft,
          videosLeft: q.videosLeft,
          imagesMax: q.imagesMax,
          videosMax: q.videosMax,
        });
      } catch {
        /* ignore */
      }
    };
    void pullRemote();
    void refreshQuota();
    const id = window.setInterval(() => {
      void pullRemote();
      void refreshQuota();
    }, 20000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [hydrated, pullRemote, setQuota]);

  const pendingKey = results
    .filter((r) => r.status === "pending" && r.jobId)
    .map((r) => `${r.id}:${r.jobId}`)
    .join("|");

  useEffect(() => {
    if (!pendingKey) return;
    let alive = true;
    const tick = async () => {
      if (ticking.current) return;
      ticking.current = true;
      try {
        const jobs = useStudio
          .getState()
          .results.filter((r) => r.status === "pending" && r.jobId);
        for (const job of jobs) {
          if (!alive || !job.jobId) return;
          await resumeVideoJob(job.id, job.jobId);
        }
      } finally {
        ticking.current = false;
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 4000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [pendingKey]);

  return null;
}
