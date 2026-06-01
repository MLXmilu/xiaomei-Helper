import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Trash2, MessageCircle, CheckSquare, Square } from 'lucide-react';
import { usePlanning } from '../context/PlanningContext';
import { HISTORY_COPY } from '../constants/uiCopy';

const c = HISTORY_COPY;

function formatAiPreview(logs: { message: string }[] | undefined) {
  if (!logs?.length) return '';
  return logs
    .map(l => l.message.replace(/\n+/g, ' ').trim())
    .filter(Boolean)
    .slice(-2)
    .join(' ');
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { historyList, handleRestoreHistory, handleClearHistory, handleDeleteHistory } = usePlanning();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const aiHistory = useMemo(
    () => historyList.filter(item => item.isAi === true),
    [historyList],
  );

  const allSelected = aiHistory.length > 0 && selectedIds.size === aiHistory.length;
  const hasSelection = selectedIds.size > 0;

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === aiHistory.length) return new Set();
      return new Set(aiHistory.map(item => item.id));
    });
  }, [aiHistory]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    handleDeleteHistory(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds, handleDeleteHistory]);

  return (
    <div className="page-container py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" />
            {c.pageTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{c.pageSubtitle}</p>
        </div>
        {aiHistory.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {c.selectAll}
            </button>
            {hasSelection && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                {c.deleteSelected}
                <span className="text-xs text-red-400">({selectedIds.size})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              {c.clearAll}
            </button>
          </div>
        )}
      </div>

      {aiHistory.length === 0 ? (
        <div className="glass-panel p-16 sm:p-20 text-center">
          <div className="text-5xl mb-4">{c.emptyEmoji}</div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">{c.emptyTitle}</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">{c.emptyDesc}</p>
          <button
            type="button"
            onClick={() => navigate('/planner', { state: { useAi: true } })}
            className="px-6 py-3 rounded-xl bg-meituan text-slate-900 font-bold text-sm hover:bg-meituan-light transition-all"
          >
            {c.emptyCta}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {aiHistory.map(item => {
            const aiPreview = formatAiPreview(item.aiLogs);
            const isSelected = selectedIds.has(item.id);
            return (
              <article
                key={item.id}
                className={`glass-panel p-6 flex flex-col h-full min-h-[220px] hover:shadow-xl transition-all group relative ${isSelected ? 'ring-2 ring-amber-400 border-amber-300' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => toggleSelect(item.id)}
                  className="absolute top-4 left-4 z-10 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                  aria-label={isSelected ? '取消选择' : '选择此记录'}
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                  )}
                </button>

                <div className="flex items-center gap-2 shrink-0 mb-3 pl-7">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-800">
                    <MessageCircle className="w-3 h-3" />
                    AI 对话
                  </span>
                  <span className="text-xs text-slate-400 tabular-nums ml-auto">{item.timestamp}</span>
                </div>

                <p className="text-sm font-semibold text-slate-800 line-clamp-3 leading-relaxed shrink-0 mb-3">
                  <span className="text-slate-400 font-medium">你：</span>
                  {item.query}
                </p>

                {aiPreview ? (
                  <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed flex-1 min-h-[4rem] mb-4 bg-slate-50/80 rounded-xl px-3 py-2.5 border border-slate-100">
                    <span className="text-slate-400 font-medium">小美：</span>
                    {aiPreview}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 flex-1 mb-4">暂无对话摘要</p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleRestoreHistory(item);
                    navigate('/planner', { state: { useAi: true } });
                  }}
                  className="mt-auto w-full h-11 shrink-0 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold flex items-center justify-center gap-1.5 group-hover:bg-amber-100 transition-colors"
                >
                  {c.restore}
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
