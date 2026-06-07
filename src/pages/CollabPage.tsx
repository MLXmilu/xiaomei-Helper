import React, { useState, useEffect, useCallback } from 'react';
import {
  parseCollabHash,
  decodeConstraints,
  writeFeedback,
  type CollabFeedback,
} from '../lib/collabStore';
import type { AppConstraints } from '../agentEngine';

const COMMON_OPTIONS = [
  { key: 'hasSlimming', emoji: '🥗', title: '控糖减肥' },
  { key: 'hasChild', emoji: '👶', title: '带娃省心' },
  { key: 'slowLife', emoji: '🎨', title: '手作慢生活' },
  { key: 'anniversaryFlower', emoji: '🌹', title: '纪念日惊喜' },
  { key: 'lazySleep', emoji: '😴', title: '懒觉模式' },
  { key: 'thrillMystery', emoji: '🔑', title: '刺激密室' },
  { key: 'socialDrink', emoji: '🍶', title: '社交小酌' },
  { key: 'artGallery', emoji: '🖼️', title: '潮流展览' },
  { key: 'limitedStamina', emoji: '🚗', title: '体力有限' },
  { key: 'lightNutritious', emoji: '🍲', title: '清淡暖胃' },
  { key: 'medicineEmergency', emoji: '💊', title: '备齐常用药' },
  { key: 'photoSpot', emoji: '📸', title: '拍照出片' },
  { key: 'budgetLimit', emoji: '💰', title: '预算有限' },
  { key: 'petFriendly', emoji: '🐶', title: '宠物友好' },
  { key: 'avoidCrowd', emoji: '🤫', title: '避开人流' },
  { key: 'localSnack', emoji: '🍢', title: '特色小吃' },
  { key: 'needCoffee', emoji: '☕', title: '咖啡续命' },
];

const ROLE_CONFIG = {
  wife: {
    emoji: '👸',
    label: '老婆大人',
    short: '老婆',
    color: 'from-rose-400 to-pink-500',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    accent: 'accent-rose-500',
    tag: 'bg-rose-100 text-rose-700',
  },
  friend: {
    emoji: '🧑‍🤝‍🧑',
    label: '好友/伙伴',
    short: '伙伴',
    color: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    accent: 'accent-blue-500',
    tag: 'bg-blue-100 text-blue-700',
  },
  elder: {
    emoji: '👴',
    label: '随行长辈',
    short: '长辈',
    color: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'accent-emerald-500',
    tag: 'bg-emerald-100 text-emerald-700',
  },
} as const;

type RoleKey = keyof typeof ROLE_CONFIG;

/** 生成偏好的文字摘要 */
function buildSummaryText(
  role: RoleKey,
  checked: Record<string, boolean>,
  customText: string
): string {
  const cfg = ROLE_CONFIG[role];
  const selected = COMMON_OPTIONS
    .filter((o) => checked[o.key])
    .map((o) => o.title);
  const parts: string[] = [];
  if (selected.length) parts.push(selected.join('、'));
  if (customText.trim()) parts.push(`「${customText.trim()}」`);
  if (!parts.length) return `${cfg.emoji} ${cfg.short}已查看行程`;
  return `${cfg.emoji} ${cfg.short}希望：${parts.join('，')}`;
}

export default function CollabPage() {
  const { sessionId, encoded } = parseCollabHash();
  const constraints: AppConstraints | null = encoded ? decodeConstraints(encoded) : null;

  const [role, setRole] = useState<RoleKey>('wife');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [customText, setCustomText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 如果URL无效，显示错误
  const isValid = !!sessionId && !!constraints;

  const toggle = useCallback((key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!sessionId || !isValid) return;
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 800));

      const roleCfg = ROLE_CONFIG[role];
      const feedback: CollabFeedback = {
        id: Math.random().toString(36).slice(2),
        submittedAt: new Date().toLocaleString('zh-CN'),
        submitterName: roleCfg.short,
        role,
        ...Object.fromEntries(
          COMMON_OPTIONS.map((o) => [o.key, !!checked[o.key]])
        ),
        customText: customText.trim() || undefined,
      };

      writeFeedback(sessionId, feedback);
      setSubmitting(false);
      setSubmitted(true);
    },
    [sessionId, isValid, role, checked, customText]
  );

  // 切换角色时清空勾选
  useEffect(() => {
    setChecked({});
  }, [role]);

  const cfg = ROLE_CONFIG[role];

  if (!isValid) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 rounded-3xl p-10 text-center text-white space-y-4 shadow-2xl">
          <div className="text-6xl">🔗</div>
          <h1 className="text-xl font-black">链接已失效或格式错误</h1>
          <p className="text-slate-400 text-sm">请向规划者重新索取协同链接</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl text-5xl animate-[bounceIn_0.6s_ease-out]">
            ✅
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">心愿已送达！</h1>
            <p className="text-amber-100 text-sm leading-relaxed">
              管家小美已收到你的偏好<br />
              规划者会根据你的意见重新安排行程
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-left text-white text-xs font-medium leading-relaxed border border-white/30">
            <p className="font-black text-sm mb-1">📋 你提交的心愿摘要</p>
            <p className="text-amber-100">
              {buildSummaryText(role, checked, customText)}
            </p>
          </div>
          <p className="text-amber-200 text-xs">可以关闭此页面了 ✨</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl relative pb-32 overflow-x-hidden">
      {/* 顶部 Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white px-5 pt-10 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-black tracking-tight">小美</span>
            <span className="bg-white/20 border border-white/30 text-xs font-black px-2 py-0.5 rounded-full">行程协同</span>
          </div>
          <h1 className="text-xl font-black leading-snug mb-1">
            📱 你被邀请参与行程决策
          </h1>
          <p className="text-amber-100 text-sm font-medium">
            {constraints.originalQuery || '周末出行规划'}
          </p>
        </div>
      </div>

      {/* 行程概览卡片（相对于banner的-mt覆盖效果） */}
      <div className="px-4 -mt-8 mb-5">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">📍 行程概览</p>
          <div className="space-y-2">
            {constraints.nodes.slice(0, 6).map((node, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-800 truncate">{node.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {node.type === 'play' ? '🎡 游玩' : node.type === 'eat' ? '🍽️ 用餐' : '🏨 住宿'}
                    {node.duration ? ` · 约${node.duration}分钟` : ''}
                    {node.price ? ` · ¥${node.price}/人` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 身份选择 */}
      <div className="px-4 mb-5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">👤 你是谁？</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(ROLE_CONFIG) as RoleKey[]).map((r) => {
            const rc = ROLE_CONFIG[r];
            const active = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-2xl p-3 border-2 text-center transition-all cursor-pointer ${
                  active
                    ? `${rc.border} ${rc.bg} border-opacity-100 shadow-md scale-[1.03]`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-2xl mb-1">{rc.emoji}</div>
                <p className={`text-[10px] font-black ${active ? 'text-slate-800' : 'text-slate-500'}`}>
                  {rc.short}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 偏好选项 */}
      <form onSubmit={handleSubmit} className="px-4 space-y-4">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            ✨ {cfg.label}的专属心愿
          </p>
          <div className="flex flex-wrap gap-3">
            {COMMON_OPTIONS.map((opt) => {
              const isChecked = !!checked[opt.key];
              return (
                <label
                  key={opt.key}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all select-none ${
                    isChecked ? `${cfg.border} ${cfg.bg}` : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(opt.key)}
                    className="hidden" // 隐藏原生 checkbox，因为已经通过边框和背景色表示了选中状态
                  />
                  <span className="text-lg">{opt.emoji}</span>
                  <span className={`text-sm font-extrabold ${isChecked ? 'text-slate-900' : 'text-slate-600'}`}>{opt.title}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 自由文字输入 */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            ✍️ 还有别的心愿？直接说
          </p>
          <textarea
            rows={3}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={
              role === 'wife'
                ? '如：我想喝奶茶、今天有点累，少走路...'
                : role === 'friend'
                ? '如：我想吃海鲜、来一杯精酿啤酒...'
                : '如：买晕车药、中午要午休两小时...'
            }
            className="w-full bg-white border-2 border-slate-200 focus:border-amber-400 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 placeholder-slate-300 focus:outline-none transition-all resize-none leading-relaxed"
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 z-10">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 active:scale-[0.98] text-white font-black text-base shadow-lg shadow-amber-400/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                正在发送心愿...
              </>
            ) : (
              <>🤝 提交心愿，告诉规划者</>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
