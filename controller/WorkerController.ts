import { workerEvents } from "@/types/constants";
import Events from "@/types/Events";
import type {
    RecommendEventPayload,
    WorkerInboundMessage,
    WorkerOutboundMessage,
} from "@/types/worker";

type WorkerControllerDeps = {
    worker: Worker;
    events: Events;
};

export class WorkerController {
    #worker: Worker;
    #events: Events;
    #alreadyTrained = false;
    constructor({ worker, events }: WorkerControllerDeps) {
        this.#worker = worker;
        this.#events = events;
        this.#alreadyTrained = false;
        this.setupCallbacks();
    }

    static init(deps: { worker: Worker, events: Events }) {
        return new WorkerController(deps);
    }

    setupCallbacks() {
        this.#events.onTrainModel(() => {
            this.#alreadyTrained = false;
            this.triggerTrain();
        });
        this.#events.onTrainingComplete(() => {
            this.#alreadyTrained = true;
        });

        this.#events.onRecommend((data) => {
            if (!this.#alreadyTrained) {
                console.log("[WorkerController] recommend ignorado - modelo ainda não treinado");
                return;
            }
            console.log("[WorkerController] Enviando recommend ao worker", data);
            this.triggerRecommend(data);
        });

        const eventsToIgnoreLogs = new Set<string>([
            workerEvents.progressUpdate,
            workerEvents.trainingLog,
            workerEvents.tfVisData,
            workerEvents.tfVisLogs,
            workerEvents.trainingComplete,
        ]);
        this.#worker.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
            const payload = event.data;
            if (!eventsToIgnoreLogs.has(payload.type))
                console.log(payload);

            if (payload.type === workerEvents.progressUpdate) {
                this.#events.dispatchProgressUpdate(payload.progress);
            }

            if (payload.type === workerEvents.trainingComplete) {
                this.#events.dispatchTrainingComplete({ updated: payload.updated });
            }

            if (payload.type === workerEvents.tfVisData) {
                this.#events.dispatchTFVisorData(payload.data);
            }

            if (payload.type === workerEvents.trainingLog) {
                this.#events.dispatchTFVisLogs(payload);
            }
            if (payload.type === workerEvents.recommend) {
                this.#events.dispatchRecommendationsReady(payload);
            }
        };
    }

    triggerTrain() {
        const command: WorkerOutboundMessage = { action: workerEvents.trainModel };
        this.#worker.postMessage(command);
    }

    triggerRecommend(data: RecommendEventPayload) {
        const command: WorkerOutboundMessage = { action: workerEvents.recommend, userId: data.userId };
        this.#worker.postMessage(command);
    }

    terminate() {
        this.#worker.terminate();
    }
}