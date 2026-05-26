import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, RefreshCw, Sparkles } from 'lucide-react';
import { PRESETS, FEATURES } from '../constants/presets';
import { HOME_COPY } from '../constants/copy';
import { usePlanning } from '../context/PlanningContext';

/** ?? Hero ???????? public/images/hero-weekend.png */
const HERO_BG = '/images/hero-weekend.png';

function formatLastEdited(id: number) {
  const d = new Date(id);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function HomePage() {
  const navigate = useNavigate();
  const { historyList } = usePlanning();
  const c = HOME_COPY;
  const latest = historyList[0];
  const [presetOffset, setPresetOffset] = useState(0);

  const visiblePresets = [
    PRESETS[presetOffset % PRESETS.length],
    PRESETS[(presetOffset + 1) % PRESETS.length],
    PRESETS[(presetOffset + 2) % PRESETS.length],
  ];

  const goPlan = (query?: string) => {
    navigate('/planner', query ? { state: { query } } : undefined);
  };

  const handleRandomInspiration = () => {
    const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    goPlan(preset.text);
  };

  return (
    <div className="bg-[#f9f9f7]">
      <section className="relative overflow-hidden min-h-[520px] sm:min-h-[560px] lg:min-h-[600px]">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat bg-[position:65%_center] sm:bg-[position:70%_center] lg:bg-[position:right_center]"
          style={{ backgroundImage: `url(${HERO_BG})` }}
          role="img"
          aria-label="????????"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f9f9f7] via-[#f9f9f7]/85 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 lg:pt-14 lg:pb-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* ??????? */}
            <div className="flex flex-col justify-center space-y-5 lg:pr-4">
              <div className="inline-flex w-fit items-center px-3 py-1 rounded-full bg-[#fff8e1] border border-amber-100/80 text-xs font-bold text-amber-950/80">
                {c.badge}
              </div>

              <h1 className="text-[2rem] sm:text-[2.75rem] lg:text-[3rem] font-extrabold text-slate-900 leading-[1.15] tracking-tight">
                {c.title}
              </h1>

              <p className="text-[15px] sm:text-base text-slate-600 max-w-lg leading-relaxed">
                {c.subtitleShort}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => goPlan()}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#FFD100] text-slate-900 font-bold text-[15px] shadow-md shadow-amber-500/20 hover:bg-[#ffe466] transition-all active:scale-[0.98]"
                >
                  {c.ctaPrimary}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleRandomInspiration}
                  className="inline-flex items-center gap-1.5 px-5 py-3.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  {c.ctaRandom}
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </button>
              </div>

              <div className="pt-2">
                <p className="text-sm text-slate-500 mb-3">{c.quickStartLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {visiblePresets.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => goPlan(preset.text)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200/90 text-sm font-medium text-slate-700 hover:border-amber-200 hover:bg-amber-50/50 transition-all shadow-sm"
                    >
                      <span>{preset.emoji}</span>
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPresetOffset(o => o + 1)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                    title={c.moreScenes}
                  >
                    <RefreshCw className="w-4 h-4" />
                    {c.moreScenes}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-1 gap-y-2 pt-4 text-xs sm:text-[13px] text-slate-500">
                {FEATURES.map((f, i) => (
                  <span key={f.title} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="text-slate-300 mx-1 hidden sm:inline">|</span>}
                    <span>
                      {f.icon} {f.title}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* ???????????????? */}
            <div className="flex items-center justify-center lg:justify-end min-h-[300px] sm:min-h-[340px] p-2 sm:p-4">
              <div className="w-full max-w-md bg-white/78 backdrop-blur-xl border border-white/70 rounded-3xl shadow-2xl shadow-slate-900/10 p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center text-xl shrink-0 border border-white shadow-sm">
                      {c.preview.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-[15px]">{c.preview.assistant}</p>
                      <p className="text-xs text-slate-500 truncate">{c.preview.role}</p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                      {c.preview.online}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed bg-white/80 rounded-2xl px-4 py-3 border border-slate-100/80 shadow-inner">
                    &ldquo;{c.preview.quote}&rdquo;
                  </p>

                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2.5">{c.preview.planTitle}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {c.preview.planIcons.map(item => (
                        <div
                          key={item.label}
                          className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white/90 border border-slate-100"
                        >
                          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-lg">
                            {item.icon}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100/80">
                    <div>
                      <span className="text-2xl font-extrabold text-slate-900">{c.preview.total}</span>
                      <span className="text-xs text-slate-500 ml-1.5">{c.preview.totalLabel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => goPlan(c.preview.quote.replace(/^"|"$/g, ''))}
                      className="inline-flex items-center gap-1 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shrink-0"
                    >
                      {c.preview.viewPlan}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
              </div>
            </div>
          </div>

          {/* ?????? */}
          {latest && (
            <div className="mt-8 lg:mt-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 sm:px-6 py-4 rounded-2xl bg-white border border-slate-100 shadow-md shadow-slate-900/[0.04]">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      {c.continueLabel}
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    </p>
                    <p className="text-sm text-slate-600 truncate">{latest.query}</p>
                    <p className="text-xs text-slate-400">
                      {c.lastEditedPrefix}: {formatLastEdited(latest.id)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => goPlan(latest.query)}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FFD100] text-slate-900 text-sm font-bold hover:bg-[#ffe466] transition-all shrink-0 sm:ml-auto"
                >
                  {c.continueAction}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
