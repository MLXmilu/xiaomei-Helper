import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

writeFileSync(
  join(root, 'src/constants/uiCopy.ts'),
  `export const PLANNER_COPY = {
  pageTitle: '行程规划',
  pageSubtitle: '在左侧说出安排，地图与时间轴会同步更新',
  simulateError: '模拟下单失败',
  aiModeTitle: '联网推荐模式',
  aiModeDesc: '需要联网才能匹配更多店名。先在左侧发送你的周末安排，小美会帮你排路线。',
  emptyEmoji: '🗺️',
  emptyTitle: '还没有行程',
  emptyDesc: '在左侧输入或选一个场景，小美会帮你排路线',
  timelineTitle: '时间轴',
} as const;

export const HISTORY_COPY = {
  pageTitle: '决策历史',
  pageSubtitle: '查看并恢复你之前保存的周末方案',
  clearAll: '清空全部',
  emptyEmoji: '📋',
  emptyTitle: '暂无历史记录',
  emptyDesc: '完成一次规划后会自动保存在这里',
  emptyCta: '去规划一个周末',
  restore: '恢复此方案',
} as const;

export const CASHIER_COPY = {
  title: '确认下单',
  savingsTag: 'SUPER SAVINGS',
  savingsDesc: '门票/订座/闪购',
  savingsLabel: '共省',
  ticketPrefix: '门票',
  ticketSuffix: '预订',
  mealPrefix: '订座',
  mealSuffix: '排号',
  retailTitle: '闪购 补给',
  hotelTitle: '酒店 住宿',
  taxiTitle: '打车 接送',
  totalLabel: '应付合计',
  paying: '支付中...',
  confirmPay: '确认支付',
  cancel: '取消',
} as const;
`,
  'utf8'
);

const plannerPage = `import { useEffect } from 'react';
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
`;

const historyPage = `import { useNavigate } from 'react-router-dom';
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {historyList.map(item => (
            <div key={item.id} className="glass-panel p-6 hover:shadow-xl transition-all group">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-mono text-slate-400">{item.timestamp}</span>
                <span className="text-lg font-extrabold font-mono text-amber-600">¥{item.plan.totalCost}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 line-clamp-3 mb-4 leading-relaxed">{item.query}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {item.plan.timeline.slice(1, 4).map((t, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">
                    {t.node.name}
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  handleRestoreHistory(item);
                  navigate('/planner');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold flex items-center justify-center gap-1 group-hover:bg-amber-100 transition-all"
              >
                {c.restore}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;

const cashierModal = `import { Heart, Check, Loader2 } from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';
import { CASHIER_COPY } from '../../constants/uiCopy';

const c = CASHIER_COPY;

export function CashierModal() {
  const { showCashierModal, setShowCashierModal, plan, isPaying, handlePaymentSubmit } = usePlanning();
  if (!showCashierModal || !plan) return null;
  const bill = plan.businessBill;
  const yen = '¥';
  const node1 = plan.timeline[1]?.node.name ?? '';
  const node2 = plan.timeline[2]?.node.name ?? '';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 lg:p-8 space-y-5 shadow-2xl animate-[slideUp_0.3s_ease-out]">
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto lg:hidden" />
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-meituan flex items-center justify-center">
              <Heart className="w-4 h-4 text-slate-800 fill-slate-800" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{c.title}</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">SECURE</span>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-4 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-xs text-amber-700 font-bold">{c.savingsTag}</p>
            <p className="text-sm font-extrabold text-amber-950">{c.savingsDesc}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-amber-600">{c.savingsLabel}</p>
            <p className="text-xl font-extrabold text-amber-600 font-mono">{yen}{bill.savingsTotal}</p>
          </div>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {bill.ticketPrice && (
            <BillRow
              title={\`\${c.ticketPrefix} \${node1} \${c.ticketSuffix}\`}
              label={bill.ticketPrice.label}
              original={bill.ticketPrice.original}
              current={bill.ticketPrice.current}
            />
          )}
          {bill.mealPrice && (
            <BillRow
              title={\`\${c.mealPrefix} \${node2} \${c.mealSuffix}\`}
              label={bill.mealPrice.label}
              original={bill.mealPrice.original}
              current={bill.mealPrice.current}
              showStrike={bill.mealPrice.couponDeducted > 0}
            />
          )}
          {bill.retailPrice && (
            <BillRow
              title={c.retailTitle}
              label={bill.retailPrice.label}
              original={bill.retailPrice.cost + 5}
              current={bill.retailPrice.cost}
            />
          )}
          {bill.hotelPrice && (
            <BillRow
              title={c.hotelTitle}
              label={bill.hotelPrice.label}
              original={bill.hotelPrice.original}
              current={bill.hotelPrice.current}
            />
          )}
          {bill.taxiPrice && (
            <BillRow title={c.taxiTitle} label={bill.taxiPrice.label} current={bill.taxiPrice.estimated} />
          )}
        </div>
        <div className="flex justify-between items-baseline border-t border-slate-100 pt-4">
          <span className="text-sm font-bold text-slate-600">{c.totalLabel}</span>
          <span className="text-2xl font-extrabold font-mono text-slate-900">{yen}{plan.totalCost}</span>
        </div>
        <div className="flex gap-3">
          <button
            disabled={isPaying}
            onClick={handlePaymentSubmit}
            className="flex-1 py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-70"
          >
            {isPaying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {c.paying}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> {c.confirmPay} {yen}{plan.totalCost}
              </>
            )}
          </button>
          <button
            disabled={isPaying}
            onClick={() => setShowCashierModal(false)}
            className="px-5 py-3.5 rounded-2xl bg-slate-100 text-slate-500 text-sm font-bold hover:bg-slate-200 disabled:opacity-70"
          >
            {c.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

function BillRow({
  title,
  label,
  original,
  current,
  showStrike = true,
}: {
  title: string;
  label: string;
  original?: number;
  current?: number;
  showStrike?: boolean;
}) {
  const yen = '¥';
  return (
    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center text-sm">
      <div>
        <p className="font-bold text-slate-800">{title}</p>
        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{label}</span>
      </div>
      <div className="text-right">
        {original != null && showStrike && (
          <span className="text-xs text-slate-400 line-through block">
            {yen}{original}
          </span>
        )}
        {current != null && <span className="font-bold font-mono">{yen}{current}</span>}
      </div>
    </div>
  );
}
`;

writeFileSync(join(root, 'src/pages/PlannerPage.tsx'), plannerPage, 'utf8');
writeFileSync(join(root, 'src/pages/HistoryPage.tsx'), historyPage, 'utf8');
writeFileSync(join(root, 'src/components/planner/CashierModal.tsx'), cashierModal, 'utf8');

console.log('Fixed: uiCopy.ts, PlannerPage, HistoryPage, CashierModal');
