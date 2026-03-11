import { Movie, MovieVector, UserResponse } from "@/types/schemas";
import { workerEvents } from "@/types/constants";
import { normalize } from "@/lib/helpers";
import * as tf from "@tensorflow/tfjs";

let _model: tf.LayersModel | null = null;
let _context: ContextType | null = null;

const API_BASE = self.location.origin;

type ContextType = {
  minAgeRating: number;
  maxAgeRating: number;
  users: UserResponse[];
  movies: Movie[];
  genreIndex: Record<string, number>;
  ageRatingIndex: Record<number, number>;
  directorIndex: Record<string, number>;
  movieAvgAgeNorm: Record<string, number>;
  minAge: number;
  maxAge: number;
  numGenres: number;
  numAgeRatings: number;
  numDirectors: number;
  dimensions: number;
  movieVectors?: { title: string; meta: Movie; vector: number[] }[];
}

const WEIGHTS = {
  genre: 0.4,
  ageRating: 0.3,
  director: 0.2,
  age: 0.1
}

async function loadUsers() {
  const res = await fetch(`${API_BASE}/api/users`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()) as UserResponse[];
}

async function loadMovies(limit = 200, offset = 0): Promise<Movie[]> {
  const res = await fetch(
    `${API_BASE}/api/movies?limit=${limit}&offset=${offset}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const { data } = (await res.json()) as { data: Movie[] };
  return data;
}

function makeContext(movies: Movie[], users: UserResponse[]): ContextType {
  const ages = users.map((u) => u.age ?? 0);
  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);
  const minAgeRating = Math.min(...movies.map(movie => movie.age_rating));
  const maxAgeRating = Math.max(...movies.map(movie => movie.age_rating));

  const genres = [...new Set(movies.map((m) => m.genre).filter(Boolean))] as string[];
  const genreIndex = Object.fromEntries(genres.map((g, i) => [g, i]));

  const ageRatings = [...new Set(movies.map(movie => movie.age_rating))]
  const ageRatingIndex = Object.fromEntries(ageRatings.map((r, i) => [r, i]));

  const directors = [...new Set(movies.map((m) => m.director).filter(Boolean))] as string[];
  const directorIndex = Object.fromEntries(directors.map((d, i) => [d, i]));

  const midAge = (minAge + maxAge) / 2;
  const ageSums: Record<string, number> = {}
  const ageCounts: Record<string, number> = {}

  users.forEach((user) => {
    user.liked_movies.forEach((movie) => {
      ageSums[movie.title] = (ageSums[movie.title] || 0) + (user.age ?? 0);
      ageCounts[movie.title] = (ageCounts[movie.title] || 0) + 1;
    })
  })

  const movieAvgAgeNorm = Object.fromEntries(
    movies.map(movie => {
      const avg = ageCounts[movie.title] ?
      ageSums[movie.title] / ageCounts[movie.title] : midAge;

      return [movie.title, normalize(avg, minAge, maxAge)]
    })
  )

  return {
    minAgeRating,
    maxAgeRating,
    users,
    movies,
    genreIndex,
    ageRatingIndex,
    directorIndex,
    movieAvgAgeNorm,
    minAge,
    maxAge,
    numGenres: genres.length,
    numAgeRatings: ageRatings.length,
    numDirectors: directors.length,
    // Tamanho do vetor de cada filme: 1 (age_rating) + 1 (age) + genre one-hot + director one-hot
    dimensions: 2 + Math.max(1, genres.length) + Math.max(1, directors.length),
  };
}

const oneHotWeight = (index: number, length: number, weight: number) =>
  tf.oneHot(index, length).cast('float32').mul(weight);

function encodeUser(user: UserResponse, context: ContextType) {
  const liked = Array.isArray(user.liked_movies) ? user.liked_movies : [];
  if (liked.length > 0) {
    return tf.stack(
      liked.map((movie) => encodeMovie(movie, context))
    ).mean(0)
    .reshape([1, context.dimensions
    ])
  }
}

function encodeMovie(movie: Movie, context: ContextType) {
  const ar = movie.age_rating ?? context.minAgeRating;
  const arNorm = context.maxAgeRating > context.minAgeRating
    ? normalize(ar, context.minAgeRating, context.maxAgeRating)
    : 0.5;
  const age_rating = tf.tensor1d([arNorm * WEIGHTS.ageRating])

  const age = tf.tensor1d([
    (context.movieAvgAgeNorm[movie.title] ?? 0.5) * WEIGHTS.age
  ])

  const genre = oneHotWeight(
    context.genreIndex[movie.genre] ?? 0, 
    Math.max(1, context.numGenres), 
    WEIGHTS.genre)

  const director = oneHotWeight(
    context.directorIndex[movie.director] ?? 0, 
    Math.max(1, context.numDirectors), 
    WEIGHTS.director)

  return tf.concat([age_rating, age, genre.flatten(), director.flatten()], 0) as tf.Tensor1D;
}

function createTrainingData(context: ContextType): { xs: tf.Tensor2D; ys: tf.Tensor2D; inputDimension: number } | null {
  const inputs: number[][] = [];
  const labels: number[] = [];

  context.users.forEach(user => {
    const userVector = encodeUser(user, context);
    if (!userVector) return;
    const userData = Array.from(userVector.dataSync());
    context.movieVectors?.forEach((mv) => {
      const movieVector = Array.from(encodeMovie(mv.meta, context).dataSync());
      const label = user.liked_movies.some((m) => m.id === mv.meta.id) ? 1 : 0;
      inputs.push([...userData, ...movieVector]);
      labels.push(label);
    });
  });

  if (inputs.length === 0) return null;

  return {
    xs: tf.tensor2d(inputs),
    ys: tf.tensor2d(labels, [labels.length, 1]),
    inputDimension: context.dimensions * 2
    // tamanho = userVector + movieVector
  }
}

async function configureNeuralNetandTrain(trainData: { xs: tf.Tensor2D; ys: tf.Tensor2D; inputDimension: number }) {
  const model = tf.sequential();

  model.add(tf.layers.dense({ 
    units: 120, 
    inputShape: [trainData.inputDimension],
    activation: 'relu'
  }));

  model.add(tf.layers.dense({ 
    units: 64, 
    activation: 'relu'
  }));

  model.add(tf.layers.dense({ 
    units: 32,
    activation: 'relu'
  }));

  model.add(tf.layers.dense({ 
    units: 1,
    activation: 'sigmoid',
  }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  await model.fit(trainData.xs, trainData.ys, {
    epochs: 100,
    batchSize: 32,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        postMessage({ type: workerEvents.trainingLog, epoch, loss: logs?.loss, accuracy: logs?.accuracy });
      }
    }
  });

  return model;
}

async function trainModel() {
  postMessage({ type: workerEvents.progressUpdate, progress: 50 });
  const users = await loadUsers();
  const movies = await loadMovies();
  const context = makeContext(movies, users);
  context.movieVectors = movies.map(movie => {
    return {
      title: movie.title,
      meta: { ...movie },
      vector: Array.from(encodeMovie(movie, context).dataSync())
    }
  })

  const vectors = context.movieVectors.map(({ meta, vector }) => ({
    movie_id: meta.id,
    vector,
  }));

  const trainData = createTrainingData(context);
  if (!trainData) return;
  _model = await configureNeuralNetandTrain(trainData);
  _context = context;

  const res = await fetch(`${API_BASE}/api/movies/vectors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vectors }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to save vectors: ${res.status}`);
  }

  postMessage({ type: workerEvents.trainingComplete, updated: vectors.length });
}


async function recommend(data: { userId?: number; user?: { id?: number; userId?: number } }) {
  const userId = data.userId ?? data.user?.id ?? data.user?.userId;
  console.log("[worker] recommend chamado, userId:", userId, "data:", data);
  if (userId == null) return;
  try {
    if (_model && _context) {
      console.log("[recommend] Usando modelo neural");
      const users = await loadUsers();
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      const userVector = encodeUser(user, _context);
      if (!userVector) return;
      const userData = Array.from(userVector.dataSync());
      const likedIds = new Set(
        (Array.isArray(user.liked_movies) ? user.liked_movies : []).map((m) => m.id)
      );
      const candidates = _context.movieVectors?.filter((mv) => !likedIds.has(mv.meta.id)) ?? [];
      const inputs: number[][] = [];
      const metas: { meta: Movie }[] = [];
      for (const mv of candidates) {
        const movieVector = Array.from(encodeMovie(mv.meta, _context).dataSync());
        inputs.push([...userData, ...movieVector]);
        metas.push({ meta: mv.meta });
      }
      if (inputs.length === 0) {
        postMessage({ type: workerEvents.recommend, userId, recommendations: [] });
        return;
      }
      const preds = _model.predict(tf.tensor2d(inputs)) as tf.Tensor;
      const scores = Array.from(preds.dataSync());
      const MIN_SCORE = 0.4;
      const ranked = metas
        .map((mv, i) => ({ meta: mv.meta, score: scores[i] ?? 0 }))
        .filter(({ score }) => score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ meta }) => meta);
      postMessage({ type: workerEvents.recommend, userId, recommendations: ranked });
    } else {
      console.log("[recommend] Modelo não disponível, fallback []");
      postMessage({
        type: workerEvents.recommend,
        userId,
        recommendations: [],
      });
    }
  } catch (err) {
    console.error("Recommend error:", err);
    postMessage({ type: workerEvents.recommend, userId, recommendations: [] });
  }
}

const handlers = {
  [workerEvents.trainModel]: trainModel,
  [workerEvents.recommend]: recommend,
};

self.onmessage = (e: MessageEvent) => {
  const { action, ...data } = e.data;
  if (handlers[action]) handlers[action](data);
};
