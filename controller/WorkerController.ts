import { workerEvents } from "@/types/constants";
import Events from "@/types/Events";

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
        this.init();
    }

    async init() {
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
            this.triggerRecommend(data as { userId?: number });
        });

        const eventsToIgnoreLogs = [
            workerEvents.progressUpdate,
            workerEvents.trainingLog,
            workerEvents.tfVisData,
            workerEvents.tfVisLogs,
            workerEvents.trainingComplete,
        ]
        this.#worker.onmessage = (event) => {
            if (!eventsToIgnoreLogs.includes(event.data.type))
                console.log(event.data);

            if (event.data.type === workerEvents.progressUpdate) {
                this.#events.dispatchProgressUpdate(event.data.progress);
            }

            if (event.data.type === workerEvents.trainingComplete) {
                this.#events.dispatchTrainingComplete(event.data);
            }

            // Handle tfvis data from the worker for initial visualization
            if (event.data.type === workerEvents.tfVisData) {
                this.#events.dispatchTFVisorData(event.data.data);
            }

            // Handle tfvis recommendation data
            if (event.data.type === workerEvents.trainingLog) {
                this.#events.dispatchTFVisLogs(event.data);
            }
            if (event.data.type === workerEvents.recommend) {
                this.#events.dispatchRecommendationsReady(event.data);
            }
        };
    }

    triggerTrain() {
        this.#worker.postMessage({ action: workerEvents.trainModel });
    }

    triggerRecommend(data: { userId?: number }) {
        this.#worker.postMessage({ action: workerEvents.recommend, user: data, userId: data.userId });
    }

    terminate() {
        this.#worker.terminate();
    }
}