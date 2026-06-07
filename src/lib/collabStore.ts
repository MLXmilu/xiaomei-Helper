import type { AppConstraints } from '../agentEngine';

// 由 Vite 自动注入的本机局域网 IP
declare const __LOCAL_IP__: string;

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
  photoSpot?: boolean; // 拍照出片
  budgetLimit?: boolean; // 预算有限
  petFriendly?: boolean; // 宠物友好
  avoidCrowd?: boolean; // 避开人流
  localSnack?: boolean; // 特色小吃
  needCoffee?: boolean; // 咖啡续命
  customText?: string;
}

const LS_PREFIX = 'meituan_collab_';

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
    const parsed = JSON.parse(decodeURIComponent(atob(encoded)));
    if (parsed.q !== undefined && parsed.n !== undefined) {
      // 兼容极简模式
      return {
        originalQuery: parsed.q,
        nodes: parsed.n.map((node: any) => ({
          name: node.n,
          type: node.t || 'play',
          duration: 0,
          price: 0
        }))
      } as AppConstraints;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** 构建家人专属的协同链接 */
export function buildCollabUrl(sessionId: string, constraints: AppConstraints): string {
  // 极简提取协同页面展示所必需的字段，使用极简的 key 并且截断长度，以防二维码过密扫不出来
  const lightweightConstraints = {
    q: constraints.originalQuery ? constraints.originalQuery.slice(0, 15) : '',
    n: constraints.nodes.slice(0, 4).map(n => ({
      n: n.name.slice(0, 10),
      t: n.type
    }))
  };
  const encoded = encodeConstraints(lightweightConstraints as any);
  // 使用真实的局域网 IP（开发模式）或公网 URL（生产模式）
  const base = import.meta.env.PROD
    ? `${window.location.origin}/collab`
    : `http://${typeof __LOCAL_IP__ !== 'undefined' ? __LOCAL_IP__ : window.location.hostname}:${window.location.port || 5173}/collab`;
  return `${base}#s=${sessionId}&d=${encoded}`;
}

/** 解析当前 hash 中的 sessionId 和 encoded data */
export function parseCollabHash(): { sessionId: string | null; encoded: string | null } {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  return { sessionId: params.get('s'), encoded: params.get('d') };
}

/** 家人端：提交反馈（真实发送到局域网 API） */
export async function writeFeedback(sessionId: string, feedback: CollabFeedback): Promise<void> {
  // 仍然保留一份在本地，防止断网时崩溃
  const existing = readFeedbacks(sessionId);
  existing.push(feedback);
  localStorage.setItem(LS_PREFIX + sessionId, JSON.stringify(existing));

  // 跨设备核心：发往 Vite 后端 API
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    await fetch(`${apiUrl}/api/feedback/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    });
  } catch {
    console.error('Failed to sync feedback to PC');
  }
}

/** 规划者端：读取本地缓存的反馈（现在主要作为备用） */
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

/** 订阅 API 轮询，返回取消订阅函数 */
export function subscribeFeedbackChannel(
  sessionId: string,
  onFeedback: (feedback: CollabFeedback) => void
): () => void {
  let isCancelled = false;
  let seenIds = new Set<string>();

  const poll = async () => {
    if (isCancelled) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/feedback/${sessionId}`);
      if (res.ok) {
        const data: CollabFeedback[] = await res.json();
        data.forEach(rawFb => {
          let fb: CollabFeedback;
          try {
            fb = typeof rawFb === 'string' ? JSON.parse(rawFb) : rawFb;
          } catch {
            return;
          }
          if (fb && !seenIds.has(fb.id)) {
            seenIds.add(fb.id);
            onFeedback(fb);
          }
        });
      }
    } catch {
      // ignore
    }
    if (!isCancelled) {
      setTimeout(poll, 1500); // 每 1.5 秒轮询一次
    }
  };

  poll();

  return () => {
    isCancelled = true;
  };
}
