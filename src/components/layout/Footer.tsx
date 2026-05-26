import { Heart, MonitorSmartphone } from 'lucide-react';

const MOBILE_TIPS = [
  '建议宽度 ≥ 375px，竖屏浏览体验最佳',
  '支持 Chrome / Edge 移动端与桌面端',
  '行程规划页支持语音输入（需浏览器授权麦克风）',
  '地图与下单流程已做触控友好布局',
];

export function Footer() {
  return (
    <footer className="border-t border-[#efece6] bg-white mt-auto">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFD100] flex items-center justify-center">
                <Heart className="w-4 h-4 text-slate-900 fill-slate-900" />
              </div>
              <span className="font-extrabold text-slate-900 text-[15px]">美团周末管家</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              本地短时出行规划与一键执行。从说出安排到路线规划、下单，让每次周末陪伴更省心。
            </p>
            <div className="rounded-2xl border border-[#efece6] bg-[#fdfbf9] px-4 py-3.5 space-y-2">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MonitorSmartphone className="w-4 h-4 text-amber-600" />
                移动端适配说明
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 leading-relaxed">
                {MOBILE_TIPS.map(tip => (
                  <li key={tip} className="flex gap-2">
                    <span className="text-amber-500 shrink-0">·</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <h4 className="text-sm font-bold text-slate-900 mb-4">产品功能</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>智能排行程</li>
              <li>高德地图路线</li>
              <li>一键全包下单</li>
              <li>方案回溯</li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-bold text-slate-900 mb-4">技术栈</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>React + TypeScript</li>
              <li>高德地图</li>
              <li>Vite + Tailwind</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#efece6]">
          <p className="text-xs text-slate-400">© 2026 美团周末管家 · 概念演示</p>
        </div>
      </div>
    </footer>
  );
}
