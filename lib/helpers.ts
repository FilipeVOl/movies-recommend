const normalize = (value: number, min: number, max: number) => {
  const range = max - min;
  if (range === 0 || !Number.isFinite(range)) return 0.5;
  const result = (value - min) / range;
  return Number.isFinite(result) ? result : 0.5;
};

/** Média de vetores para calcular query vector a partir dos liked movies */
function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = Math.max(...vectors.map((v) => v.length));
  const result = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < v.length; i++) result[i] += v[i];
  }
  for (let i = 0; i < dim; i++) result[i] /= vectors.length;
  return result;
}

export { normalize, averageVectors };
