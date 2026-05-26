import type { DrawResult } from '../types/lotto';
import NumberBall from './NumberBall';
import './DrawSummary.css';

type Props = {
  draw: DrawResult;
  onRefresh?: () => void;
  refreshing?: boolean;
};

function formatKRW(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000);
    const man = Math.floor((amount % 100_000_000) / 10_000);
    return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
  }
  if (amount >= 10_000) return `${Math.floor(amount / 10_000).toLocaleString()}만원`;
  return `${amount.toLocaleString()}원`;
}

export default function DrawSummary({ draw, onRefresh, refreshing }: Props) {
  return (
    <section className="draw-summary">
      <div className="draw-summary__header">
        <div>
          <span className="draw-summary__round">{draw.drwNo}회</span>
          <span className="draw-summary__date">{draw.drwNoDate} 추첨</span>
        </div>
        {onRefresh && (
          <button
            className="btn-refresh"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="최신 정보 새로고침"
          >
            {refreshing ? '조회 중…' : '↻ 새로고침'}
          </button>
        )}
      </div>

      <div className="draw-summary__balls">
        {draw.numbers.map((n) => (
          <NumberBall key={n} number={n} size="lg" />
        ))}
        <span className="draw-summary__plus">+</span>
        <NumberBall number={draw.bonusNo} size="lg" bonus />
      </div>

      <div className="draw-summary__prize">
        <div className="prize-item">
          <span className="prize-item__label">1등 당첨자</span>
          <span className="prize-item__value">{draw.firstWinnerCount.toLocaleString()}명</span>
        </div>
        <div className="prize-item">
          <span className="prize-item__label">1인당 당첨금</span>
          <span className="prize-item__value prize-item__value--highlight">
            {formatKRW(draw.firstWinAmount)}
          </span>
        </div>
        <div className="prize-item">
          <span className="prize-item__label">총 1등 당첨금</span>
          <span className="prize-item__value">{formatKRW(draw.firstTotalAmount)}</span>
        </div>
      </div>
    </section>
  );
}
