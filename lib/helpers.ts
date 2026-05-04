const normalize = (value: number, min: number, max: number) => {
  const range = max - min;
  if (range === 0 || !Number.isFinite(range)) return 0.5;
  const result = (value - min) / range;
  return Number.isFinite(result) ? result : 0.5;
};

export { normalize };
