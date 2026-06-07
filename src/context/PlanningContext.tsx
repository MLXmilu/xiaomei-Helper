import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { generateSessionId } from '../lib/collabStore';
import {
  parseNaturalLanguageQuery,
  generateSmartPlan,
  executePlanTools,
  generateAlternativeNode,
  type AppConstraints,
  type ActivityPlan,
  type ThoughtLog,
} from '../agentEngine';
import { MOCK_LOCATIONS } from '../mockData';

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
  handlePlan: (targetQuery: string, forceAiOption?: boolean, instantLoad?: boolean) => Promise<void>;
  handlePlanPreset: (presetText: string) => Promise<void>;
  handleMoveNode: (nodeId: string, direction: 'up' | 'down') => void;
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
  const [useAi, setUseAi] = useState(true);
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

  // 从后端拉取历史记录
  const fetchHistory = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/history`);
      if (res.ok) {
        const data: HistoryItem[] = await res.json();
        const aiOnly = data.filter(item => item.isAi === true);
        setHistoryList(aiOnly);
        // 为了防备断网或演示无后端环境，同时同步一份到 localStorage
        localStorage.setItem('meituan_ai_history', JSON.stringify(aiOnly));
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (e) {
      console.error('Failed to load history from DB, fallback to localStorage:', e);
      try {
        const stored = localStorage.getItem('meituan_ai_history');
        if (stored) {
          const parsed: HistoryItem[] = JSON.parse(stored);
          setHistoryList(parsed.filter(item => item.isAi === true));
        }
      } catch (err) {}
    }
  };

  useEffect(() => {
    fetchHistory();
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

  const handlePlan = useCallback(async (targetQuery: string, forceAiOption?: boolean, instantLoad?: boolean) => {
    if (!targetQuery.trim()) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    setExecuteSuccess(false);
    setIsExecuting(false);
    const activeAi = forceAiOption !== undefined ? forceAiOption : useAi;

    if (!instantLoad) {
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
    }

    try {
      let parsed: AppConstraints;
      if (instantLoad) {
        parsed = {
          originalQuery: targetQuery,
          durationHours: 5,
          durationDays: 1,
          targetCity: '北京市',
          departureCity: undefined,
          maxDistanceKm: 5,
          hasChild: true,
          hasSlimming: true,
          isFriendsGroup: false,
          isYouthVibe: false,
          isThrillFun: false,
          isCoupleDate: false,
          isChillRelax: false,
          isBudgetSaver: false,
          transportPreference: 'auto',
          deliveryRequests: [],
          nodes: [
            {
              name: '北京野生动物园',
              description: '适合带娃近距离看动物',
              price: 150,
              duration: 180,
              tags: ['带娃省心'],
              position: [116.32, 39.48],
              type: 'play',
              day: 1
            },
            {
              name: '素虎素食 (野生动物园附近店)',
              description: '低卡健康，适合减肥',
              price: 120,
              duration: 80,
              tags: ['低脂控糖'],
              position: [116.33, 39.49],
              type: 'eat',
              day: 1
            }
          ]
        };
      } else {
        parsed = await parseNaturalLanguageQuery(targetQuery, activeAi, (streamText) => {
          const cleanText = streamText.startsWith('🤔') ? streamText : streamText.replace(/```json|```/g, '').trim();
          setLogs([
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `👩‍💼 小美收到啦："${targetQuery}"` },
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `正在细化推荐…\n\n${cleanText}` },
          ]);
        }, controller.signal);
      }

      setConstraints(parsed);
      const newPlan = generateSmartPlan(parsed);
      setPlan(newPlan);
      setIsPlanFromAi(activeAi);

      const logsToAdd: ThoughtLog[] = activeAi
        ? [
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `👩‍💼 已听懂你的安排："${targetQuery}"` },
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `已按要求挑好店。` },
          ]
        : [
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `👩‍💼 已听懂你的安排："${targetQuery}"` },
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `已在附近匹配好路线。` },
          ];
      logsToAdd.push({ timestamp: new Date().toLocaleTimeString(), type: 'success', message: `路线排好啦，地图已连线，需要的话可以直接全包下单。` });
      setLogs(logsToAdd);

      const newHistoryId = Date.now();
      setCollabSessionId(String(newHistoryId));

      if (activeAi) {
        const newHistoryItem: HistoryItem = {
          id: newHistoryId,
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
        
        // 乐观更新前端状态并保存到 localStorage
        setHistoryList(prev => {
          const updated = [newHistoryItem, ...prev.filter(i => i.query !== targetQuery)].slice(0, 20);
          localStorage.setItem('meituan_ai_history', JSON.stringify(updated));
          return updated;
        });

        // 异步保存到后端数据库
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          fetch(`${apiUrl}/api/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newHistoryItem)
          }).catch(e => console.error('Failed to save history to DB', e));
        } catch (e) {}
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

  const handleCollabSubmit = useCallback((options: any) => {
    if (!plan || !constraints) return;
    
    const items: string[] = [];
    if (options.hasSlimming) items.push('控糖减肥');
    if (options.hasChild) items.push('带娃省心');
    if (options.slowLife) items.push('手作慢生活');
    if (options.anniversaryFlower) items.push('订花惊喜');
    if (options.lazySleep) items.push('睡懒觉晚点出发');
    if (options.thrillMystery) items.push('刺激嗨玩密室');
    if (options.socialDrink) items.push('社交酒馆小酌');
    if (options.artGallery) items.push('高颜值看展');
    if (options.limitedStamina) items.push('体力有限少走路');
    if (options.lightNutritious) items.push('清淡养生餐饮');
    if (options.medicineEmergency) items.push('备齐常用药');
    if (options.photoSpot) items.push('拍照出片');
    if (options.budgetLimit) items.push('预算有限');
    if (options.petFriendly) items.push('宠物友好');
    if (options.customText) items.push(options.customText);

    if (items.length === 0) {
      setShowCollabModal(false);
      return;
    }

    // 拼接到旧的 query 后
    const appendText = `同行人新加了需求：${items.join('、')}。请结合这些新要求对之前的方案进行重新规划调整！`;
    const newQuery = query ? `${query}。${appendText}` : appendText;
    
    setQuery(newQuery);
    setShowCollabModal(false);
    
    // 触发真实的 AI 重新规划
    handlePlan(newQuery, true);
  }, [plan, constraints, query, handlePlan]);

  /** 打开协同Modal：自动生成或复用 SessionId */
  const openCollabModal = useCallback(() => {
    if (!collabSessionId) {
      setCollabSessionId(generateSessionId());
    }
    setShowCollabModal(true);
  }, [collabSessionId]);

  const handleMoveNode = useCallback((nodeId: string, direction: 'up' | 'down') => {
    if (!plan || !constraints) return;
    const nodeNames = constraints.nodes.map(n => n.name);
    const idx = plan.timeline.findIndex(t => t.node.id === nodeId);
    if (idx === -1) return;
    const currentNodeName = plan.timeline[idx].node.name;
    const constraintIdx = nodeNames.indexOf(currentNodeName);
    if (constraintIdx === -1) return;

    const targetConstraintIdx = direction === 'up' ? constraintIdx - 1 : constraintIdx + 1;
    if (targetConstraintIdx < 0 || targetConstraintIdx >= constraints.nodes.length) return;

    const newNodes = [...constraints.nodes];
    [newNodes[constraintIdx], newNodes[targetConstraintIdx]] = [newNodes[targetConstraintIdx], newNodes[constraintIdx]];
    const updated = { ...constraints, nodes: newNodes };
    setConstraints(updated);
    setPlan(generateSmartPlan(updated));
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'replan', message: `🔄 已根据您的要求调整「${currentNodeName}」的游玩顺序！` }]);
  }, [plan, constraints]);

  const handleShuffleNode = useCallback(async (nodeId: string, type: 'play' | 'eat') => {
    if (!plan || !constraints) return;
    const timelineItem = plan.timeline.find(t => t.node.id === nodeId);
    if (!timelineItem) return;
    const currentNode = timelineItem.node;
    
    try {
      setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `🔄 正在联网为您智能寻找「${currentNode.name}」的绝佳平替...` }]);
      
      let picked: any = null;
      if (useAi) {
        const nodeToReplace = {
          name: currentNode.name,
          description: currentNode.description,
          price: currentNode.price,
          duration: currentNode.duration,
          tags: currentNode.tags || [],
          position: currentNode.position || [116.4, 39.9],
          type: type,
          day: timelineItem.day
        } as any;
        picked = await generateAlternativeNode(nodeToReplace, constraints, (streamText: string) => {
          const cleanText = streamText.replace(/```json|```/g, '').trim();
          setLogs(prev => [
            ...prev.slice(0, -1),
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `🧠 AI 正在构思平替方案：\n${cleanText}` }
          ]);
        });
      } else {
        // Fallback to local mock
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
        picked = candidates[Math.floor(Math.random() * candidates.length)];
      }

      const updatedNodes = constraints.nodes.map(n => n.name === currentNode.name ? picked : n);
      const updated = { ...constraints, nodes: updatedNodes };
      setConstraints(updated);
      setPlan(generateSmartPlan(updated));
      setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'success', message: `✨ 已将「${currentNode.name}」平替为「${picked.name}」，重新计算行程连线！` }]);
    } catch (e) {
      console.error(e);
      alert('AI 生成平替方案失败，请重试');
    }
  }, [plan, constraints, useAi]);

  const handleRestoreHistory = useCallback((item: HistoryItem) => {
    setConstraints(item.constraints);
    setPlan(item.plan);
    setQuery(item.query);
    setCollabSessionId(String(item.id));
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
      handlePlan, handlePlanPreset, handleMoveNode, handleShuffleNode,
      handleRestoreHistory, handleClearHistory, handleDeleteHistory, handleOneClickBuy,
      handlePaymentSubmit, toggleListening,
    }}>
      {children}
    </PlanningContext.Provider>
  );
}
