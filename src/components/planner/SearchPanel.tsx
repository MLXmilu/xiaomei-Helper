import { useState } from 'react';
import { Send, Mic, MicOff, Loader2, Settings2, Users, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';
import {
  INPUT_PLACEHOLDER_AI,
} from '../../constants/travelProfiles';
import { ProfileInputGuide } from './ProfileInputGuide';

interface SearchPanelProps {
  compact?: boolean;
}

export function SearchPanel({ compact = false }: SearchPanelProps) {
  const {
    query, setQuery, useAi, isLoading, isListening,
    handlePlan, toggleListening,
  } = usePlanning();

  const pickExample = (text: string) => {
    setQuery(text);
  };

  // --- 高级出行画像配置 ---
  const [activeScenario, setActiveScenario] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [companions, setCompanions] = useState<string>('独自一人');
  const [styles, setStyles] = useState<string[]>([]);

  const SCENARIOS = [
    { id: 'family', label: '👨‍👩‍👦 家庭周末', config: { companions: '带娃', styles: ['特色美食', '松弛疗愈', '亲子互动'] } },
    { id: 'friends', label: '🍻 朋友聚会', config: { companions: '三五好友', styles: ['刺激嗨玩', '特色美食', '免门票'] } },
    { id: 'solo', label: '🏃 单人放松', config: { companions: '独自一人', styles: ['松弛疗愈', '潮流看展'] } }
  ];

  const COMPANIONS_OPTS = ['独自一人', '情侣双人', '带娃', '带长辈', '三五好友', '家庭聚餐', '团建出行'];
  const STYLES_OPTS = ['特色美食', '松弛疗愈', '刺激嗨玩', '潮流看展', '特种兵打卡', '高性价比', '亲子互动', '历史文化', '自然风光', '免门票', '宠物友好'];

  const handleSelectScenario = (sc: typeof SCENARIOS[0]) => {
    if (activeScenario === sc.id) {
      setActiveScenario('');
      setCompanions('独自一人');
      setStyles([]);
    } else {
      setActiveScenario(sc.id);
      setCompanions(sc.config.companions);
      setStyles(sc.config.styles);
    }
  };

  const toggleStyle = (s: string) => {
    setActiveScenario(''); // 切换具体项时取消预设高亮
    setStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = () => {
    if (!useAi) {
      handlePlan(query);
      return;
    }
    
    // 如果没有任何偏好，或者偏好全为默认，直接发送
    if (companions === '独自一人' && styles.length === 0) {
      handlePlan(query);
      return;
    }

    const injectedPrefix = `[系统级出行画像注入：出行人员为“${companions}”，偏好风格为“${styles.join('、')}”。注意：如果下方用户输入的文字内容与本画像要求发生冲突，请绝对以用户输入的文字内容为准！]\n\n用户输入：`;
    const finalQuery = `${injectedPrefix}${query}`;
    handlePlan(finalQuery);
  };


  return (
    <div className={`space-y-4 ${compact ? '' : 'glass-panel p-5'}`}>
      {!compact && (
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">说说你的周末安排</h2>
          <p className="text-sm text-slate-500 mt-1">
            请尽量写清：谁一起、什么氛围、去哪、多久
          </p>
        </div>
      )}



      {!compact && (
        <div className="flex flex-wrap items-center gap-2">
          {SCENARIOS.map(sc => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all border ${
                activeScenario === sc.id
                  ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-amber-200'
              }`}
            >
              {sc.label}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1 ${
              showAdvanced || styles.length > 0
                ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            自定义偏好 {(styles.length > 0 || companions !== '独自一人') && !activeScenario ? '(已修改)' : ''}
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      )}

      {showAdvanced && !compact && (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 space-y-4 animate-[fadeIn_0.2s_ease-out]">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Users className="w-3 h-3" /> 出行人员身份
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COMPANIONS_OPTS.map(opt => (
                <button
                  key={opt}
                  onClick={() => { setCompanions(opt); setActiveScenario(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    companions === opt
                      ? 'bg-meituan/20 border-meituan text-slate-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 行程活动风格 (多选)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STYLES_OPTS.map(opt => (
                <button
                  key={opt}
                  onClick={() => toggleStyle(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    styles.includes(opt)
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`relative bg-white rounded-2xl border-2 flex items-end shadow-sm transition-all border-amber-200 focus-within:border-amber-300`}>
        <textarea
          rows={compact ? 2 : 4}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={INPUT_PLACEHOLDER_AI}
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
            type="button"
            onClick={toggleListening}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isListening ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-all bg-meituan text-slate-800 hover:bg-meituan-light"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!compact && <ProfileInputGuide onPickExample={pickExample} />}


    </div>
  );
}
