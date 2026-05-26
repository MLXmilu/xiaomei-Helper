import { usePlanning } from '../../context/PlanningContext';

export function AssistantBubble() {
  const { logs, isLoading, plan } = usePlanning();
  if (!isLoading && !plan) return null;
  if (logs.length === 0) return null;

  return (
    <div className={`glass-panel p-5 flex gap-4 ${isLoading ? 'border-amber-100 bg-amber-50/20' : ''}`}>
      <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-xl">
        👩‍💼
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-extrabold text-slate-800">管家小美</span>
          <span className="text-xs text-slate-400">{isLoading ? '正在安排…' : '管家留言'}</span>
        </div>
        <div className="space-y-2">
          {logs.slice(-2).map((log, i) => (
            <p
              key={i}
              className={`text-sm leading-relaxed ${
                log.type === 'error'
                  ? 'text-red-600'
                  : log.type === 'replan'
                    ? 'text-amber-800 font-medium bg-amber-50 p-2 rounded-xl'
                    : 'text-slate-600'
              }`}
            >
              {log.message}
              {isLoading && i === logs.slice(-2).length - 1 && (
                <span className="inline-flex ml-1">
                  {[0, 0.2, 0.4].map(d => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce mx-0.5"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </span>
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
