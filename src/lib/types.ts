export type ResultKind = "human" | "photo" | "look" | "avatar3d" | "motion";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export type ResultStatus = "pending" | "ready" | "error";

export type ResultItem = {
  id: string;
  kind: ResultKind;
  title: string;
  prompt: string;
  aspect: AspectRatio;
  createdAt: number;
  favorite: boolean;
  status: ResultStatus;
  error?: string;
  remoteUrl?: string;
  videoUrl?: string;
  sourceId?: string;
  jobId?: string;
};

export type GenerateOk = {
  ok: true;
  images: { dataUrl: string; remoteUrl?: string }[];
};

export type GenerateErr = { ok: false; error: string };

export type GenerateResult = GenerateOk | GenerateErr;

export type VideoStartOk = { ok: true; requestId: string };
export type VideoPollOk = {
  ok: true;
  status: "pending" | "done" | "failed";
  videoUrl?: string;
  error?: string;
};
