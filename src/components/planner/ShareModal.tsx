import { CheckCircle2 } from 'lucide-react';
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
