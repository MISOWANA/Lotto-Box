import type { AppTab } from '../types/lotto';
import './TabBar.css';

const TABS: { id: AppTab; label: string }[] = [
  { id: 'main', label: '번호 추천' },
  { id: 'stats', label: '통계' },
  { id: 'history', label: '회차 조회' },
];

type Props = {
  active: AppTab;
  onChange: (tab: AppTab) => void;
};

export default function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tab-bar" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className={`tab-bar__btn${active === tab.id ? ' tab-bar__btn--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
