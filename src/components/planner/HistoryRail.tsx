import { usePlanning } from '../../context/PlanningContext';

export function HistoryRail({ vertical = false }: { vertical?: boolean }) {
  const { historyList, plan, constraints, handleRestoreHistory, handleClearHistory } = usePlanning();
  if (historyList.length === 0) return null;

  return (
    <div className={`${vertical ? 'space-y-3' : 'space-y-2'}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          最近方案
        </span>
        <button onClick={handleClearHistory} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">清空</button>
      </div>
      <div className={vertical ? 'space-y-2' : 'flex gap-2 overflow-x-auto pb-1'}>
        {historyList.map(item => {
          const selected = plan && constraints && constraints.originalQuery === item.constraints.originalQuery;
          return (
            <button
              key={item.id}
              onClick={() => handleRestoreHistory(item)}
              className={`${vertical ? 'w-full text-left' : 'shrink-0'} px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                selected ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-200'
              }`}
            >
              <span className="line-clamp-1">{item.query}</span>
              <span className="text-xs text-amber-600 mt-1 block">¥{item.plan.totalCost} · {item.timestamp}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
