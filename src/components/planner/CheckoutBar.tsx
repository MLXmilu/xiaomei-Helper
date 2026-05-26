import { ShoppingBag } from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';

export function CheckoutBar() {
  const { plan, isExecuting, executeSuccess, setShowCashierModal } = usePlanning();
  if (!plan) return null;

  return (
    <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">全包一键下单</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-2xl font-extrabold font-mono text-slate-800">¥{plan.totalCost}</span>
          <span className="text-xs text-slate-400">含门票 / 订座 / 闪送</span>
        </div>
      </div>
      <button
        disabled={isExecuting}
        onClick={() => setShowCashierModal(true)}
        className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-md flex items-center gap-2 ${
          isExecuting ? 'bg-slate-100 text-slate-400' :
          executeSuccess ? 'bg-emerald-500 text-white' :
          'bg-meituan text-slate-800 hover:bg-meituan-light active:scale-95'
        }`}
      >
        <ShoppingBag className="w-5 h-5" />
        {isExecuting ? '订购中...' : executeSuccess ? '已下单成功' : '一键全包下单'}
      </button>
    </div>
  );
}
