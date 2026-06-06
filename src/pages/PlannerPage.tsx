import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlanning } from '../context/PlanningContext';
import { PLANNER_COPY } from '../constants/uiCopy';
import { SearchPanel } from '../components/planner/SearchPanel';
import { HistoryRail } from '../components/planner/HistoryRail';
import { AssistantBubble } from '../components/planner/AssistantBubble';
import { ProfileBadges } from '../components/planner/ProfileBadges';
import { CheckoutBar } from '../components/planner/CheckoutBar';
import { ShareModal } from '../components/planner/ShareModal';
import { CashierModal } from '../components/planner/CashierModal';
import { CollabModal } from '../components/planner/CollabModal';
import { MapContainer } from '../components/MapContainer';
import { TimelineCards } from '../components/TimelineCards';

const c = PLANNER_COPY;

export function PlannerPage() {
  const location = useLocation();
  const {
    plan, useAi, isLoading, simulateError, setSimulateError,
    handlePlan, handleSwapOrder, handleShuffleNode, isExecuting,
    openCollabModal
  } = usePlanning();


  useEffect(() => {
    const query = (location.state as { query?: string })?.query;
    if (query) handlePlan(query);
  }, [location.state, handlePlan]);

  return (
    <>
      <div className="page-container py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{c.pageTitle}</h1>
            <p className="text-sm text-slate-500 mt-1">{c.pageSubtitle}</p>
          </div>
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors">
            {c.simulateError}
            <input
              type="checkbox"
              checked={simulateError}
              onChange={e => setSimulateError(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded"
            />
          </label>
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <SearchPanel />
            <div className="glass-panel p-4">
              <HistoryRail vertical />
            </div>
          </aside>


          {/* 右内容区：flex双列，右侧边栏始终固定 */}
          <div className="flex gap-4 items-start min-w-0">

            {/* 主内容区 */}
            <div className="flex-1 space-y-5 min-w-0">

              {/* 加载中：显示旋转占位，AI 思考过程见右侧边栏 */}
              {isLoading && !plan && (
                <div className="glass-panel p-16 flex flex-col items-center gap-5">
                  <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-400 font-semibold tracking-wide">管家小美规划中，请稍候...</p>
                </div>
              )}

              {useAi && !plan && !isLoading && (
                <div className="glass-panel p-8 text-center space-y-3 border border-slate-200 bg-slate-50/50">
                  <p className="text-base font-bold text-slate-800">{c.aiModeTitle}</p>
                  <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{c.aiModeDesc}</p>
                </div>
              )}

              {!plan && !isLoading && !useAi && (
                <div className="glass-panel p-16 text-center">
                  <div className="text-5xl mb-4">{c.emptyEmoji}</div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2">{c.emptyTitle}</h3>
                  <p className="text-sm text-slate-500">{c.emptyDesc}</p>
                </div>
              )}

              {plan && (
                <>
                  {/* 地图（全占主内容宽度） */}
                  <div className="relative h-[min(58vh,620px)] min-h-[380px] rounded-3xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-md">
                    <MapContainer timeline={plan.timeline} isExecuting={isExecuting} fill targetCity={plan.targetCity} />
                  </div>

                  {/* 时间轴 + 协同入口 Banner */}
                  <div className="glass-panel p-5">
                    <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">
                      {c.timelineTitle}
                    </h4>

                    {/* 👨‍👩‍👧 家人协同评审 Banner */}
                    <div className="mb-6 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5 border border-amber-500/10 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none relative overflow-hidden animate-[pulse_3s_infinite]">
                      <div className="flex gap-3.5 items-start sm:items-center">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-xl shrink-0 border border-amber-200/50 shadow-xs">
                          👨‍👩‍👧
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <span>多人意图协同评审端</span>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          </h5>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 leading-normal max-w-lg">觉得当前推荐不符合家人口味？把手机递给老婆或发给朋友，让他们自己动手微调偏好！</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openCollabModal()}
                        className="px-5 py-2.5 rounded-xl bg-meituan hover:bg-meituan-light active:scale-95 text-slate-800 text-[11px] font-black border border-amber-400 shrink-0 transition-all shadow-sm cursor-pointer flex items-center gap-1.5 active:translate-y-px"
                      >
                        🤝 递给家人/朋友微调
                      </button>
                    </div>

                    <TimelineCards
                      timeline={plan.timeline}
                      onSwapOrder={handleSwapOrder}
                      onShuffleNode={handleShuffleNode}
                      isExecuting={isExecuting}
                      targetCity={plan.targetCity}
                    />
                  </div>
                </>
              )}
            </div>

            {/* 右侧固定边栏：AI 思考泡泡 + 出行画像（始终显示） */}
            <div className="hidden sm:flex flex-col gap-3 w-64 shrink-0 pt-1">
              <div className="shadow-lg rounded-3xl">
                <AssistantBubble />
              </div>
              {plan && (
                <div className="shadow-lg rounded-3xl">
                  <ProfileBadges />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {plan && (
        <div className="border-t border-slate-200 bg-white/90 backdrop-blur-md sticky bottom-0 z-20">
          <div className="page-container">
            <CheckoutBar />
          </div>
        </div>
      )}

      <ShareModal />
      <CashierModal />
      <CollabModal />
    </>
  );
}
