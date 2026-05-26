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
import { MapContainer } from '../components/MapContainer';
import { TimelineCards } from '../components/TimelineCards';

const c = PLANNER_COPY;

export function PlannerPage() {
  const location = useLocation();
  const {
    plan, useAi, isLoading, simulateError, setSimulateError,
    handlePlan, handleSwapOrder, handleShuffleNode, isExecuting,
  } = usePlanning();

  useEffect(() => {
    const query = (location.state as { query?: string })?.query;
    if (query) handlePlan(query);
  }, [location.state, handlePlan]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
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

          <div className="space-y-4 min-w-0">
            {isLoading && <AssistantBubble />}

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
              <div className="grid xl:grid-cols-2 gap-5">
                <div className="glass-panel overflow-hidden p-1 min-h-[320px]">
                  <MapContainer timeline={plan.timeline} isExecuting={isExecuting} />
                </div>
                <div className="space-y-4">
                  <AssistantBubble />
                  <ProfileBadges />
                  <div className="glass-panel p-5">
                    <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">
                      {c.timelineTitle}
                    </h4>
                    <TimelineCards
                      timeline={plan.timeline}
                      onSwapOrder={handleSwapOrder}
                      onShuffleNode={handleShuffleNode}
                      isExecuting={isExecuting}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {plan && (
        <div className="border-t border-slate-200 bg-white/90 backdrop-blur-md sticky bottom-0 z-20">
          <div className="max-w-7xl mx-auto">
            <CheckoutBar />
          </div>
        </div>
      )}

      <ShareModal />
      <CashierModal />
    </>
  );
}
