import {
  Baby,
  Dumbbell,
  Users,
  Sparkles,
  Flame,
  Zap,
  Heart,
  Leaf,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';
import {
  TRAVEL_PROFILE_META,
  INPUT_HINT_CHECKLIST,
  type TravelProfileKey,
} from '../../constants/travelProfiles';

const ICONS: Record<TravelProfileKey, LucideIcon> = {
  isYouthVibe: Flame,
  isThrillFun: Zap,
  isFriendsGroup: Users,
  isCoupleDate: Heart,
  hasChild: Baby,
  hasSlimming: Dumbbell,
  isChillRelax: Leaf,
  isBudgetSaver: Wallet,
};

export function ProfileBadges() {
  const { plan, constraints } = usePlanning();
  if (!plan || !constraints) return null;

  const matched = TRAVEL_PROFILE_META.filter(item => constraints[item.key]);

  return (
    <div className="glass-panel p-4 flex gap-3 bg-white/95 max-h-[min(42vh,320px)] overflow-y-auto">
      <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 mb-0.5">出行画像</p>
        <p className="text-xs text-slate-500 mb-2.5 leading-relaxed">
          根据你的话自动识别，用于匹配景点与玩法（可多项叠加）
        </p>
        {matched.length === 0 ? (
          <div className="text-xs text-slate-500 bg-amber-50/50 border border-amber-100 rounded-xl px-3 py-2.5 space-y-2 leading-relaxed">
            <p>
              暂未识别到画像，当前按<strong className="text-slate-700">通用周末</strong>规划。
              请在左侧补充关键词后重新发送。
            </p>
            <p className="text-[11px] text-slate-500">
              可写：{INPUT_HINT_CHECKLIST.slice(0, 3).map(h => h.detail.split(' / ')[0]).join('、')}…
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {matched.map(({ key, label, color }) => {
                const Icon = ICONS[key];
                return <Badge key={key} color={color} icon={<Icon className="w-4 h-4" />} label={label} />;
              })}
            </div>
            {matched.length < 3 && (
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                还可补充：{TRAVEL_PROFILE_META.filter(p => !constraints[p.key])
                  .slice(0, 4)
                  .map(p => p.label)
                  .join('、')}
                等，帮助小美更懂你
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Badge({ color, icon, label }: { color: string; icon: React.ReactNode; label: string }) {
  const colors: Record<string, string> = {
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    pink: 'bg-pink-50 text-pink-700 border-pink-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
  };
  return (
    <span
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${colors[color] ?? colors.amber}`}
    >
      {icon} {label}
    </span>
  );
}
