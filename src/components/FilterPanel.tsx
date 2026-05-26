import type { RecommendationOption } from '../types/lotto';
import './FilterPanel.css';

type Props = {
  options: RecommendationOption;
  onChange: (next: RecommendationOption) => void;
  onGenerate: () => void;
  generating: boolean;
};

export default function FilterPanel({ options, onChange, onGenerate, generating }: Props) {
  function update<K extends keyof RecommendationOption>(key: K, value: RecommendationOption[K]) {
    onChange({ ...options, [key]: value });
  }

  return (
    <section className="filter-panel">
      <h3 className="filter-panel__title">추천 옵션</h3>

      <div className="filter-panel__row">
        <label className="filter-panel__label" htmlFor="set-count">
          추천 세트 수
        </label>
        <div className="filter-panel__count-control">
          <button
            className="count-btn"
            onClick={() => update('setCount', Math.max(1, options.setCount - 1))}
            aria-label="세트 수 감소"
          >
            −
          </button>
          <span id="set-count" className="count-value">{options.setCount}</span>
          <button
            className="count-btn"
            onClick={() => update('setCount', Math.min(10, options.setCount + 1))}
            aria-label="세트 수 증가"
          >
            +
          </button>
        </div>
      </div>

      <div className="filter-panel__toggles">
        <label className="toggle">
          <input
            type="checkbox"
            checked={options.excludeBirthdayPattern}
            onChange={(e) => update('excludeBirthdayPattern', e.target.checked)}
          />
          <span className="toggle__track" />
          <span className="toggle__label">생일 패턴 제외 (1~31 편중)</span>
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={options.excludeConsecutive3}
            onChange={(e) => update('excludeConsecutive3', e.target.checked)}
          />
          <span className="toggle__track" />
          <span className="toggle__label">3연속수 제외</span>
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={options.excludePopularPattern}
            onChange={(e) => update('excludePopularPattern', e.target.checked)}
          />
          <span className="toggle__track" />
          <span className="toggle__label">대중 패턴 제외 강화</span>
        </label>
      </div>

      <button
        className="btn-generate"
        onClick={onGenerate}
        disabled={generating}
      >
        {generating ? '번호 생성 중…' : '번호 추출'}
      </button>
    </section>
  );
}
