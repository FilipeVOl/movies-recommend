import { events } from "./constants";

export default class Events {
    onTrainingComplete(callback: (data: unknown) => void) {
        document.addEventListener(events.trainingComplete, (event) => {
            return callback((event as CustomEvent).detail);
        });
    }
    dispatchTrainingComplete(data: unknown) {
        document.dispatchEvent(new CustomEvent(events.trainingComplete, { detail: data }));
    }

    onRecommend(callback: (data: unknown) => void) {
        document.addEventListener(events.recommend, (event) => {
            return callback((event as CustomEvent).detail);
        });
    }
    dispatchRecommend(data: unknown) {
        document.dispatchEvent(new CustomEvent(events.recommend, { detail: data }));
    }

    onRecommendationsReady(callback: (data: unknown) => void) {
        document.addEventListener(events.recommendationsReady, (event) => {
            return callback((event as CustomEvent).detail);
        });
    }
    dispatchRecommendationsReady(data: unknown) {
        document.dispatchEvent(new CustomEvent(events.recommendationsReady, { detail: data }));
    }

    onTrainModel(callback: (data: unknown) => void) {
        document.addEventListener(events.modelTrain, (event) => {
            return callback((event as CustomEvent).detail);
        });
    }
    dispatchTrainModel(data: unknown) {
        document.dispatchEvent(new CustomEvent(events.modelTrain, { detail: data }));
    }

    onTFVisLogs(callback: (data: unknown) => void) {
        document.addEventListener(events.tfvisLogs, (event) => {
            return callback((event as CustomEvent).detail);
        });
    }
    dispatchTFVisLogs(data: unknown) {
        document.dispatchEvent(new CustomEvent(events.tfvisLogs, { detail: data }));
    }

    onTFVisorData(callback: (data: unknown) => void) {
        document.addEventListener(events.tfvisData, (event) => {
            return callback((event as CustomEvent).detail);
        });
    }
    dispatchTFVisorData(data: unknown) {
        document.dispatchEvent(new CustomEvent(events.tfvisData, { detail: data }));
    }

    onProgressUpdate(callback: (data: any) => void) {
        document.addEventListener(events.modelProgressUpdate, (event) => {
            return callback((event as CustomEvent).detail);
        });
    }
    dispatchProgressUpdate(progressData: unknown) {
        document.dispatchEvent(new CustomEvent(events.modelProgressUpdate, { detail: progressData }));
    }

    onUserSelected(callback: (data: unknown) => void) {
        document.addEventListener(events.userSelected, (event) => {
            return callback((event as CustomEvent).detail);
        });
    }
    dispatchUserSelected(data: unknown) {
        document.dispatchEvent(new CustomEvent(events.userSelected, { detail: data }));
    }

    onUsersUpdated(callback: (data: unknown) => void) {
        document.addEventListener(events.usersUpdated, (event) => {
            return callback((event as CustomEvent).detail);
        });
    }
    dispatchUsersUpdated(data: unknown) {
        document.dispatchEvent(new CustomEvent(events.usersUpdated, { detail: data }));
    }

    onPurchaseAdded(callback: (data: unknown) => void) {
        document.addEventListener(events.purchaseAdded, (event) => {
            return callback((event as CustomEvent).detail);
        });
    }
    dispatchPurchaseAdded(data: unknown) {
        document.dispatchEvent(new CustomEvent(events.purchaseAdded, { detail: data }));
    }

    onPurchaseRemoved(callback: (data: unknown) => void) {
        document.addEventListener(events.purchaseRemoved, (event) => {
            return callback((event as CustomEvent).detail);
        });
    }
    dispatchEventPurchaseRemoved(data: unknown) {
        document.dispatchEvent(new CustomEvent(events.purchaseRemoved, { detail: data }));
    }
}
