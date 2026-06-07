import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import {
  INPUT_HINT_CHECKLIST,
  PROFILE_EXAMPLE_PROMPTS,
} from '../../constants/travelProfiles';

interface ProfileInputGuideProps {
  onPickExample: (text: string) => void;
  compact?: boolean;
}

export function ProfileInputGuide({ onPickExample, compact = false }: ProfileInputGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50/80 to-[#fffdf5] px-3.5 py-3 overflow-hidden transition-all duration-300">
      <div 
        className="flex items-start justify-between gap-2 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-950">这样写，小美更好识别你的出行画像</p>
            <p className="text-[11px] text-amber-900/70 mt-0.5 leading-relaxed">
              信息越具体，右侧「出行画像」标签越准，路线和店铺也越贴合
            </p>
          </div>
        </div>
        <button 
          type="button" 
          className="p-1 shrink-0 text-amber-600/70 hover:bg-amber-100/50 hover:text-amber-600 rounded-full transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="overflow-hidden space-y-3">
          {!compact && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {INPUT_HINT_CHECKLIST.map(item => (
                <li
                  key={item.title}
                  className="flex gap-2 text-[11px] text-slate-600 bg-white/70 rounded-lg px-2 py-1.5 border border-amber-50"
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>
                    <strong className="text-slate-800">{item.title}</strong>
                    <span className="text-slate-500"> — {item.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div>
            <p className="text-[11px] font-bold text-slate-600 mb-1.5">没思路？点一句示例再改：</p>
            <div className="flex flex-wrap gap-1.5">
              {PROFILE_EXAMPLE_PROMPTS.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onPickExample(item.text)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-amber-200/90 text-amber-950 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
