import type { LottoStats, RecommendedSet } from '../types/lotto';
import { hasThreeOrMoreConsecutive, isBirthdayPattern } from './lottoFilters';

function getSection(n: number): string {
  if (n <= 9) return '1-9';
  if (n <= 19) return '10-19';
  if (n <= 29) return '20-29';
  if (n <= 39) return '30-39';
  return '40-45';
}

export function scoreNumbers(numbers: number[], stats: LottoStats): Omit<RecommendedSet, 'numbers'> {
  const sorted = [...numbers].sort((a, b) => a - b);
  const reasons: string[] = [];
  let score = 100;

  // A. 출현 빈도 점수
  const allFreq = stats.numberFrequencyAll;
  const totalDraws = stats.totalDraws || 1;
  const avgFreq = (totalDraws * 6) / 45;

  let freqScore = 0;
  for (const n of sorted) {
    const freq = allFreq[n] ?? 0;
    const ratio = freq / avgFreq;
    if (ratio < 0.6) freqScore += 3;       // 장기 미출현 소폭 가산
    else if (ratio > 1.6) freqScore -= 4;  // 과열 번호 감점
    else freqScore += 1;
  }
  score += freqScore;

  // 최근 30회 과열 감점
  const r30 = stats.numberFrequencyRecent30;
  const avgR30 = (30 * 6) / 45;
  let r30Penalty = 0;
  for (const n of sorted) {
    if ((r30[n] ?? 0) > avgR30 * 2.2) r30Penalty += 2;
  }
  score -= r30Penalty;

  // B. 분산 점수
  const sections = new Set(sorted.map(getSection));
  const spreadCount = sections.size;
  if (spreadCount >= 5) { score += 15; reasons.push('5개 구간 고른 분포'); }
  else if (spreadCount === 4) { score += 8; reasons.push('4개 구간 분포'); }
  else if (spreadCount <= 2) { score -= 12; }

  // C. 홀짝 균형
  const odds = sorted.filter((n) => n % 2 !== 0).length;
  const evens = 6 - odds;
  const oeStr = `홀${odds}/짝${evens}`;
  if (odds === 3 || odds === 4 || odds === 2) {
    score += 8;
    reasons.push(`홀짝 균형 (${oeStr})`);
  } else if (odds === 0 || odds === 6) {
    score -= 12;
  } else if (odds === 1 || odds === 5) {
    score -= 5;
  }

  // D. 합계 구간
  const sum = sorted.reduce((a, b) => a + b, 0);
  const sumAvg = stats.sumAvg || 100;
  const sumStd = stats.sumStdDev || 30;
  const zScore = Math.abs(sum - sumAvg) / sumStd;
  if (zScore < 0.5) { score += 12; reasons.push(`합계 ${sum} (중앙값 근접)`); }
  else if (zScore < 1.0) { score += 5; }
  else if (zScore > 2.0) { score -= 15; }
  else if (zScore > 1.5) { score -= 8; }

  // E. 연속수
  const hasConsec3 = hasThreeOrMoreConsecutive(sorted);
  if (hasConsec3) { score -= 10; }
  // 2연속 허용, 소폭 감점만
  let consec2 = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] === sorted[i] + 1) consec2++;
  }
  if (consec2 >= 2) score -= 4;

  // F. 끝수 몰림 이미 필터에서 제거되나, 2개까지 소폭 감점
  const tails = sorted.map((n) => n % 10);
  const tailFreq: Record<number, number> = {};
  for (const t of tails) tailFreq[t] = (tailFreq[t] ?? 0) + 1;
  const maxTail = Math.max(...Object.values(tailFreq));
  if (maxTail === 2) score -= 2;

  // G. 생일 패턴 감점 / 고번호 포함 가산
  if (isBirthdayPattern(sorted)) { score -= 8; }
  const highNums = sorted.filter((n) => n >= 32).length;
  if (highNums >= 2) { score += 6; reasons.push('고번호(32+) 2개 이상 포함'); }
  if (highNums >= 3) { score += 4; }

  // 최종 보정: 음수 방지
  score = Math.max(0, score);

  return {
    score,
    reasons,
    stats: {
      oddEven: oeStr,
      sum,
      sectionSpread: `${spreadCount}개 구간`,
      includesHighNumbers: highNums >= 2,
      duplicatedPastFirstPrize: false,
    },
  };
}
