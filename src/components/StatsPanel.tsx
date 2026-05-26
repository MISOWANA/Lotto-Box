import type { LottoStats } from '../types/lotto';
import './StatsPanel.css';

type Props = {
  stats: LottoStats;
};

const SECTIONS = ['1-9', '10-19', '20-29', '30-39', '40-45'] as const;

export default function StatsPanel({ stats }: Props) {
  const { numberFrequencyAll, numberFrequencyRecent30, totalDraws } = stats;

  const maxFreq = Math.max(...Object.values(numberFrequencyAll));
  const maxR30 = Math.max(...Object.values(numberFrequencyRecent30));

  return (
    <section className="stats-panel">
      <h2 className="stats-panel__title">번호별 출현 통계</h2>
      <p className="stats-panel__sub">전체 {totalDraws}회차 기준</p>

      <div className="stats-grid">
        {Array.from({ length: 45 }, (_, i) => i + 1).map((n) => {
          const all = numberFrequencyAll[n] ?? 0;
          const r30 = numberFrequencyRecent30[n] ?? 0;
          const pctAll = maxFreq > 0 ? (all / maxFreq) * 100 : 0;
          const pctR30 = maxR30 > 0 ? (r30 / maxR30) * 100 : 0;
          const color = getBallColor(n);
          return (
            <div key={n} className="stats-cell">
              <div className={`stats-cell__ball stats-cell__ball--${color}`}>{n}</div>
              <div className="stats-cell__bars">
                <div
                  className="stats-cell__bar stats-cell__bar--all"
                  style={{ width: `${pctAll}%` }}
                  title={`전체 ${all}회`}
                />
                <div
                  className="stats-cell__bar stats-cell__bar--r30"
                  style={{ width: `${pctR30}%` }}
                  title={`최근30회 ${r30}회`}
                />
              </div>
              <span className="stats-cell__count">{all}</span>
            </div>
          );
        })}
      </div>

      <div className="stats-legend">
        <span className="stats-legend__item stats-legend__item--all">전체 출현</span>
        <span className="stats-legend__item stats-legend__item--r30">최근 30회</span>
      </div>

      <h3 className="stats-panel__sub-title">구간별 분포</h3>
      <div className="section-dist">
        {SECTIONS.map((sec) => {
          const count = stats.sectionDistribution[sec] ?? 0;
          const total = Object.values(stats.sectionDistribution).reduce((a, b) => a + b, 0);
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={sec} className="section-dist__item">
              <span className="section-dist__label">{sec}</span>
              <div className="section-dist__bar-wrap">
                <div className="section-dist__bar" style={{ width: `${pct}%` }} />
              </div>
              <span className="section-dist__pct">{pct}%</span>
            </div>
          );
        })}
      </div>

      <h3 className="stats-panel__sub-title">홀짝 분포</h3>
      <div className="oddeven-dist">
        {Object.entries(stats.oddEvenDistribution)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([key, count]) => {
            const total = Object.values(stats.oddEvenDistribution).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={key} className="oddeven-dist__item">
                <span className="oddeven-dist__label">홀{key.split(':')[0]}/짝{key.split(':')[1]}</span>
                <span className="oddeven-dist__pct">{pct}%</span>
              </div>
            );
          })}
      </div>
    </section>
  );
}

function getBallColor(n: number): string {
  if (n <= 10) return 'yellow';
  if (n <= 20) return 'blue';
  if (n <= 30) return 'red';
  if (n <= 40) return 'gray';
  return 'green';
}
