import { Send, Mic, MicOff, Loader2, Globe } from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';
import { PRESETS } from '../../constants/presets';

interface SearchPanelProps {
  compact?: boolean;
}

export function SearchPanel({ compact = false }: SearchPanelProps) {
  const {
    query, setQuery, useAi, setUseAi, isLoading, isListening,
    isPlanFromAi, handlePlan, toggleListening,
  } = usePlanning();

  return (
    <div className={`space-y-4 ${compact ? '' : 'glass-panel p-5'}`}>
      {!compact && (
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">说说你的周末安排</h2>
          <p className="text-sm text-slate-500 mt-1">像跟朋友聊天一样描述即可，小美会帮你排路线</p>
        </div>
      )}

      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
        <span className="text-xs font-bold text-slate-500">规划方式</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => { setUseAi(false); handlePlan(query, false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !useAi ? 'bg-white shadow-sm text-slate-800 border border-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            标准模式
          </button>
          <button
            type="button"
            onClick={() => { setUseAi(true); if (!isPlanFromAi) setQuery(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              useAi ? 'bg-white shadow-sm text-slate-800 border border-amber-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Globe className="w-3 h-3" /> 联网推荐
          </button>
        </div>
      </div>

      <div className={`relative bg-white rounded-2xl border-2 flex items-end shadow-sm transition-all ${
        useAi ? 'border-amber-200 focus-within:border-amber-300' : 'border-slate-200 focus-within:border-meituan/60'
      }`}>
        <textarea
          rows={compact ? 2 : 3}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="例如：带5岁娃和减肥老婆，周六下午3公里内，先玩再吃点清淡的..."
          className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-800 placeholder-slate-400 border-0 focus:outline-none resize-none leading-relaxed"
        />
        <div className="flex items-center gap-1 p-2 shrink-0">
          {isListening && (
            <div className="flex items-end gap-0.5 h-6 px-1">
              {[0.1, 0.3, 0.5, 0.2, 0.4].map((d, i) => (
                <span key={i} className="w-0.5 bg-amber-500 rounded-full voice-bar" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          )}
          <button
            onClick={toggleListening}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isListening ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handlePlan(query)}
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-all bg-meituan text-slate-800 hover:bg-meituan-light"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset, i) => (
          <button
            key={i}
            onClick={() => { setQuery(preset.text); handlePlan(preset.text); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              query === preset.text
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-600 hover:border-amber-200 hover:bg-amber-50/50'
            }`}
          >
            {preset.emoji} {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
