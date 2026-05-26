import { Baby, Dumbbell, Users, Info } from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';

export function ProfileBadges() {
  const { plan, constraints } = usePlanning();
  if (!plan || !constraints) return null;

  return (
    <div className="glass-panel p-4 flex gap-3">
      <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm text-slate-500 font-medium mb-2">管家已锁定的出行画像</p>
        <div className="flex flex-wrap gap-2">
          <Badge active={constraints.hasChild} color="cyan" icon={<Baby className="w-4 h-4" />} label="带娃家庭" />
          <Badge active={constraints.hasSlimming} color="emerald" icon={<Dumbbell className="w-4 h-4" />} label="控糖低卡" />
          <Badge active={constraints.isFriendsGroup} color="amber" icon={<Users className="w-4 h-4" />} label="社交娱乐" />
        </div>
      </div>
    </div>
  );
}

function Badge({ active, color, icon, label }: { active: boolean; color: string; icon: React.ReactNode; label: string }) {
  const colors: Record<string, string> = {
    cyan: 'bg-cyan-50 text-cyan-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${active ? colors[color] : 'text-slate-300 bg-slate-50'}`}>
      {icon} {label}
    </span>
  );
}
