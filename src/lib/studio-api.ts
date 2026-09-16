import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AspectRatio, ResultItem, ResultKind, ResultStatus } from "./types";

const Kind = z.enum(["human", "photo", "look", "avatar3d", "motion"]);
const Aspect = z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]);
const Status = z.enum(["pending", "ready", "error"]);

const Item = z.object({
  id: z.string().min(4).max(80),
  kind: Kind,
  title: z.string().min(1).max(160),
  prompt: z.string().min(1).max(2500),
  aspect: Aspect,
  createdAt: z.number(),
  favorite: z.boolean(),
  status: Status,
  error: z.string().max(500).optional(),
  remoteUrl: z.string().max(2000).optional(),
  videoUrl: z.string().max(2000).optional(),
  sourceId: z.string().max(80).optional(),
  jobId: z.string().max(200).optional(),
});

type Row = {
  id: string;
  kind: ResultKind;
  title: string;
  prompt: string;
  aspect: AspectRatio;
  status: ResultStatus;
  favorite: number;
  error: string | null;
  remote_url: string | null;
  video_url: string | null;
  source_id: string | null;
  job_id: string | null;
  created_at: number;
};

function toItem(row: Row): ResultItem {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    prompt: row.prompt,
    aspect: row.aspect,
    status: row.status,
    favorite: Boolean(row.favorite),
    error: row.error ?? undefined,
    remoteUrl: row.remote_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    sourceId: row.source_id ?? undefined,
    jobId: row.job_id ?? undefined,
    createdAt: Number(row.created_at),
  };
}

async function sql() {
  const { getSql } = await import("./db");
  return getSql();
}

export const listGenerations = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ sessionId: z.string().min(4).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const db = await sql();
    const rows = await db.query<Row>(
      `select id, kind, title, prompt, aspect, status, favorite, error, remote_url, video_url, source_id, job_id, created_at
       from generations
       where session_id = $1
       order by created_at desc
       limit 80`,
      [data.sessionId],
    );
    return { ok: true as const, items: rows.map(toItem) };
  });

export const saveGeneration = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ sessionId: z.string().min(4).max(80), item: Item }).parse(input),
  )
  .handler(async ({ data }) => {
    const db = await sql();
    const { item } = data;
    const now = Date.now();
    await db.query(
      `insert into generations (
          id, session_id, kind, title, prompt, aspect, status, favorite, error,
          remote_url, video_url, source_id, job_id, created_at, updated_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        on conflict (id) do update set
          kind = excluded.kind,
          title = excluded.title,
          prompt = excluded.prompt,
          aspect = excluded.aspect,
          status = excluded.status,
          favorite = excluded.favorite,
          error = excluded.error,
          remote_url = excluded.remote_url,
          video_url = excluded.video_url,
          source_id = excluded.source_id,
          job_id = excluded.job_id,
          updated_at = excluded.updated_at`,
      [
        item.id,
        data.sessionId,
        item.kind,
        item.title,
        item.prompt,
        item.aspect,
        item.status,
        item.favorite ? 1 : 0,
        item.error ?? null,
        item.remoteUrl ?? null,
        item.videoUrl ?? null,
        item.sourceId ?? null,
        item.jobId ?? null,
        item.createdAt,
        now,
      ],
    );
    return { ok: true as const };
  });

export const deleteGeneration = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ sessionId: z.string().min(4).max(80), id: z.string().min(4).max(80) }).parse(input),
  )
  .handler(async ({ data }) => {
    const db = await sql();
    await db.query(`delete from generations where id = $1 and session_id = $2`, [
      data.id,
      data.sessionId,
    ]);
    await db.query(`delete from studio_jobs where generation_id = $1 and session_id = $2`, [
      data.id,
      data.sessionId,
    ]);
    return { ok: true as const };
  });

export const saveJob = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        sessionId: z.string().min(4).max(80),
        id: z.string().min(4).max(80),
        generationId: z.string().min(4).max(80),
        kind: z.enum(["image", "video"]),
        status: z.enum(["pending", "done", "failed"]),
        requestId: z.string().max(200).optional(),
        error: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const db = await sql();
    const now = Date.now();
    await db.query(
      `insert into studio_jobs (
          id, session_id, generation_id, kind, status, request_id, error, created_at, updated_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        on conflict (id) do update set
          status = excluded.status,
          request_id = excluded.request_id,
          error = excluded.error,
          updated_at = excluded.updated_at`,
      [
        data.id,
        data.sessionId,
        data.generationId,
        data.kind,
        data.status,
        data.requestId ?? null,
        data.error ?? null,
        now,
        now,
      ],
    );
    return { ok: true as const };
  });

export const getQuota = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ sessionId: z.string().min(4).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { quotaFor } = await import("./ai");
    const engine = Boolean(process.env.XAI_API_KEY);
    return { ok: true as const, engine, ...quotaFor(data.sessionId) };
  });
