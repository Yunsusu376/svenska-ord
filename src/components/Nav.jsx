import './Nav.css';
import { getDueWords } from '../services/wordbank';

const TABS = [
  { key: 'search', label: 'Lookup',   icon: '/stickers/09.png'  },
  { key: 'bank',   label: 'My Words', icon: '/stickers/012.png' },
  { key: 'review', label: 'Review',   icon: '/stickers/010.png' },
];

export default function Nav({ active, onChange }) {
  const dueCount = getDueWords().length;

  return (
    <nav className="nav">
      {TABS.map(t => (
        <button
          key={t.key}
          className={`nav-tab ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          <img src={t.icon} className="nav-icon-img" alt={t.label} />
          <span className="nav-label">{t.label}</span>
          {t.key === 'review' && dueCount > 0 && (
            <span className="nav-badge">{dueCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
