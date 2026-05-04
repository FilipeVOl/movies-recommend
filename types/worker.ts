import type { Movie } from "@/types/schemas";

export type RecommendEventPayload = { userId: number };
export type TrainingCompleteEventPayload = { updated: number };
export type RecommendationsReadyEventPayload = {
  type: "recommend";
  userId: number;
  recommendations: Movie[];
};
export type TrainingLogEventPayload = {
  type: "training:log";
  epoch: number;
  loss?: number;
  accuracy?: number;
};
export type ProgressUpdateEventPayload = number;

export type UIEventPayloadMap = {
  "training:complete": TrainingCompleteEventPayload;
  "recommend": RecommendEventPayload;
  "recommendations:ready": RecommendationsReadyEventPayload;
  "training:train": undefined;
  "tfvis:logs": TrainingLogEventPayload;
  "tfvis:data": unknown;
  "model:progress-update": ProgressUpdateEventPayload;
  "user:selected": unknown;
  "users:updated": unknown;
  "purchase:added": unknown;
  "purchase:remove": unknown;
};

export type WorkerOutboundMessage =
  | { action: "train:model" }
  | { action: "recommend"; userId: number };

export type WorkerInboundMessage =
  | { type: "progress:update"; progress: number }
  | { type: "training:complete"; updated: number }
  | { type: "tfvis:data"; data: unknown }
  | { type: "tfvis:logs"; data: unknown }
  | { type: "training:log"; epoch: number; loss?: number; accuracy?: number }
  | { type: "recommend"; userId: number; recommendations: Movie[] };

