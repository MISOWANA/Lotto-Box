import type { DrawResult, LottoStats, RecommendedSet, RecommendationOption } from '../types/lotto';
import { buildPastWinnerSet, applyFilters } from './lottoFilters';
import { scoreNumbers } from './lottoScoring';

function randomCombination(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  // Fisher-Yates partial shuffle for 6
  for (let i = 0; i < 6; i++) {
    const j = i + Math.floor(Math.random() * (45 - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 6).sort((a, b) => a - b);
}

// 두 조합이 너무 비슷하면 다양성 필터 (4개 이상 공통 번호)
function tooSimilar(a: number[], b: number[]): boolean {
  const setB = new Set(b);
  return a.filter((n) => setB.has(n)).length >= 4;
}

export function generateRecommendations(
  draws: DrawResult[],
  stats: LottoStats,
  options: RecommendationOption,
): RecommendedSet[] {
  // setCount 서버 측 재검증 — UI 우회 방어
  const safeSetCount = Math.min(10, Math.max(1, Math.floor(options.setCount)));
  const safeOptions = { ...options, setCount: safeSetCount };

  const winnerSet = buildPastWinnerSet(draws);
  const CANDIDATES = Math.min(80000, 50000 + safeOptions.setCount * 1000);

  const scored: (RecommendedSet & { _sort: number })[] = [];

  for (let i = 0; i < CANDIDATES; i++) {
    const numbers = randomCombination();
    if (!applyFilters(numbers, winnerSet, safeOptions)) continue;
    const { score, reasons, stats: rStats } = scoreNumbers(numbers, stats);
    scored.push({ numbers, score, reasons, stats: rStats, _sort: score });
  }

  // 점수 내림차순 정렬
  scored.sort((a, b) => b._sort - a._sort);

  // 다양성 필터: 상위 후보에서 겹치지 않는 것 선택
  const selected: RecommendedSet[] = [];
  for (const candidate of scored) {
    if (selected.length >= safeOptions.setCount) break;
    const tooClose = selected.some((s) => tooSimilar(s.numbers, candidate.numbers));
    if (!tooClose) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _sort, ...rest } = candidate;
      selected.push(rest);
    }
  }

  // 부족하면 다양성 조건 완화해서 채우기
  if (selected.length < options.setCount) {
    for (const candidate of scored) {
      if (selected.length >= safeOptions.setCount) break;
      const alreadyIn = selected.some((s) => s.numbers.join(',') === candidate.numbers.join(','));
      if (!alreadyIn) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _sort, ...rest } = candidate;
        selected.push(rest);
      }
    }
  }

  return selected;
}
