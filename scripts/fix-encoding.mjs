import fs from 'fs';
import path from 'path';

const src = path.join(import.meta.dirname, '..', 'src');

function write(rel, content) {
  const fp = path.join(src, rel);
  fs.writeFileSync(fp, content, { encoding: 'utf8' });
  console.log('OK:', rel);
}

const E = {
  assistant: '\uD83D\uDC69\u200D\uD83D\uDCBC',
  map: '\uD83D\uDDFA\uFE0F',
  clock: '\uD83D\uDD70\uFE0F',
};

write('pages/HomePage.tsx', fs.readFileSync(path.join(src, 'pages/HomePage.tsx'), 'utf8')
  .replace(/^\s+\?\?\?\?\?\s*$/m, `                  ${E.assistant}`)
  .replace(/^\s+\?\?\s*$/m, '                  在线')
  .replace(/              \?\?\?\? <ArrowRight/g, '              查看全部 <ArrowRight')
  .replace(/                  \?\?\?\? <ArrowRight/g, '                  立即体验 <ArrowRight')
  .replace(/\{'\\u00a5'\}\{item\.plan\.totalCost\} . \{item\.timestamp\}/,
    "{'\\u00a5'}{item.plan.totalCost} · {item.timestamp}")
);

write('pages/HistoryPage.tsx', `import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Trash2 } from 'lucide-react';
import { usePlanning } from '../context/PlanningContext';

export function HistoryPage() {
  const navigate = useNavigate();
  const { historyList, handleRestoreHistory, handleClearHistory } = usePlanning();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-500" /> 决策历史
          </h1>
          <p className="text-sm text-slate-500 mt-1">回顾和对比之前的 AI 规划方案，一键回溯</p>
        </div>
        {historyList.length > 0 && (
          <button onClick={handleClearHistory} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-all">
            <Trash2 className="w-4 h-4" /> 清空全部
          </button>
        )}
      </div>
      {historyList.length === 0 ? (
        <div className="glass-panel p-20 text-center">
          <div className="text-5xl mb-4">${E.clock}</div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-2">暂无历史记录</h3>
          <p className="text-sm text-slate-500 mb-8">完成一次智能规划后，方案会自动保存在这里</p>
          <button onClick={() => navigate('/planner')} className="px-6 py-3 rounded-xl bg-meituan text-slate-900 font-bold text-sm hover:bg-meituan-light transition-all">开始规划</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {historyList.map(item => (
            <div key={item.id} className="glass-panel p-6 hover:shadow-xl transition-all group">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-mono text-slate-400">{item.timestamp}</span>
                <span className="text-lg font-extrabold font-mono text-amber-600">{'\\u00a5'}{item.plan.totalCost}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 line-clamp-3 mb-4 leading-relaxed">{item.query}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {item.plan.timeline.slice(1, 4).map((t, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">{t.node.name}</span>
                ))}
              </div>
              <button onClick={() => { handleRestoreHistory(item); navigate('/planner'); }} className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold flex items-center justify-center gap-1 group-hover:bg-amber-100 transition-all">
                回溯此方案 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`);

write('components/planner/ShareModal.tsx', `import { CheckCircle2 } from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';
import { generateShareText } from '../../agentEngine';

export function ShareModal() {
  const { showShareModal, setShowShareModal, plan } = usePlanning();
  if (!showShareModal || !plan) return null;
  const text = generateShareText(plan);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg space-y-5 shadow-2xl animate-[fadeIn_0.3s_ease-out]">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-extrabold text-slate-900">行程购买成功！</h3>
          <p className="text-sm text-slate-500">小美已为您全包购票、锁座并呼叫闪送</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-60 overflow-y-auto">
          <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { navigator.clipboard.writeText(text); alert('文案已复制，快去发给家人吧～'); }} className="flex-1 py-3 rounded-xl bg-meituan text-slate-900 text-sm font-bold hover:bg-meituan-light transition-all">复制发给家人</button>
          <button onClick={() => setShowShareModal(false)} className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all">关闭</button>
        </div>
      </div>
    </div>
  );
}
`);

write('components/planner/CashierModal.tsx', `import { Sparkles, Check, Loader2 } from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';

export function CashierModal() {
  const { showCashierModal, setShowCashierModal, plan, isPaying, handlePaymentSubmit } = usePlanning();
  if (!showCashierModal || !plan) return null;
  const bill = plan.businessBill;
  const yen = '\\u00a5';
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 lg:p-8 space-y-5 shadow-2xl animate-[slideUp_0.3s_ease-out]">
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto lg:hidden" />
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-meituan flex items-center justify-center"><Sparkles className="w-4 h-4 text-slate-800" /></div>
            <h3 className="text-base font-extrabold text-slate-900">一键结算台</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">SECURE</span>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-4 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-xs text-amber-700 font-bold">SUPER SAVINGS</p>
            <p className="text-sm font-extrabold text-amber-950">已整合门票/避峰券/特惠尾房</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-amber-600">已立省</p>
            <p className="text-xl font-extrabold text-amber-600 font-mono">{yen}{bill.savingsTotal}</p>
          </div>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {bill.ticketPrice && <BillRow title={\`🎫 \${plan.timeline[1]?.node.name} 门票\`} label={bill.ticketPrice.label} original={bill.ticketPrice.original} current={bill.ticketPrice.current} />}
          {bill.mealPrice && <BillRow title={\`🍲 \${plan.timeline[2]?.node.name} 订座\`} label={bill.mealPrice.label} original={bill.mealPrice.original} current={bill.mealPrice.current} showStrike={bill.mealPrice.couponDeducted > 0} />}
          {bill.retailPrice && <BillRow title="💊 闪购跑腿" label={bill.retailPrice.label} original={bill.retailPrice.cost + 5} current={bill.retailPrice.cost} />}
          {bill.hotelPrice && <BillRow title="🏨 尾房住宿" label={bill.hotelPrice.label} original={bill.hotelPrice.original} current={bill.hotelPrice.current} />}
          {bill.taxiPrice && <BillRow title="🚗 美团打车" label={bill.taxiPrice.label} current={bill.taxiPrice.estimated} />}
        </div>
        <div className="flex justify-between items-baseline border-t border-slate-100 pt-4">
          <span className="text-sm font-bold text-slate-600">合并支付</span>
          <span className="text-2xl font-extrabold font-mono text-slate-900">{yen}{plan.totalCost}</span>
        </div>
        <div className="flex gap-3">
          <button disabled={isPaying} onClick={handlePaymentSubmit} className="flex-1 py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-70">
            {isPaying ? <><Loader2 className="w-4 h-4 animate-spin" /> 支付中...</> : <><Check className="w-4 h-4" /> 微信支付 {yen}{plan.totalCost}</>}
          </button>
          <button disabled={isPaying} onClick={() => setShowCashierModal(false)} className="px-5 py-3.5 rounded-2xl bg-slate-100 text-slate-500 text-sm font-bold hover:bg-slate-200 disabled:opacity-70">取消</button>
        </div>
      </div>
    </div>
  );
}

function BillRow({ title, label, original, current, showStrike = true }: { title: string; label: string; original?: number; current?: number; showStrike?: boolean }) {
  const yen = '\\u00a5';
  return (
    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center text-sm">
      <div><p className="font-bold text-slate-800">{title}</p><span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{label}</span></div>
      <div className="text-right">
        {original != null && showStrike && <span className="text-xs text-slate-400 line-through block">{yen}{original}</span>}
        {current != null && <span className="font-bold font-mono">{yen}{current}</span>}
      </div>
    </div>
  );
}
`);

console.log('Done.');
