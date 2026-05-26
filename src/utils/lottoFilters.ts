import type { DrawResult, RecommendationOption } from '../types/lotto';

// 과거 1등 조합 Set (정렬된 키로 빠른 조회)
export function buildPastWinnerSet(draws: DrawResult[]): Set<string> {
  const set = new Set<string>();
  for (const d of draws) {
    const key = [...d.numbers].sort((a, b) => a - b).join(',');
    set.add(key);
  }
  return set;
}

export function isDuplicatePastWinner(numbers: number[], winnerSet: Set<string>): boolean {
  return winnerSet.has([...numbers].sort((a, b) => a - b).join(','));
}

export function hasThreeOrMoreConsecutive(numbers: number[]): boolean {
  const sorted = [...numbers].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 2; i++) {
    if (sorted[i + 1] === sorted[i] + 1 && sorted[i + 2] === sorted[i] + 2) return true;
  }
  return false;
}

// 일의 자리 3개 이상 동일
export function hasTailClustering(numbers: number[]): boolean {
  const tails = numbers.map((n) => n % 10);
  const freq: Record<number, number> = {};
  for (const t of tails) freq[t] = (freq[t] ?? 0) + 1;
  return Object.values(freq).some((c) => c >= 3);
}

// 생일 패턴: 1~31 번호가 5개 이상
export function isBirthdayPattern(numbers: number[]): boolean {
  return numbers.filter((n) => n <= 31).length >= 5;
}

// 배수 패턴 (7의 배수, 5의 배수 등 규칙적 간격)
export function isMultiplePattern(numbers: number[]): boolean {
  const sorted = [...numbers].sort((a, b) => a - b);
  // 6개 전부 같은 공차를 가지는 등차수열 검사
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) diffs.push(sorted[i] - sorted[i - 1]);
  const allSame = diffs.every((d) => d === diffs[0]);
  if (allSame && diffs[0] > 0) return true;

  // 특정 배수 집합 (7, 14, 21, 28, 35, 42)
  const known = [
    [7, 14, 21, 28, 35, 42],
    [5, 10, 15, 20, 25, 30],
    [6, 12, 18, 24, 30, 36],
  ];
  const key = sorted.join(',');
  return known.some((p) => p.join(',') === key);
}

// 한 구간(1-9, 10-19, 20-29, 30-39, 40-45)에 5개 이상 몰림
export function isSectionClustered(numbers: number[]): boolean {
  const sections = [0, 0, 0, 0, 0];
  for (const n of numbers) {
    if (n <= 9) sections[0]++;
    else if (n <= 19) sections[1]++;
    else if (n <= 29) sections[2]++;
    else if (n <= 39) sections[3]++;
    else sections[4]++;
  }
  return sections.some((c) => c >= 5);
}

export function applyFilters(
  numbers: number[],
  winnerSet: Set<string>,
  options: RecommendationOption,
): boolean {
  // 항상 적용
  if (isDuplicatePastWinner(numbers, winnerSet)) return false;
  if (isMultiplePattern(numbers)) return false;
  if (isSectionClustered(numbers)) return false;
  if (hasTailClustering(numbers)) return false;

  // 옵션 기반
  if (options.excludeConsecutive3 && hasThreeOrMoreConsecutive(numbers)) return false;
  if (options.excludeBirthdayPattern && isBirthdayPattern(numbers)) return false;

  return true;
}
