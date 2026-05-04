import { events } from "./constants";
import type {
    UIEventPayloadMap,
    ProgressUpdateEventPayload,
    RecommendEventPayload,
    RecommendationsReadyEventPayload,
    TrainingCompleteEventPayload,
    TrainingLogEventPayload,
} from "./worker";

export default class Events {
    private on<K extends keyof UIEventPayloadMap>(
        eventName: K,
        callback: (data: UIEventPayloadMap[K]) => void
    ) {
        const handler = (event: Event) => {
            callback((event as CustomEvent<UIEventPayloadMap[K]>).detail);
        };
        document.addEventListener(eventName, handler);
        return () => document.removeEventListener(eventName, handler);
    }

    private dispatch<K extends keyof UIEventPayloadMap>(eventName: K, data: UIEventPayloadMap[K]) {
        document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }

    onTrainingComplete(callback: (data: TrainingCompleteEventPayload) => void) {
        return this.on(events.trainingComplete, callback);
    }
    dispatchTrainingComplete(data: TrainingCompleteEventPayload) {
        this.dispatch(events.trainingComplete, data);
    }

    onRecommend(callback: (data: RecommendEventPayload) => void) {
        return this.on(events.recommend, callback);
    }
    dispatchRecommend(data: RecommendEventPayload) {
        this.dispatch(events.recommend, data);
    }

    onRecommendationsReady(callback: (data: RecommendationsReadyEventPayload) => void) {
        return this.on(events.recommendationsReady, callback);
    }
    dispatchRecommendationsReady(data: RecommendationsReadyEventPayload) {
        this.dispatch(events.recommendationsReady, data);
    }

    onTrainModel(callback: (data: undefined) => void) {
        return this.on(events.modelTrain, callback);
    }
    dispatchTrainModel() {
        this.dispatch(events.modelTrain, undefined);
    }

    onTFVisLogs(callback: (data: TrainingLogEventPayload) => void) {
        return this.on(events.tfvisLogs, callback);
    }
    dispatchTFVisLogs(data: TrainingLogEventPayload) {
        this.dispatch(events.tfvisLogs, data);
    }

    onTFVisorData(callback: (data: unknown) => void) {
        return this.on(events.tfvisData, callback);
    }
    dispatchTFVisorData(data: unknown) {
        this.dispatch(events.tfvisData, data);
    }

    onProgressUpdate(callback: (data: ProgressUpdateEventPayload) => void) {
        return this.on(events.modelProgressUpdate, callback);
    }
    dispatchProgressUpdate(progressData: ProgressUpdateEventPayload) {
        this.dispatch(events.modelProgressUpdate, progressData);
    }

    onUserSelected(callback: (data: unknown) => void) {
        return this.on(events.userSelected, callback);
    }
    dispatchUserSelected(data: unknown) {
        this.dispatch(events.userSelected, data);
    }

    onUsersUpdated(callback: (data: unknown) => void) {
        return this.on(events.usersUpdated, callback);
    }
    dispatchUsersUpdated(data: unknown) {
        this.dispatch(events.usersUpdated, data);
    }

    onPurchaseAdded(callback: (data: unknown) => void) {
        return this.on(events.purchaseAdded, callback);
    }
    dispatchPurchaseAdded(data: unknown) {
        this.dispatch(events.purchaseAdded, data);
    }

    onPurchaseRemoved(callback: (data: unknown) => void) {
        return this.on(events.purchaseRemoved, callback);
    }
    dispatchEventPurchaseRemoved(data: unknown) {
        this.dispatch(events.purchaseRemoved, data);
    }
}
