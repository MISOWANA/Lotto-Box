import type { RecommendedSet } from '../types/lotto';
import NumberBall from './NumberBall';
import './RecommendationCard.css';

type Props = {
  set: RecommendedSet;
  index: number;
};

export default function RecommendationCard({ set, index }: Props) {
  return (
    <article className="rec-card">
      <div className="rec-card__header">
        <span className="rec-card__index">#{index + 1}</span>
        <span className="rec-card__score">점수 {set.score}</span>
      </div>

      <div className="rec-card__balls">
        {set.numbers.map((n) => (
          <NumberBall key={n} number={n} size="md" />
        ))}
      </div>

      <div className="rec-card__meta">
        <span className="rec-card__tag">{set.stats.oddEven}</span>
        <span className="rec-card__tag">합계 {set.stats.sum}</span>
        <span className="rec-card__tag">{set.stats.sectionSpread}</span>
        {set.stats.includesHighNumbers && (
          <span className="rec-card__tag rec-card__tag--green">고번호 포함</span>
        )}
      </div>

      {set.reasons.length > 0 && (
        <ul className="rec-card__reasons">
          {set.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
