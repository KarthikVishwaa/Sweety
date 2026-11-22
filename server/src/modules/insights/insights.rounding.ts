/**
 * Whole-number percentages of `counts` that add up to exactly 100 (largest remainder method): every
 * share is rounded down, then the shares with the biggest leftover each get one more until 100 is reached.
 * All zeros when there is nothing to share.
 */
export function percentages(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return counts.map(() => 0);

  const shares = counts.map((count, index) => {
    const exact = (count / total) * 100;
    return { index, floor: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let left = 100 - shares.reduce((sum, share) => sum + share.floor, 0);
  const result = shares.map((share) => share.floor);
  const byRemainder = [...shares].sort(
    (a, b) => b.remainder - a.remainder || (counts[b.index] ?? 0) - (counts[a.index] ?? 0),
  );
  for (const { index } of byRemainder) {
    if (left === 0) break;
    result[index] = (result[index] ?? 0) + 1;
    left--;
  }
  return result;
}

export const roundToOneDecimal = (value: number): number => Math.round(value * 10) / 10;
