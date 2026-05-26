import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: '首页' },
  { to: '/planner', label: '行程规划' },
  { to: '/history', label: '决策历史' },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#efece6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.25rem] gap-4">
          <NavLink to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-[#FFD100] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Heart className="w-5 h-5 text-slate-900 fill-slate-900" />
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold text-slate-900 tracking-tight leading-tight">
                美团周末管家
              </h1>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                周末出行 · 规划与下单
              </p>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV_ITEMS.map(({ to, label }) => {
              const active = isActive(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`relative py-1 text-sm font-semibold transition-colors ${
                    active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                  {active && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#FFD100]" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/planner', { state: { useAi: true } })}
              className="hidden sm:inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-[#fff8e1] border border-amber-100 text-xs font-semibold text-amber-900/90 hover:bg-amber-50 transition-colors"
            >
              智能推荐上线
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </button>
            <NavLink
              to="/planner"
              className="px-4 sm:px-5 py-2 rounded-full bg-[#FFD100] text-slate-900 text-sm font-bold shadow-sm hover:bg-[#ffe466] transition-all active:scale-[0.98]"
            >
              开始规划
            </NavLink>
          </div>
        </div>

        <nav className="md:hidden flex items-center justify-center gap-6 pb-3 -mt-1">
          {NAV_ITEMS.map(({ to, label }) => {
            const active = isActive(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`relative text-sm font-semibold ${
                  active ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {label}
                {active && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#FFD100]" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
