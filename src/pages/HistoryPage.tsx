import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Trash2 } from 'lucide-react';
import { usePlanning } from '../context/PlanningContext';
import { HISTORY_COPY } from '../constants/uiCopy';

const c = HISTORY_COPY;

export function HistoryPage() {
  const navigate = useNavigate();
  const { historyList, handleRestoreHistory, handleClearHistory } = usePlanning();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" />
            {c.pageTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{c.pageSubtitle}</p>
        </div>
        {historyList.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {c.clearAll}
          </button>
        )}
      </div>
      {historyList.length === 0 ? (
        <div className="glass-panel p-20 text-center">
          <div className="text-5xl mb-4">{c.emptyEmoji}</div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-2">{c.emptyTitle}</h3>
          <p className="text-sm text-slate-500 mb-8">{c.emptyDesc}</p>
          <button
            onClick={() => navigate('/planner')}
            className="px-6 py-3 rounded-xl bg-meituan text-slate-900 font-bold text-sm hover:bg-meituan-light transition-all"
          >
            {c.emptyCta}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {historyList.map(item => (
            <article
              key={item.id}
              className="glass-panel p-6 flex flex-col h-full min-h-[240px] hover:shadow-xl transition-shadow group"
            >
              <div className="flex items-start justify-between gap-3 shrink-0 mb-3">
                <span className="text-xs font-mono text-slate-400 tabular-nums">{item.timestamp}</span>
                <span className="text-lg font-extrabold font-mono text-amber-600 tabular-nums shrink-0">
                  �{item.plan.totalCost}
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-800 line-clamp-3 leading-relaxed shrink-0 mb-3 min-h-[4.5rem]">
                {item.query}
              </p>

              <div className="flex flex-wrap gap-1.5 content-start flex-1 min-h-[3.25rem] mb-4">
                {item.plan.timeline.slice(1, 4).map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium max-w-full truncate"
                  >
                    {t.node.name}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  handleRestoreHistory(item);
                  navigate('/planner');
                }}
                className="mt-auto w-full h-11 shrink-0 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold flex items-center justify-center gap-1.5 group-hover:bg-amber-100 transition-colors"
              >
                {c.restore}
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
