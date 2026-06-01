import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink, Users, Clock, Zap } from 'lucide-react';
import { usePlanning } from '../../context/PlanningContext';
import {
  buildCollabUrl,
  readFeedbacks,
  subscribeFeedbackChannel,
  type CollabFeedback,
} from '../../lib/collabStore';

const ROLE_EMOJI: Record<string, string> = {
  wife: '👸',
  friend: '🧑‍🤝‍🧑',
  elder: '👴',
};
const ROLE_COLOR: Record<string, string> = {
  wife: 'border-rose-200 bg-rose-50 text-rose-800',
  friend: 'border-blue-200 bg-blue-50 text-blue-800',
  elder: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

/** 从 feedback 还原显示文字 */
function buildFeedbackSummary(fb: CollabFeedback): string[] {
  const items: string[] = [];
  if (fb.hasSlimming) items.push('🥗 控糖减肥');
  if (fb.hasChild) items.push('👶 带娃省心');
  if (fb.slowLife) items.push('🎨 手作慢生活');
  if (fb.anniversaryFlower) items.push('🌹 纪念日惊喜');
  if (fb.lazySleep) items.push('😴 懒觉模式');
  if (fb.thrillMystery) items.push('🔑 刺激密室');
  if (fb.socialDrink) items.push('🍶 社交小酌');
  if (fb.artGallery) items.push('🖼️ 潮流展览');
  if (fb.limitedStamina) items.push('🚗 体力有限');
  if (fb.lightNutritious) items.push('🍲 清淡暖胃');
  if (fb.medicineEmergency) items.push('💊 备齐常用药');
  if (fb.customText) items.push(`✍️ "${fb.customText}"`);
  return items;
}

export function CollabModal() {
  const {
    showCollabModal,
    setShowCollabModal,
    collabSessionId,
    constraints,
    handleCollabSubmit,
    plan,
  } = usePlanning();

  const [feedbacks, setFeedbacks] = useState<CollabFeedback[]>([]);
  const [copied, setCopied] = useState(false);
  const [applyingIdx, setApplyingIdx] = useState<number | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const collabUrl =
    collabSessionId && constraints
      ? buildCollabUrl(collabSessionId, constraints)
      : '';

  // 初始化：订阅 BroadcastChannel + 定期轮询 localStorage
  useEffect(() => {
    if (!showCollabModal || !collabSessionId) return;

    // 立刻读取已有反馈（防止 Tab 已经提交过的）
    setFeedbacks(readFeedbacks(collabSessionId));

    // BroadcastChannel（同浏览器实时推送）
    unsubRef.current = subscribeFeedbackChannel(collabSessionId, (fb) => {
      setFeedbacks((prev) => {
        if (prev.some((f) => f.id === fb.id)) return prev;
        return [...prev, fb];
      });
    });

    // 轮询（跨设备 fallback）
    pollRef.current = setInterval(() => {
      const latest = readFeedbacks(collabSessionId);
      setFeedbacks((prev) => {
        if (latest.length !== prev.length) return latest;
        return prev;
      });
    }, 2000);

    return () => {
      unsubRef.current?.();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [showCollabModal, collabSessionId]);

  const handleCopyLink = useCallback(async () => {
    if (!collabUrl) return;
    try {
      await navigator.clipboard.writeText(collabUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt('复制以下链接：', collabUrl);
    }
  }, [collabUrl]);

  const handleOpenNewTab = useCallback(() => {
    if (collabUrl) window.open(collabUrl, '_blank', 'noopener');
  }, [collabUrl]);

  const handleApply = useCallback(
    async (fb: CollabFeedback, idx: number) => {
      setApplyingIdx(idx);
      await new Promise((r) => setTimeout(r, 400));
      handleCollabSubmit(fb);
      setApplyingIdx(null);
    },
    [handleCollabSubmit]
  );

  const handleClose = useCallback(() => {
    setShowCollabModal(false);
    setFeedbacks([]);
  }, [setShowCollabModal]);

  if (!showCollabModal || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* 顶部渐变标题栏 */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-7 py-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-amber-900/70 uppercase tracking-widest">Multi-user Collaborative</p>
            <h2 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
              <Users className="w-5 h-5" />
              邀请家人协同规划
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer border border-white/30"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6 grid sm:grid-cols-[1fr_auto] gap-6">
          {/* 左：功能区域 */}
          <div className="space-y-5 min-w-0">
            {/* 链接复制 */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🔗 专属协同链接</p>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-500 truncate">
                  {collabUrl || '生成中...'}
                </div>
                <button
                  onClick={handleCopyLink}
                  disabled={!collabUrl}
                  className="px-3 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-800 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border border-amber-500 disabled:opacity-40"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>

            {/* 演示入口：新标签页 */}
            <button
              onClick={handleOpenNewTab}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white transition-all cursor-pointer border border-slate-700 group"
            >
              <div className="text-left">
                <p className="text-xs font-black flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  用新标签页模拟家人设备
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  点击后在新标签填写偏好，实时通知此页面
                </p>
              </div>
              <span className="text-amber-400 text-lg group-hover:translate-x-1 transition-transform">→</span>
            </button>

            {/* 等待 / 反馈区域 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  💬 家人反馈
                </p>
                {feedbacks.length > 0 && (
                  <span className="bg-amber-400 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded-full">
                    {feedbacks.length} 条新消息
                  </span>
                )}
              </div>

              {feedbacks.length === 0 ? (
                /* 等待动画 */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl py-7 flex flex-col items-center gap-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-amber-400"
                        style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    等待家人打开链接并提交心愿...
                  </p>
                </div>
              ) : (
                /* 反馈卡片列表 */
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {feedbacks.map((fb, idx) => {
                    const summaryItems = buildFeedbackSummary(fb);
                    return (
                      <div
                        key={fb.id}
                        className={`border-2 rounded-2xl p-4 space-y-3 ${ROLE_COLOR[fb.role] || 'border-slate-200 bg-slate-50 text-slate-800'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black">
                            {ROLE_EMOJI[fb.role]} {fb.submitterName}的心愿
                          </span>
                          <span className="text-[10px] opacity-60 font-medium">{fb.submittedAt}</span>
                        </div>
                        {summaryItems.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {summaryItems.map((item, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-bold bg-white/60 border border-current/10 px-2 py-1 rounded-lg"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs opacity-60 font-medium">仅查看行程，无特殊要求</p>
                        )}
                        <button
                          onClick={() => handleApply(fb, idx)}
                          disabled={applyingIdx !== null}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {applyingIdx === idx ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              AI 重算中...
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              应用此心愿 · AI Re-planning
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 右：二维码 */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-start sm:self-auto">📲 扫码协同</p>
            <div className="bg-white border-2 border-amber-200 rounded-2xl p-3 shadow-md">
              {collabUrl ? (
                <QRCodeSVG
                  value={collabUrl}
                  size={148}
                  bgColor="#ffffff"
                  fgColor="#1e293b"
                  level="M"
                />
              ) : (
                <div className="w-[148px] h-[148px] bg-slate-100 rounded-xl animate-pulse" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold text-center max-w-[160px] leading-relaxed">
              家人扫码后<br/>可独立填写偏好
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
