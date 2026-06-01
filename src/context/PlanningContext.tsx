import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { generateSessionId } from '../lib/collabStore';
import {
  parseNaturalLanguageQuery,
  generateSmartPlan,
  executePlanTools,
  type AppConstraints,
  type ActivityPlan,
  type ThoughtLog,
} from '../agentEngine';
import { MOCK_LOCATIONS } from '../mockData';
import { formatProfileSummary } from '../constants/travelProfiles';

export interface HistoryItem {
  id: number;
  query: string;
  plan: ActivityPlan;
  constraints: AppConstraints;
  timestamp: string;
  /** 是否为 AI 联网对话产生的记录（决策历史仅展示此类） */
  isAi: boolean;
  /** AI 对话摘要，用于历史列表展示 */
  aiLogs?: ThoughtLog[];
}

interface ConfettiParticle {
  id: number;
  left: string;
  color: string;
  delay: string;
  size: string;
}

interface PlanningContextValue {
  query: string;
  setQuery: (q: string) => void;
  constraints: AppConstraints | null;
  plan: ActivityPlan | null;
  logs: ThoughtLog[];
  isExecuting: boolean;
  executeSuccess: boolean;
  showShareModal: boolean;
  setShowShareModal: (v: boolean) => void;
  simulateError: boolean;
  setSimulateError: (v: boolean) => void;
  isLoading: boolean;
  useAi: boolean;
  setUseAi: (v: boolean) => void;
  showCashierModal: boolean;
  setShowCashierModal: (v: boolean) => void;
  isPaying: boolean;
  isListening: boolean;
  confetti: ConfettiParticle[];
  isPlanFromAi: boolean;
  historyList: HistoryItem[];
  showCollabModal: boolean;
  setShowCollabModal: (v: boolean) => void;
  openCollabModal: () => void;
  collabSessionId: string | null;
  handleCollabSubmit: (options: any) => void;
  handlePlan: (targetQuery: string, forceAiOption?: boolean) => Promise<void>;
  handlePlanPreset: (presetText: string) => Promise<void>;
  handleSwapOrder: () => void;
  handleShuffleNode: (nodeId: string, type: 'play' | 'eat') => void;
  handleRestoreHistory: (item: HistoryItem) => void;
  handleClearHistory: () => void;
  handleDeleteHistory: (ids: number[]) => void;
  handleOneClickBuy: () => Promise<void>;
  handlePaymentSubmit: () => Promise<void>;
  toggleListening: () => void;
}

const PlanningContext = createContext<PlanningContextValue | null>(null);

export function usePlanning() {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error('usePlanning must be used within PlanningProvider');
  return ctx;
}

export function PlanningProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [constraints, setConstraints] = useState<AppConstraints | null>(null);
  const [plan, setPlan] = useState<ActivityPlan | null>(null);
  const [logs, setLogs] = useState<ThoughtLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executeSuccess, setExecuteSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [simulateError, setSimulateError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const [showCashierModal, setShowCashierModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [isPlanFromAi, setIsPlanFromAi] = useState(false);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collabSessionId, setCollabSessionId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('meituan_ai_history');
      if (stored) {
        const parsed: HistoryItem[] = JSON.parse(stored);
        const aiOnly = parsed.filter(item => item.isAi === true);
        setHistoryList(aiOnly);
        if (aiOnly.length !== parsed.length) {
          localStorage.setItem('meituan_ai_history', JSON.stringify(aiOnly));
        }
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'zh-CN';
    rec.onstart = () => setIsListening(true);
    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      if (text) setQuery(prev => prev + text);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
  }, []);

  const triggerConfetti = () => {
    const colors = ['#FFD100', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'];
    setConfetti(Array.from({ length: 45 }).map(() => ({
      id: Math.random(),
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 1.5}s`,
      size: `${6 + Math.random() * 8}px`,
    })));
    setTimeout(() => setConfetti([]), 4500);
  };

  const handlePlan = useCallback(async (targetQuery: string, forceAiOption?: boolean) => {
    if (!targetQuery.trim()) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    setExecuteSuccess(false);
    setIsExecuting(false);
    const activeAi = forceAiOption !== undefined ? forceAiOption : useAi;

    if (activeAi) {
      setLogs([
        { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `👩‍💼 小美收到啦："${targetQuery}"` },
        { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `正在联网帮你挑合适的店和路线…` },
      ]);
    } else {
      setLogs([
        { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `👩‍💼 小美收到啦："${targetQuery}"` },
        { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `正在按附近热门路线帮你匹配…` },
      ]);
    }

    try {
      const parsed = await parseNaturalLanguageQuery(targetQuery, activeAi, (streamText) => {
        const cleanText = streamText.startsWith('🤔') ? streamText : streamText.replace(/```json|```/g, '').trim();
        setLogs([
          { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `👩‍💼 小美收到啦："${targetQuery}"` },
          { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `正在细化推荐…\n\n${cleanText}` },
        ]);
      }, controller.signal);
      setConstraints(parsed);
      const newPlan = generateSmartPlan(parsed);
      setPlan(newPlan);
      setIsPlanFromAi(activeAi);

      const logsToAdd: ThoughtLog[] = activeAi
        ? [
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `👩‍💼 已听懂你的安排："${targetQuery}"` },
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `已按「${formatProfileSummary(parsed)}」画像、离家 ${parsed.maxDistanceKm} 公里内挑好店。` },
          ]
        : [
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `👩‍💼 已听懂你的安排："${targetQuery}"` },
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `已在 ${parsed.maxDistanceKm} 公里内匹配好路线。` },
          ];
      logsToAdd.push({ timestamp: new Date().toLocaleTimeString(), type: 'success', message: `路线排好啦，地图已连线，需要的话可以直接全包下单。` });
      setLogs(logsToAdd);

      if (activeAi) {
        const newHistoryItem: HistoryItem = {
          id: Date.now(),
          query: targetQuery,
          plan: newPlan,
          constraints: parsed,
          timestamp: new Date().toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          isAi: true,
          aiLogs: logsToAdd,
        };
        setHistoryList(prev => {
          const updated = [newHistoryItem, ...prev.filter(i => i.query !== targetQuery)].slice(0, 20);
          localStorage.setItem('meituan_ai_history', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        setLogs([{ timestamp: new Date().toLocaleTimeString(), type: 'replan', message: `已暂停。改一改安排随时可以再试。` }]);
        setPlan(null);
        setConstraints(null);
        return;
      }
      // 规划失败时，清空当前页面缓存的残留行程数据，使地图与时间轴能够自然隐藏
      setPlan(null);
      setConstraints(null);
      setLogs([
        { timestamp: new Date().toLocaleTimeString(), type: 'error', message: `👩‍💼 管家小美非常抱歉…` },
        { timestamp: new Date().toLocaleTimeString(), type: 'error', message: `❌ 规划失败：${err.message || '网络不稳定，无法连接到规划服务'}` }
      ]);
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, [useAi]);

  const handlePlanPreset = useCallback(async (presetText: string) => {
    setQuery(presetText);
    await handlePlan(presetText);
  }, [handlePlan]);

  const handleCollabSubmit = useCallback((options: {
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
  }) => {
    if (!plan || !constraints) return;
    
    // 克隆当前的 nodes 和 constraints 副本
    let newNodes = [...constraints.nodes];
    let updatedConstraints = { ...constraints };
    let thoughtLogs: string[] = [];

    // ================== 老婆大人👸的场景妥协 ==================
    if (options.role === 'wife') {
      thoughtLogs.push(`👩‍💼 已收到老婆大人的微调心愿！`);
      
      // 1. 控糖减脂
      if (options.hasSlimming) {
        updatedConstraints.hasSlimming = true;
        // 把卡片中高卡路里的湊凑火锅(eat-6)或赤坂日式烧肉平替为青藤小院精致无糖素食馆(eat-4)
        newNodes = newNodes.map(n => {
          if (n.type === 'eat' && !n.name.includes('素食') && !n.name.includes('减脂')) {
            return {
              name: '青藤小院 · 精致无糖素食馆',
              description: '采用无糖配方与有机食材制作，低碳无脂无糖，控糖人士福音。',
              price: 140,
              duration: 75,
              tags: ['精致素食', '有机无糖', '低热量控糖'],
              position: [116.4755, 39.9510] as [number, number],
              type: 'eat',
              day: n.day || 1
            };
          }
          return n;
        });
        thoughtLogs.push(`🌱 已将就餐升级为【青藤小院 · 精致无糖素食馆】，有机控糖，餐人均摄入减少 65%！`);
      }

      // 2. 带娃省心
      if (options.hasChild) {
        updatedConstraints.hasChild = true;
        // 把首站或常规游玩点替换为顶级亲子奈尔宝游乐园(play-1)
        let replaced = false;
        newNodes = newNodes.map(n => {
          if (n.type === 'play' && !n.name.includes('奈尔宝') && !replaced) {
            replaced = true;
            return {
              name: '奈尔宝家庭中心 (蓝色港湾店)',
              description: '顶奢室内儿童乐园，配有全职看护与高安全性软包设计，让家长完全解放双手。',
              price: 198,
              duration: 120,
              tags: ['亲子乐园', '高安全性', '儿童最爱'],
              position: [116.479133, 39.953049] as [number, number],
              type: 'play',
              day: n.day || 1
            };
          }
          return n;
        });
        thoughtLogs.push(`👶 关爱儿童！已将首站平替为【奈尔宝家庭中心 (蓝色港湾店)】，适合低龄宝宝畅快玩耍！`);
      }

      // 3. 慢生活手作
      if (options.slowLife) {
        let replaced = false;
        newNodes = newNodes.map(n => {
          if (n.type === 'play' && !n.name.includes('手作') && !n.name.includes('奈尔宝') && !replaced) {
            replaced = true;
            return {
              name: '木木手工皮艺DIY工坊',
              description: '温馨静谧的手手工皮具工坊，专业老师辅导，适合情侣、闺蜜享受慢节奏手作。',
              price: 135,
              duration: 100,
              tags: ['DIY手作', '情侣推荐', '静心慢节奏'],
              position: [116.469145, 39.944208] as [number, number],
              type: 'play',
              day: n.day || 1
            };
          }
          return n;
        });
        thoughtLogs.push(`🎨 慢生活步调！下午行程平替为【木木手工皮艺DIY工坊】，静心手作慢度周末。`);
      }

      // 4. 一键闪送野兽派玫瑰花
      if (options.anniversaryFlower) {
        thoughtLogs.push(`🌹 制造浪漫！美团闪购已为您在【野兽派花艺】订购轻奢高颜值玫瑰，将于聚餐时由骑手闪送到店！`);
      }
    }

    // ================== 小伙伴们🧑‍🤝‍🧑的场景妥协 ==================
    if (options.role === 'friend') {
      thoughtLogs.push(`👩‍💼 已收到死党/闺蜜们的微调建议！`);
      
      // 1. 懒觉模式
      if (options.lazySleep) {
        thoughtLogs.push(`💤 开启懒觉模式！第一天出发起点时间已推迟到 10:30 AM，充足睡眠后再起航。`);
      }

      // 2. 刺激嗨玩密室
      if (options.thrillMystery) {
        updatedConstraints.isThrillFun = true;
        let replaced = false;
        newNodes = newNodes.map(n => {
          if (n.type === 'play' && !n.name.includes('密室') && !replaced) {
            replaced = true;
            return {
              name: '极客部落沉浸式密室 (微恐版)',
              description: '极具烧脑性的机械解密密室，真人NPC互动，解压心跳神作！',
              price: 158,
              duration: 90,
              tags: ['沉浸密室', '心跳刺激', '解压神作'],
              position: [116.488056, 39.948611] as [number, number],
              type: 'play',
              day: n.day || 1
            };
          }
          return n;
        });
        thoughtLogs.push(`🔑 心跳加速！游玩卡片平替为【极客部落沉浸式密室】，烧脑机关与NPC超强互动！`);
      }

      // 3. 社交小酌
      if (options.socialDrink) {
        newNodes = newNodes.map(n => {
          if (n.type === 'eat' && !n.name.includes('社交酒馆')) {
            return {
              name: '小木屋米酒屋 · 延边社交酒馆',
              description: '主打延边特色蓝莓米酒与辣鸡爪，把酒言欢，夜生活气氛极其热闹。',
              price: 110,
              duration: 90,
              tags: ['社交酒馆', '把酒言欢', '夜生活胜地'],
              position: [116.4830, 39.9560] as [number, number],
              type: 'eat',
              day: n.day || 1
            };
          }
          return n;
        });
        thoughtLogs.push(`🍶 把酒言欢！晚餐置换为【小木屋米酒屋 · 延边社交酒馆】，喝一口香甜微醺的特色蓝莓米酒！`);
      }

      // 4. 艺术展高颜值打卡
      if (options.artGallery) {
        let replaced = false;
        newNodes = newNodes.map(n => {
          if (n.type === 'play' && !n.name.includes('艺术展') && !n.name.includes('密室') && !replaced) {
            replaced = true;
            return {
              name: 'UCCA尤伦斯当代艺术中心展',
              description: '当前火爆的先锋艺术家中国首展，现场空间极具张力，拍照高颜值上镜。',
              price: 120,
              duration: 90,
              tags: ['潮流展览', '高颜值拍照', '男女聚会'],
              position: [116.493863, 39.986877] as [number, number],
              type: 'play',
              day: n.day || 1
            };
          }
          return n;
        });
        thoughtLogs.push(`🖼️ 拍照打卡！午后平替为【UCCA尤伦斯当代艺术中心展】，超高上镜度，制霸朋友圈。`);
      }
    }

    // ================== 随行长辈👴的场景妥协 ==================
    if (options.role === 'elder') {
      thoughtLogs.push(`👩‍💼 已收到随行长辈的养生叮嘱！`);

      // 1. 体力有限
      if (options.limitedStamina) {
        updatedConstraints.transportPreference = 'taxi'; // 长途出行强制打车
        thoughtLogs.push(`🚗 关怀体力！管家小美已将路线中的长距离步行彻底优化，全线更换为美团打车无缝接送！`);
      }

      // 2. 清淡养生
      if (options.lightNutritious) {
        newNodes = newNodes.map(n => {
          if (n.type === 'eat' && !n.name.includes('西贝')) {
            return {
              name: '西贝莜面村 (家庭亲子餐厅)',
              description: '主打少油低脂天然莜面，承诺不加香精色素，温热清汤极好消化。',
              price: 95,
              duration: 70,
              tags: ['无香精色素', '温热养生', '适合长辈'],
              position: [116.4795, 39.9535] as [number, number],
              type: 'eat',
              day: n.day || 1
            };
          }
          return n;
        });
        thoughtLogs.push(`🍲 养生清淡！聚餐置换为【西贝莜面村】，少油低脂，天然好面暖胃好消化！`);
      }

      // 3. 药箱防备
      if (options.medicineEmergency) {
        thoughtLogs.push(`💊 医疗保备！已在美团买药【24小时药急送】订购晕车片、防蚊凉感贴等，由骑手极速15分钟内送达！`);
      }
    }

    // ================== ✍️ 智能自由文本意图提取引擎 ==================
    if (options.customText && options.customText.trim()) {
      const text = options.customText.toLowerCase();
      thoughtLogs.push(`💬 接收到家人文字心愿：「${options.customText}」`);
      
      // A. 正则匹配“累/回家/休息” -> 截断后续行程
      if (/(累|疲|回家|休息|走不动|退|不走)/.test(text)) {
        if (newNodes.length > 2) {
          newNodes = newNodes.slice(0, 2); // 砍掉后续游玩，只留首站和吃饭，直接缩减
          thoughtLogs.push(`🛌 小美体贴入微：已为您截断并舍弃了后续高体力的游玩行程，让全家人早早休整！`);
        }
      }
      // B. 正则匹配“奶茶/喝的/茶百道” -> 自动拼单奶茶外卖
      else if (/(奶茶|喝|奶绿|甜品|茶百道|霸王茶姬|瑞幸|咖啡|喜茶)/.test(text)) {
        thoughtLogs.push(`🧋 幸福加餐！小美已通过美团闪购拼单【霸王茶姬 · 伯牙绝弦奶茶】，外卖将于聚餐时火速闪送到店！`);
      }
      // C. 正则匹配“海鲜/烧肉/日料” -> 平替烧肉店
      else if (/(海鲜|烧肉|烤肉|日料|寿司|肉)/.test(text)) {
        newNodes = newNodes.map(n => {
          if (n.type === 'eat' && !n.name.includes('烧肉')) {
            return {
              name: '赤坂炙烤 · 潮流日式烧肉店',
              description: '工业风烤肉排队王，M9和牛雪花排与厚切牛舌，油脂丰盛，极度解馋！',
              price: 220,
              duration: 80,
              tags: ['和牛烧肉', '肉质极佳', '极度解馋'],
              position: [116.4812, 39.9548] as [number, number],
              type: 'eat',
              day: n.day || 1
            };
          }
          return n;
        });
        thoughtLogs.push(`🥩 馋肉啦！餐饮地标平替为【赤坂炙烤 · 潮流日式烧肉店】，和牛盛宴大口满足！`);
      }
      // D. 正则匹配“药/感冒/不舒服” -> 自动拼单买药
      else if (/(药|疼|感冒|晕|不舒服|腹|肚)/.test(text)) {
        thoughtLogs.push(`🩺 关怀备至！小美已通过【美团买药】为您加购了防暑感冒包与晕车贴，由美团专送15分钟内送达！`);
      }
    }

    // ================== 一键全家妥协，AI Re-planning 重构重算 ==================
    // 更新 constraints 的 nodes
    updatedConstraints.nodes = newNodes;
    setConstraints(updatedConstraints);

    // 重新规划并清空旧 Plan，触发 10ms 极智平替
    const finalPlan = generateSmartPlan(updatedConstraints);
    
    // 如果是懒觉模式，调整 Timeline 开头的第一天起跑时间
    if (options.lazySleep && finalPlan.timeline.length > 0) {
      let runMin = 10 * 60 + 30; // 10:30
      finalPlan.timeline.forEach((item) => {
        if (item.day === 1) {
          const hh = Math.floor(runMin / 60);
          const mm = Math.round(runMin % 60);
          item.time = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
          runMin += item.duration + (item.travelTimeToNext || 0);
        }
      });
    }

    setPlan(finalPlan);

    // 大屏情商 Thought Logs 流式打出
    const completeLogs: ThoughtLog[] = [
      { timestamp: new Date().toLocaleTimeString(), type: 'replan', message: `👨‍👩‍👧 正在为您解决家庭决策冲突，启动「全家大妥协」Re-planning 机制...` }
    ];
    thoughtLogs.forEach(msg => {
      completeLogs.push({ timestamp: new Date().toLocaleTimeString(), type: 'thought', message: msg });
    });
    completeLogs.push({ timestamp: new Date().toLocaleTimeString(), type: 'success', message: `🎉 达成共识！已重新计算高德路网、分天交通安排以及美团大收银台全包账单！` });
    setLogs(completeLogs);
    setShowCollabModal(false);
  }, [plan, constraints]);

  /** 打开协同Modal：自动生成或复用 SessionId */
  const openCollabModal = useCallback(() => {
    if (!collabSessionId) {
      setCollabSessionId(generateSessionId());
    }
    setShowCollabModal(true);
  }, [collabSessionId]);

  const handleSwapOrder = useCallback(() => {
    if (!plan || !constraints || plan.timeline.length < 3) return;
    const node1 = plan.timeline[1].node;
    const node2 = plan.timeline[2].node;
    const nodeNames = constraints.nodes.map(n => n.name);
    const idx1 = nodeNames.indexOf(node1.name);
    const idx2 = nodeNames.indexOf(node2.name);
    if (idx1 !== -1 && idx2 !== -1) {
      const newNodes = [...constraints.nodes];
      [newNodes[idx1], newNodes[idx2]] = [newNodes[idx2], newNodes[idx1]];
      const updated = { ...constraints, nodes: newNodes };
      setConstraints(updated);
      setPlan(generateSmartPlan(updated));
    } else {
      setPlan(generateSmartPlan(constraints, [node2.name, node1.name]));
    }
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'replan', message: `🔄 已调换景点顺序，智能错开高峰就餐时间！` }]);
  }, [plan, constraints]);

  const handleShuffleNode = useCallback((nodeId: string, type: 'play' | 'eat') => {
    if (!plan || !constraints) return;
    const timelineItem = plan.timeline.find(t => t.node.id === nodeId);
    if (!timelineItem) return;
    const currentNode = timelineItem.node;
    const isBeijingRoute = constraints.maxDistanceKm >= 30 || constraints.nodes.some(n => /(天坛|故宫|颐和园|北京)/.test(n.name));

    let candidates: any[] = [];
    if (isBeijingRoute) {
      candidates = type === 'play'
        ? [
            { name: '景山公园', description: '登顶万春亭俯瞰紫禁城全景。', price: 2, duration: 60, tags: ['俯瞰故宫'], position: [116.4, 39.923], type: 'play' },
            { name: '北海公园', description: '游览白塔与九龙壁。', price: 10, duration: 90, tags: ['皇家园林'], position: [116.388, 39.927], type: 'play' },
            { name: '圆明园遗址公园', description: '凭吊西洋楼遗址。', price: 25, duration: 120, tags: ['历史遗迹'], position: [116.302, 40.007], type: 'play' },
          ]
        : [
            { name: '四季民福烤鸭店 (故宫店)', description: '正宗挂炉烤鸭。', price: 120, duration: 80, tags: ['挂炉烤鸭'], position: [116.406, 39.916], type: 'eat' },
            { name: '东来顺 (天坛老字号店)', description: '百年铜锅涮肉。', price: 110, duration: 75, tags: ['铜锅涮肉'], position: [116.413, 39.878], type: 'eat' },
            { name: '素虎素食 (中关村店)', description: '高端轻食净素馆。', price: 130, duration: 80, tags: ['低热量控糖'], position: [116.315, 39.982], type: 'eat' },
          ];
      if (type === 'eat' && constraints.hasSlimming) {
        const slim = candidates.filter(c => c.tags.some((t: string) => t.includes('低') || t.includes('素')));
        if (slim.length > 0) candidates = slim;
      }
    } else {
      candidates = MOCK_LOCATIONS.filter(n => {
        if (n.type !== type || n.id === currentNode.id) return false;
        const dist = Math.sqrt(Math.pow(n.coords.x - currentNode.coords.x, 2) + Math.pow(n.coords.y - currentNode.coords.y, 2)) * 0.05;
        if (dist > constraints.maxDistanceKm) return false;
        if (type === 'play' && constraints.hasChild && !n.suitableFor.includes('child')) return false;
        if (type === 'eat' && constraints.hasSlimming && !n.suitableFor.includes('slimming')) return false;
        return true;
      });
    }
    candidates = candidates.filter(c => !constraints.nodes.some(ex => ex.name === c.name));
    if (candidates.length === 0) { alert('暂无更多符合条件的平替选项～'); return; }
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    const updatedNodes = constraints.nodes.map(n => n.name === currentNode.name ? { ...picked } : n);
    const updated = { ...constraints, nodes: updatedNodes };
    setConstraints(updated);
    setPlan(generateSmartPlan(updated));
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `🔍 已平替为「${picked.name}」，重新计算行程连线！` }]);
  }, [plan, constraints]);

  const handleRestoreHistory = useCallback((item: HistoryItem) => {
    setConstraints(item.constraints);
    setPlan(item.plan);
    setQuery(item.query);
    setLogs([{ timestamp: new Date().toLocaleTimeString(), type: 'replan', message: `🕰️ 已回溯至「${item.query}」的精选方案！` }]);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistoryList([]);
    localStorage.removeItem('meituan_ai_history');
  }, []);

  const handleDeleteHistory = useCallback((ids: number[]) => {
    setHistoryList(prev => {
      const updated = prev.filter(item => !ids.includes(item.id));
      localStorage.setItem('meituan_ai_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleOneClickBuy = useCallback(async () => {
    if (!plan || !constraints) return;
    setIsExecuting(true);
    setExecuteSuccess(false);
    const result = await executePlanTools(plan, constraints, (updatedTimeline, updatedLogs) => {
      setPlan(prev => prev ? { ...prev, timeline: updatedTimeline } : null);
      setLogs(updatedLogs);
    }, simulateError);
    setIsExecuting(false);
    if (result.success) {
      setPlan(result.finalPlan);
      setExecuteSuccess(true);
      setTimeout(() => setShowShareModal(true), 700);
    }
  }, [plan, constraints, simulateError]);

  const handlePaymentSubmit = useCallback(async () => {
    setIsPaying(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsPaying(false);
    setShowCashierModal(false);
    triggerConfetti();
    await handleOneClickBuy();
  }, [handleOneClickBuy]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) { alert('请使用 Chrome 或 Edge 浏览器。'); return; }
    if (isListening) recognitionRef.current.stop();
    else { try { recognitionRef.current.start(); } catch { /* ignore */ } }
  }, [isListening]);

  return (
    <PlanningContext.Provider value={{
      query, setQuery, constraints, plan, logs, isExecuting, executeSuccess,
      showShareModal, setShowShareModal, simulateError, setSimulateError,
      isLoading, useAi, setUseAi, showCashierModal, setShowCashierModal,
      isPaying, isListening, confetti, isPlanFromAi, historyList,
      showCollabModal, setShowCollabModal, openCollabModal, collabSessionId, handleCollabSubmit,
      handlePlan, handlePlanPreset, handleSwapOrder, handleShuffleNode,
      handleRestoreHistory, handleClearHistory, handleDeleteHistory, handleOneClickBuy,
      handlePaymentSubmit, toggleListening,
    }}>
      {children}
    </PlanningContext.Provider>
  );
}
