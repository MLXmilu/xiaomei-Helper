import type { AppConstraints } from '../agentEngine';

/** 家人提交的偏好反馈结构 */
export interface CollabFeedback {
  id: string;
  submittedAt: string;
  submitterName: string; // "老婆" | "伙伴" | "长辈"
  role: 'wife' | 'friend' | 'elder';
  hasSlimming?: boolean;
  hasChild?: boolean;
  slowLife?: boolean;
  anniversaryFlower?: boolean;
  lazySleep?: boolean;
  thrillMystery?: boolean;
  socialDrink?: boolean;
  artGallery?: boolean;
  limitedStamina?: boolean;
  lightNutritious?: boolean;
  medicineEmergency?: boolean;
  customText?: string;
}

const LS_PREFIX = 'meituan_collab_';
const CHANNEL_PREFIX = 'collab_';

/** 生成唯一 Session ID */
export function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** 将 AppConstraints 编码为 base64 URL 安全字符串 */
export function encodeConstraints(constraints: AppConstraints): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(constraints)));
  } catch {
    return '';
  }
}

/** 从 base64 字符串还原 AppConstraints */
export function decodeConstraints(encoded: string): AppConstraints | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
}

/** 构建家人专属的协同链接 */
export function buildCollabUrl(sessionId: string, constraints: AppConstraints): string {
  const encoded = encodeConstraints(constraints);
  const base = `${window.location.origin}/collab`;
  return `${base}#s=${sessionId}&d=${encoded}`;
}

/** 解析当前 hash 中的 sessionId 和 encoded data */
export function parseCollabHash(): { sessionId: string | null; encoded: string | null } {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  return { sessionId: params.get('s'), encoded: params.get('d') };
}

/** 家人端：提交反馈（写入 localStorage + BroadcastChannel 广播） */
export function writeFeedback(sessionId: string, feedback: CollabFeedback): void {
  const existing = readFeedbacks(sessionId);
  existing.push(feedback);
  localStorage.setItem(LS_PREFIX + sessionId, JSON.stringify(existing));

  // 同浏览器跨 Tab 实时通知
  try {
    const channel = new BroadcastChannel(CHANNEL_PREFIX + sessionId);
    channel.postMessage({ type: 'new_feedback', feedback });
    setTimeout(() => channel.close(), 200);
  } catch {
    // BroadcastChannel 不支持时静默失败
  }
}

/** 规划者端：读取指定 session 的所有反馈 */
export function readFeedbacks(sessionId: string): CollabFeedback[] {
  try {
    const raw = localStorage.getItem(LS_PREFIX + sessionId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 清除指定 session 的所有反馈 */
export function clearFeedbacks(sessionId: string): void {
  localStorage.removeItem(LS_PREFIX + sessionId);
}

/** 订阅 BroadcastChannel，返回取消订阅函数 */
export function subscribeFeedbackChannel(
  sessionId: string,
  onFeedback: (feedback: CollabFeedback) => void
): () => void {
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL_PREFIX + sessionId);
    channel.onmessage = (evt) => {
      if (evt.data?.type === 'new_feedback' && evt.data.feedback) {
        onFeedback(evt.data.feedback as CollabFeedback);
      }
    };
  } catch {
    // BroadcastChannel 不支持
  }
  return () => {
    try { channel?.close(); } catch { /* ignore */ }
  };
}
