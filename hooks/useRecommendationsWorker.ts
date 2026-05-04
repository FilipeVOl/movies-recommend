"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WorkerController } from "@/controller/WorkerController";
import Events from "@/types/Events";
import type { Movie } from "@/types/schemas";

type UseRecommendationsWorkerOptions = {
  selectedUserId: number | null;
};

export const useRecommendationsWorker = ({
  selectedUserId,
}: UseRecommendationsWorkerOptions) => {
  const [trainingProgress, setTrainingProgress] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);

  const controllerRef = useRef<WorkerController | null>(null);
  const eventsRef = useRef<Events | null>(null);
  const selectedUserIdRef = useRef<number | null>(null);
  selectedUserIdRef.current = selectedUserId;

  useEffect(() => {
    const events = new Events();
    eventsRef.current = events;
    const worker = new Worker(
      new URL("../worker/modelTrainingWorker.ts", import.meta.url)
    );
    const controller = WorkerController.init({ worker, events });
    controllerRef.current = controller;

    const cleanups = [
      events.onProgressUpdate((progress) => setTrainingProgress(progress)),
      events.onTrainingComplete(() => setTrainingProgress(null)),
      events.onRecommendationsReady((data) => {
        if (data.userId === selectedUserIdRef.current) {
          setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
        }
      }),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      controller.terminate();
    };
  }, []);

  useEffect(() => {
    if (selectedUserId && trainingProgress === null && controllerRef.current) {
      eventsRef.current?.dispatchRecommend({ userId: selectedUserId });
    }
  }, [selectedUserId, trainingProgress]);

  useEffect(() => {
    setRecommendations([]);
  }, [selectedUserId]);

  const triggerTrain = useCallback(() => {
    setRecommendations([]);
    setTrainingProgress(0);
    controllerRef.current?.triggerTrain();
  }, []);

  return {
    trainingProgress,
    recommendations,
    triggerTrain,
  };
};

