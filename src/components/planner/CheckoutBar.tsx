import { ShoppingBag } from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';

export function CheckoutBar() {
  const { plan, isExecuting } = usePlanning();
  if (!plan) return null;

  return (
    <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">全包一键下单</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-2xl font-extrabold font-mono text-slate-800">¥{plan.totalCost}</span>
          <span className="text-xs text-slate-400">含门票 / 订座</span>
        </div>
      </div>
      <button
        disabled={isExecuting}
        onClick={() => {
          const validNode = plan.timeline.find(t => 
            (t.node.type === 'play' || t.node.type === 'eat') && 
            t.node.id !== 'start-node' && 
            t.node.id !== 'end-node'
          );
          const keyword = validNode?.node.name || plan.targetCity || '周末游';
          const dianpingSearchUrl = `https://www.dianping.com/search/keyword/1/0_${encodeURIComponent(keyword)}`;
          window.open(dianpingSearchUrl, '_blank');
        }}
        className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-md flex items-center gap-2 bg-meituan text-slate-800 hover:bg-meituan-light active:scale-95`}
      >
        <ShoppingBag className="w-5 h-5" />
        去大众点评查看
      </button>
    </div>
  );
}
