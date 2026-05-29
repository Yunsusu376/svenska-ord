import { useState, useEffect } from 'react';
import { getAddedCountByDate, todayStr } from '../services/wordbank';
import './WordCalendar.css';

export default function WordCalendar({ onSelectDate }) {
  const today = todayStr();
  const [cursor, setCursor]   = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [countMap, setCountMap] = useState({});

  useEffect(() => { getAddedCountByDate().then(setCountMap); }, []);

  const { year, month } = cursor;
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonth = () => setCursor(c => {
    const d = new Date(c.year, c.month - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setCursor(c => {
    const d = new Date(c.year, c.month + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const monthLabel = new Date(year, month, 1).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
  const blanks = Array(firstDay).fill(null);
  const days   = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function dateStr(day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const counts   = Object.values(countMap).filter(Boolean);
  const maxCount = counts.length ? Math.max(...counts) : 1;

  return (
    <div className="word-calendar">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-title">{monthLabel}</span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>

      <div className="cal-weekdays">
        {['Sön','Mån','Tis','Ons','Tor','Fre','Lör'].map(d => (
          <span key={d} className="cal-wd">{d}</span>
        ))}
      </div>

      <div className="cal-grid">
        {blanks.map((_, i) => <div key={`b${i}`} className="cal-cell empty" />)}
        {days.map(day => {
          const ds    = dateStr(day);
          const count = countMap[ds] || 0;
          const isToday  = ds === today;
          const hasWords = count > 0;
          const dotSize  = hasWords ? Math.max(6, Math.round(6 + (count / maxCount) * 10)) : 0;

          return (
            <div
              key={day}
              className={`cal-cell${isToday ? ' today' : ''}${hasWords ? ' has-words' : ''}`}
              onClick={() => hasWords && onSelectDate(ds)}
            >
              <span className="cal-day-num">{day}</span>
              {hasWords && (
                <span
                  className="cal-dot"
                  style={{ width: dotSize, height: dotSize }}
                  title={`${count} 个单词`}
                />
              )}
              {hasWords && <span className="cal-count">{count}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
