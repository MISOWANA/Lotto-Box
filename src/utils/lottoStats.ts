import type { DrawResult, LottoStats } from '../types/lotto';

function makeFreqMap(draws: DrawResult[]): Record<number, number> {
  const freq: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) freq[i] = 0;
  for (const d of draws) {
    for (const n of d.numbers) freq[n] = (freq[n] ?? 0) + 1;
  }
  return freq;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function buildStats(draws: DrawResult[]): LottoStats {
  if (draws.length === 0) {
    return {
      numberFrequencyAll: {},
      numberFrequencyRecent30: {},
      numberFrequencyRecent100: {},
      oddEvenDistribution: {},
      sumDistribution: [],
      sectionDistribution: {},
      consecutivePatternCount: 0,
      lowHighDistribution: { low: 0, high: 0 },
      totalDraws: 0,
      sumAvg: 100,
      sumStdDev: 30,
    };
  }

  const recent30 = draws.slice(-30);
  const recent100 = draws.slice(-100);

  const oddEvenDist: Record<string, number> = {};
  const sectionDist: Record<string, number> = {
    '1-9': 0, '10-19': 0, '20-29': 0, '30-39': 0, '40-45': 0,
  };
  const sums: number[] = [];
  let consecutiveCount = 0;
  let lowCount = 0;
  let highCount = 0;

  for (const d of draws) {
    const nums = [...d.numbers].sort((a, b) => a - b);
    const odds = nums.filter((n) => n % 2 !== 0).length;
    const evens = 6 - odds;
    const key = `${odds}:${evens}`;
    oddEvenDist[key] = (oddEvenDist[key] ?? 0) + 1;

    for (const n of nums) {
      if (n <= 9) sectionDist['1-9']++;
      else if (n <= 19) sectionDist['10-19']++;
      else if (n <= 29) sectionDist['20-29']++;
      else if (n <= 39) sectionDist['30-39']++;
      else sectionDist['40-45']++;
    }

    const sum = nums.reduce((a, b) => a + b, 0);
    sums.push(sum);

    let hasConsecutive = false;
    for (let i = 0; i < nums.length - 2; i++) {
      if (nums[i + 1] === nums[i] + 1 && nums[i + 2] === nums[i] + 2) {
        hasConsecutive = true;
        break;
      }
    }
    if (hasConsecutive) consecutiveCount++;

    const low = nums.filter((n) => n <= 22).length;
    const high = nums.filter((n) => n > 22).length;
    lowCount += low;
    highCount += high;
  }

  const sumAvg = sums.reduce((a, b) => a + b, 0) / sums.length;

  return {
    numberFrequencyAll: makeFreqMap(draws),
    numberFrequencyRecent30: makeFreqMap(recent30),
    numberFrequencyRecent100: makeFreqMap(recent100),
    oddEvenDistribution: oddEvenDist,
    sumDistribution: sums,
    sectionDistribution: sectionDist,
    consecutivePatternCount: consecutiveCount,
    lowHighDistribution: { low: lowCount, high: highCount },
    totalDraws: draws.length,
    sumAvg,
    sumStdDev: stdDev(sums),
  };
}

export function getTopNumbers(freq: Record<number, number>, topN = 10): number[] {
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([n]) => Number(n));
}

export function getSection(n: number): string {
  if (n <= 9) return '1-9';
  if (n <= 19) return '10-19';
  if (n <= 29) return '20-29';
  if (n <= 39) return '30-39';
  return '40-45';
}
