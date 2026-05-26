import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import {
  parseNaturalLanguageQuery,
  generateSmartPlan,
  executePlanTools,
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
  handlePlan: (targetQuery: string, forceAiOption?: boolean) => Promise<void>;
  handlePlanPreset: (presetText: string) => Promise<void>;
  handleSwapOrder: () => void;
  handleShuffleNode: (nodeId: string, type: 'play' | 'eat') => void;
  handleRestoreHistory: (item: HistoryItem) => void;
  handleClearHistory: () => void;
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

  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('meituan_ai_history');
      if (stored) setHistoryList(JSON.parse(stored));
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
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `已按${parsed.hasChild ? '带娃、' : ''}${parsed.hasSlimming ? '低卡、' : ''}${parsed.isFriendsGroup ? '聚会、' : ''}离家 ${parsed.maxDistanceKm} 公里内挑好店。` },
          ]
        : [
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `👩‍💼 已听懂你的安排："${targetQuery}"` },
            { timestamp: new Date().toLocaleTimeString(), type: 'thought', message: `已在 ${parsed.maxDistanceKm} 公里内匹配好路线。` },
          ];
      logsToAdd.push({ timestamp: new Date().toLocaleTimeString(), type: 'success', message: `路线排好啦，地图已连线，需要的话可以直接全包下单。` });
      setLogs(logsToAdd);

      const newHistoryItem: HistoryItem = { id: Date.now(), query: targetQuery, plan: newPlan, constraints: parsed, timestamp: new Date().toLocaleTimeString() };
      setHistoryList(prev => {
        const updated = [newHistoryItem, ...prev.filter(i => i.query !== targetQuery)].slice(0, 6);
        localStorage.setItem('meituan_ai_history', JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        setLogs([{ timestamp: new Date().toLocaleTimeString(), type: 'replan', message: `已暂停。改一改安排随时可以再试。` }]);
        setPlan(null);
        setConstraints(null);
        return;
      }
      setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type: 'error', message: `网络不太稳，已先用附近常用路线帮你排好。` }]);
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, [useAi]);

  const handlePlanPreset = useCallback(async (presetText: string) => {
    setQuery(presetText);
    await handlePlan(presetText);
  }, [handlePlan]);

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
      handlePlan, handlePlanPreset, handleSwapOrder, handleShuffleNode,
      handleRestoreHistory, handleClearHistory, handleOneClickBuy,
      handlePaymentSubmit, toggleListening,
    }}>
      {children}
    </PlanningContext.Provider>
  );
}
