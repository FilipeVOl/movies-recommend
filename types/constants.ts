const COLUMN_ALIASES = {
  movie_id: ["movie_id", "movieid", "id"],
  title: ["title", "name"],
  cast: ["cast"],
  crew: ["crew"],
} as const;

const events = {
  userSelected: 'user:selected',
  usersUpdated: 'users:updated',
  purchaseAdded: 'purchase:added',
  purchaseRemoved: 'purchase:remove',
  modelTrain: 'training:train',
  trainingComplete: 'training:complete',

  modelProgressUpdate: 'model:progress-update',
  recommendationsReady: 'recommendations:ready',
  recommend: 'recommend',
  tfvisData: 'tfvis:data',
  tfvisLogs: 'tfvis:logs',
}

const workerEvents = {
  trainingComplete: 'training:complete',
  trainModel: 'train:model',
  recommend: 'recommend',
  trainingLog: 'training:log',
  progressUpdate: 'progress:update',
  tfVisData: 'tfvis:data',
  tfVisLogs: 'tfvis:logs',
}

const BATCH_SIZE = 100;

export { COLUMN_ALIASES, BATCH_SIZE, events, workerEvents };
