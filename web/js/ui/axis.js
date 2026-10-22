const NICE_STEPS = [1, 2, 2.5, 5, 10];

export function niceAxis(values, { headroom = 0, negativeHeadroom = headroom, minimumSpan = 10_000 } = {}) {
  let minimum = Math.min(0, ...values);
  let maximum = Math.max(0, ...values);
  const span = Math.max(maximum - minimum, minimumSpan);
  minimum -= minimum < 0 ? span * negativeHeadroom : 0;
  maximum += maximum > 0 ? span * headroom : 0;
  if (maximum - minimum < minimumSpan) {
    if (minimum >= 0) maximum = Math.max(maximum, minimumSpan);
    else {
      const halfSpan = minimumSpan / 2;
      minimum = Math.min(minimum, -halfSpan);
      maximum = Math.max(maximum, halfSpan);
    }
  }

  const targetStep = (maximum - minimum) / 5;
  const power = 10 ** Math.floor(Math.log10(targetStep));
  const candidates = [-1, 0, 1].flatMap((offset) => NICE_STEPS.map((step) => step * power * (10 ** offset)))
    .filter((step) => Number.isInteger(step) && step >= 1);
  const options = candidates.map((step) => {
    const low = Math.floor(minimum / step) * step;
    const high = Math.ceil(maximum / step) * step;
    return {step, low, high, intervalCount:Math.round((high - low) / step)};
  });
  options.sort((a, b) => Math.abs(a.intervalCount - 5) - Math.abs(b.intervalCount - 5));
  const [{step, low, high}] = options;

  const ticks = [];
  const intervalCount = Math.round((high - low) / step);
  for (let index = 0; index <= intervalCount; index++) ticks.push(low + index * step);
  return { minimum: low, maximum: high, step, ticks };
}

export function formatAxisEuros(cents, step) {
  const needsCents = Math.abs(step) < 100 || step % 100 !== 0;
  const euros = cents / 100;
  const compact = Math.abs(euros) >= 1_000_000;
  return new Intl.NumberFormat('de-DE', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 2 : (needsCents ? 2 : 0),
    minimumFractionDigits: needsCents && !compact ? 2 : 0,
  }).format(euros);
}
