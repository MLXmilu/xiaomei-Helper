import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, ShoppingBag, 
  CheckCircle2, Info, Dumbbell, Baby, Users, Heart,
  Mic, MicOff, Loader2, Check
} from 'lucide-react';

import { 
  parseNaturalLanguageQuery, 
  generateSmartPlan, 
  executePlanTools, 
  generateShareText,
  type AppConstraints, 
  type ActivityPlan, 
  type ThoughtLog 
} from './agentEngine';

import { MapContainer } from './components/MapContainer';
import { TimelineCards } from './components/TimelineCards';
import { MOCK_LOCATIONS } from './mockData';

// 场景快速预设 (温馨极简版)
const PRESETS = [
  {
    label: "👨‍👩‍👦 亲子低卡家庭行",
    text: "带5岁娃 and 减肥老婆度过周六下午，求离家3公里内的安排"
  },
  {
    label: "🍻 朋友解压社交聚会",
    text: "周末朋友聚会，2男2女想玩点解压的，别跑太远，下午待个4小时左右"
  },
  {
    label: "🔥 避峰测试 (凑凑爆满)",
    text: "带减肥老婆去商圈转转，晚上去凑凑吃个火锅"
  }
];

export default function App() {
  const [query, setQuery] = useState("");
  const [constraints, setConstraints] = useState<AppConstraints | null>(null);
  const [plan, setPlan] = useState<ActivityPlan | null>(null);
  const [logs, setLogs] = useState<ThoughtLog[]>([]);
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [executeSuccess, setExecuteSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [simulateError, setSimulateError] = useState(false);

  // 新增的高精交互状态
  const [isLoading, setIsLoading] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const [showCashierModal, setShowCashierModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; left: string; color: string; delay: string; size: string }[]>([]);
  const [isPlanFromAi, setIsPlanFromAi] = useState(false);
  
  // 历史决策时光机状态
  const [historyList, setHistoryList] = useState<{
    id: number;
    query: string;
    plan: ActivityPlan;
    constraints: AppConstraints;
    timestamp: string;
  }[]>([]);
  
  const recognitionRef = useRef<any>(null);

  // 在挂载时从 localStorage 加载历史记录
  useEffect(() => {
    try {
      const stored = localStorage.getItem('meituan_ai_history');
      if (stored) {
        setHistoryList(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history list:", e);
    }
  }, []);

  // 默认加载第一个最核心的亲子减脂测试场景
  useEffect(() => {
    handlePlanPreset(PRESETS[0].text);
  }, []);

  // 语音识别听写初始化 (H5 原生 webkitSpeechRecognition)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'zh-CN';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setQuery(prev => prev + text);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // 切换语音听写状态
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("您的浏览器不支持语音识别功能，请尝试使用 Chrome 或 Edge 浏览器。");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Speech recognition failed to start:", err);
      }
    }
  };

  // 触发温馨支付成功撒花特效
  const triggerConfetti = () => {
    const colors = ['#FFD100', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'];
    const newConfetti = Array.from({ length: 45 }).map((_) => ({
      id: Math.random(),
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 1.5}s`,
      size: `${6 + Math.random() * 8}px`
    }));
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 4500);
  };

  // 执行规划逻辑 (异步 await 小米 API 或本地 Mock 分流)
  const handlePlan = async (targetQuery: string, forceAiOption?: boolean) => {
    if (!targetQuery.trim()) return;
    
    setIsLoading(true);
    setExecuteSuccess(false);
    setIsExecuting(false);

    const activeAi = forceAiOption !== undefined ? forceAiOption : useAi;

    // 瞬间拉起 CoT 旁白，带大语言模型 CoT 拟人感
    if (activeAi) {
      setLogs([
        { 
          timestamp: new Date().toLocaleTimeString(), 
          type: 'thought', 
          message: `👩‍💼 我是您的周末管家小美。已为您锁定出行心愿："${targetQuery}"。` 
        },
        { 
          timestamp: new Date().toLocaleTimeString(), 
          type: 'thought', 
          message: `🧠 正在为您倾听并调用小米 MIMO 旗舰大模型 (mimo-v2.5) 进行多目标决策与画像对齐...` 
        }
      ]);
    } else {
      setLogs([
        { 
          timestamp: new Date().toLocaleTimeString(), 
          type: 'thought', 
          message: `👩‍💼 我是您的周末管家小美。已为您锁定出行心愿："${targetQuery}"。` 
        },
        { 
          timestamp: new Date().toLocaleTimeString(), 
          type: 'thought', 
          message: `⚡ 已为您启用【经典 Mock / 本地极速】模式。正在基于本地预设与过滤规则，在 1 毫秒内为您智能匹配...` 
        }
      ]);
    }

    try {
      const parsed = await parseNaturalLanguageQuery(targetQuery, activeAi, (streamText) => {
        // 滤除可能吐出的 ```json 语法标记，如果是思维链则直接保留以呈现圆润的思考动态
        const cleanText = streamText.startsWith("🤔") ? streamText : streamText.replace(/```json|```/g, '').trim();
        setLogs([
          { 
            timestamp: new Date().toLocaleTimeString(), 
            type: 'thought', 
            message: `👩‍💼 我是您的周末管家小美。已为您锁定出行心愿："${targetQuery}"。` 
          },
          { 
            timestamp: new Date().toLocaleTimeString(), 
            type: 'thought', 
            message: `🧠 MIMO AI 正在进行多目标画像对齐与空间网络画线计算，冥想流式输出中...\n\n${cleanText}` 
          }
        ]);
      });
      setConstraints(parsed);

      const newPlan = generateSmartPlan(parsed);
      setPlan(newPlan);
      setIsPlanFromAi(activeAi);

      // 解析成功后的温暖反馈
      const logsToAdd: ThoughtLog[] = [];
      
      if (activeAi) {
        logsToAdd.push(
          { 
            timestamp: new Date().toLocaleTimeString(), 
            type: 'thought', 
            message: `👩‍💼 我是您的周末管家小美。已为您锁定出行心愿："${targetQuery}"。` 
          },
          { 
            timestamp: new Date().toLocaleTimeString(), 
            type: 'thought', 
            message: `🧠 大模型解析完毕！已精准锁定多画像维度 ── ${parsed.hasChild ? '👶带5岁宝宝(高安全性) ' : ''}${parsed.hasSlimming ? '🥗老婆在减肥(轻食低卡) ' : ''}${parsed.isFriendsGroup ? '🍻青年社交(朋友聚会) ' : ''}。智能过滤离家 ${parsed.maxDistanceKm}km 内商圈。` 
          }
        );

        if (parsed.nodes && parsed.nodes.length > 0) {
          const playNames = parsed.nodes.filter(n => n.type === 'play').map(n => n.name).join('、');
          const eatNames = parsed.nodes.filter(n => n.type === 'eat').map(n => n.name).join('、');
          const playText = playNames ? `🎪 游玩【${playNames}】` : '';
          const eatText = eatNames ? `🥗 用餐【${eatNames}】` : '';
          const connectText = playText && eatText ? ' ── ' : '';

          logsToAdd.push({
            timestamp: new Date().toLocaleTimeString(),
            type: 'thought',
            message: `🎯 MIMO AI 大脑为您特别定制地标：\n${playText}${connectText}${eatText}`
          });
        }
      } else {
        logsToAdd.push(
          { 
            timestamp: new Date().toLocaleTimeString(), 
            type: 'thought', 
            message: `👩‍💼 我是您的周末管家小美。已为您锁定出行心愿："${targetQuery}"。` 
          },
          { 
            timestamp: new Date().toLocaleTimeString(), 
            type: 'thought', 
            message: `⚡ 本地预设快速对齐成功！识别画像特征 ── ${parsed.hasChild ? '👶带孩子 ' : ''}${parsed.hasSlimming ? '🥗减肥 ' : ''}${parsed.isFriendsGroup ? '🍻朋友聚会 ' : ''}。过滤离家 ${parsed.maxDistanceKm}km 内经典地标。` 
          }
        );
      }

      logsToAdd.push({ 
        timestamp: new Date().toLocaleTimeString(), 
        type: 'success', 
        message: `小美已帮您无缝规划路线！现已自动为您规避了不适宜食物与爆满场景，高德 3D 物理折线已连接就绪，等候您全包订购！` 
      });

      setLogs(logsToAdd);

      // 静默保存成功方案至历史时光机
      const newHistoryItem = {
        id: Date.now(),
        query: targetQuery,
        plan: newPlan,
        constraints: parsed,
        timestamp: new Date().toLocaleTimeString()
      };
      setHistoryList(prev => {
        const filtered = prev.filter(item => item.query !== targetQuery);
        const updated = [newHistoryItem, ...filtered].slice(0, 6);
        localStorage.setItem('meituan_ai_history', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error(err);
      setLogs(prev => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          message: `⚠️ 网络握手异常或大模型超时，小美已为您无缝降级至本地轻量正则处理器进行意图提取！`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 触发快捷预设词
  const handlePlanPreset = async (presetText: string) => {
    setQuery(presetText);
    await handlePlan(presetText);
  };

  // 调换吃玩顺序 (即时重规划演示)
  const handleSwapOrder = () => {
    if (!plan || !constraints) return;
    if (plan.timeline.length < 3) return;

    // 调换 timeline 中 index === 1 和 index === 2 的两个节点的顺序（在 nodes 中）
    const node1 = plan.timeline[1].node;
    const node2 = plan.timeline[2].node;

    // 找出 constraints.nodes 中这两个节点的索引并交换
    const nodeNames = constraints.nodes.map(n => n.name);
    const idx1 = nodeNames.indexOf(node1.name);
    const idx2 = nodeNames.indexOf(node2.name);

    if (idx1 !== -1 && idx2 !== -1) {
      const newNodes = [...constraints.nodes];
      const temp = newNodes[idx1];
      newNodes[idx1] = newNodes[idx2];
      newNodes[idx2] = temp;
      
      const updatedConstraints = {
        ...constraints,
        nodes: newNodes
      };
      setConstraints(updatedConstraints);
      const rePlanned = generateSmartPlan(updatedConstraints);
      setPlan(rePlanned);
    } else {
      // 降级使用 name 调换
      const rePlanned = generateSmartPlan(constraints, [node2.name, node1.name]);
      setPlan(rePlanned);
    }

    const timeStr = new Date().toLocaleTimeString();
    setLogs(prev => [
      ...prev,
      { 
        timestamp: timeStr, 
        type: 'replan', 
        message: `🔄 小美收到您的临时调整啦：已帮您把前两个景点的行程顺序进行了调换。同时智能错开高峰就餐时间，避开不必要的排队！` 
      }
    ]);
  };

  // 景点/餐饮 快速“换一批” (动态局域洗牌)
  const handleShuffleNode = (nodeId: string, type: 'play' | 'eat') => {
    if (!plan || !constraints) return;

    // 先找出当前这个被点击的节点的详情
    const timelineItem = plan.timeline.find(t => t.node.id === nodeId);
    if (!timelineItem) return;
    const currentNode = timelineItem.node;

    // 我们来判定是否是北京跨区大路线 (判断是否有天坛、故宫、颐和园之类或者 maxDistanceKm >= 30)
    const isBeijingRoute = constraints.maxDistanceKm >= 30 || constraints.nodes.some(n => /(天坛|故宫|颐和园|北京)/.test(n.name));

    let candidates: any[] = [];

    if (isBeijingRoute) {
      // 北京经典路线的平替库，提供极其对味的、令人惊艳的高端定制体验！
      if (type === 'play') {
        candidates = [
          {
            name: '景山公园',
            description: '登顶万春亭俯瞰紫禁城全景，中轴线上的极致视觉震撼。',
            price: 2,
            duration: 60,
            tags: ['俯瞰故宫', '历史名园', '摄影胜地', '绝佳视野'],
            position: [116.4000, 39.9230],
            type: 'play'
          },
          {
            name: '北海公园',
            description: '听一首《让我们荡起双桨》，游览白塔与九龙壁的江南风韵。',
            price: 10,
            duration: 90,
            tags: ['皇家园林', '泛舟白塔', '九龙壁'],
            position: [116.3880, 39.9270],
            type: 'play'
          },
          {
            name: '圆明园遗址公园',
            description: '凭吊西洋楼遗址，回望万园之园的历史沧桑，极具游学意义。',
            price: 25,
            duration: 120,
            tags: ['爱国主义教育', '历史遗迹', '荷花胜地'],
            position: [116.3020, 40.0070],
            type: 'play'
          },
          {
            name: '恭王府',
            description: '“一座恭王府，半部清代史”，探寻和珅豪宅的万福流云之谜。',
            price: 40,
            duration: 100,
            tags: ['王府文化', '天下第一福', '精美园林'],
            position: [116.3840, 39.9370],
            type: 'play'
          }
        ];
      } else {
        // 餐饮平替
        candidates = [
          {
            name: '四季民福烤鸭店 (故宫店)',
            description: '一边欣赏故宫东华门红墙，一边品尝正宗酥香嫩滑的挂炉烤鸭。',
            price: 120,
            duration: 80,
            tags: ['故宫红墙景观', '正宗挂炉烤鸭', '北京排队狂魔'],
            position: [116.4060, 39.9160],
            type: 'eat'
          },
          {
            name: '东来顺 (天坛老字号店)',
            description: '百年老字号，铜锅清水，手切鲜羊肉，辅以秘制麻酱，地道京味。',
            price: 110,
            duration: 75,
            tags: ['百年非遗', '手切鲜羊肉', '纯正铜锅涮肉'],
            position: [116.4130, 39.8780],
            type: 'eat'
          },
          {
            name: '局气 (前门老北京创意菜)',
            description: '以老北京文化为主题的创意菜馆，尝尝蜂窝煤炒饭与局气豆腐。',
            price: 85,
            duration: 80,
            tags: ['创意北京菜', '老北京胡同文化', '拍照网红菜'],
            position: [116.3980, 39.8970],
            type: 'eat'
          },
          {
            name: '素虎素食 (中关村店)',
            description: '距颐和园较近的高端轻食净素馆，精致养生，低卡无油负担。',
            price: 130,
            duration: 80,
            tags: ['高端素食', '少油无糖', '静谧雅致', '低热量控糖'],
            position: [116.3150, 39.9820],
            type: 'eat'
          }
        ];
      }

      // 根据画像过滤（非硬性，但有过滤更优）
      if (type === 'eat' && constraints.hasSlimming) {
        // 过滤出素食或低卡标签
        const slimmingCands = candidates.filter(c => c.tags.some((t: string) => t.includes('低') || t.includes('素') || t.includes('少油')));
        if (slimmingCands.length > 0) candidates = slimmingCands;
      }
    } else {
      // 普通朝阳公园路线平替库 (使用 MOCK_LOCATIONS)
      candidates = MOCK_LOCATIONS.filter(n => {
        if (n.type !== type || n.id === currentNode.id) return false;
        
        // 我们根据 Mock 局域坐标计算距离，保证平替在 maxDistance 范围内
        const dist = Math.sqrt(Math.pow(n.coords.x - currentNode.coords.x, 2) + Math.pow(n.coords.y - currentNode.coords.y, 2)) * 0.05;
        if (dist > constraints.maxDistanceKm) return false;

        if (type === 'play' && constraints.hasChild && !n.suitableFor.includes('child')) return false;
        if (type === 'eat' && constraints.hasSlimming && !n.suitableFor.includes('slimming')) return false;

        return true;
      });
    }

    // 剔除掉已经在 constraints.nodes 中存在的同名地标，避免重复
    candidates = candidates.filter(c => !constraints.nodes.some(ex => ex.name === c.name));

    if (candidates.length === 0) {
      alert(`小美在附近范围内暂无更多符合条件的温馨平替选项啦～`);
      return;
    }

    const randomPicked = candidates[Math.floor(Math.random() * candidates.length)];

    // 将 constraints.nodes 中对应节点替换
    const updatedNodes = constraints.nodes.map(n => {
      // 匹配被替换的节点名称或者位置
      if (n.name === currentNode.name) {
        return {
          name: randomPicked.name,
          description: randomPicked.description,
          price: randomPicked.price,
          duration: randomPicked.duration,
          tags: randomPicked.tags,
          position: randomPicked.position,
          type: randomPicked.type
        };
      }
      return n;
    });

    const updatedConstraints = {
      ...constraints,
      nodes: updatedNodes
    };
    
    setConstraints(updatedConstraints);

    const rePlanned = generateSmartPlan(updatedConstraints);
    setPlan(rePlanned);

    const timeStr = new Date().toLocaleTimeString();
    setLogs(prev => [
      ...prev,
      { 
        timestamp: timeStr, 
        type: 'thought', 
        message: `🔍 收到更换申请：小美已顺畅帮您平替为「${randomPicked.name}」，重新计算了行程连线与骑手配送参数，一切就绪！` 
      }
    ]);
  };

  // 回溯历史决策时光机方案
  const handleRestoreHistory = (item: { id: number, query: string, plan: ActivityPlan, constraints: AppConstraints, timestamp: string }) => {
    setConstraints(item.constraints);
    setPlan(item.plan);
    setQuery(item.query);
    
    const timeStr = new Date().toLocaleTimeString();
    setLogs([
      {
        timestamp: timeStr,
        type: 'replan',
        message: `🕰️ 时光机穿梭成功！小美已帮您完美回溯至上次对“${item.query}”的精选规划方案，高德地图连线与全包大账单已无缝复原！`
      }
    ]);
  };

  // 清空历史决策记录
  const handleClearHistory = () => {
    setHistoryList([]);
    localStorage.removeItem('meituan_ai_history');
  };

  // 一键全包购 (Mock API 批量事务 + 温馨管家重规划展示)
  const handleOneClickBuy = async () => {
    if (!plan || !constraints) return;

    setIsExecuting(true);
    setExecuteSuccess(false);

    const result = await executePlanTools(
      plan,
      constraints,
      (updatedTimeline, updatedLogs) => {
        // 润色 CoT 日志，变冰冷为温馨旁白
        const processedLogs = updatedLogs.map(log => {
          if (log.message.includes('发现隐式约束')) {
            return {
              ...log,
              message: `👩‍💼 管家小美提醒：正在为您锁定制定的家庭出行画像 [${constraints.hasChild ? '5岁小宝贝 ' : ''}${constraints.hasSlimming ? '低脂减肥老婆 ' : ''}]。安全健康第一！`
            };
          }
          if (log.message.includes('[API EXCEPTION]')) {
            return {
              ...log,
              message: `⚠️ 「小美温馨排队预警」原就餐点「${plan.timeline[2].node.name}」前方排队多达 48 桌，预计要等 110 分钟呢！小美不建议您和宝贝在现场枯等。`
            };
          }
          if (log.message.includes('触发 Agent 自适应 Re-Planning')) {
            return {
              ...log,
              message: `🔄 「管家避峰重规划」小美已自动为您启动自适应平替！正在中断原就餐单，调取附近同商圈高品质轻食餐厅...`
            };
          }
          if (log.message.includes('找到最优替代路线')) {
            return {
              ...log,
              message: `✨ 「温馨平替推荐」小美已帮您无缝锁定「青藤小院禅意轻食馆」，环境清雅且完全无需排队，并已顺畅通知闪送骑手李小兵修改配送目的地！`
            };
          }
          if (log.message.includes('一键式落地成功')) {
            return {
              ...log,
              message: `🎉 订单和席位全包处理成功！门票已购，座位已锁，餐前阻断片派送中。老婆的微信行程文案已为您生成，快去一键分享吧～`
            };
          }
          return log;
        });

        setPlan(prev => prev ? { ...prev, timeline: updatedTimeline } : null);
        setLogs(processedLogs);
      },
      simulateError
    );

    setIsExecuting(false);
    if (result.success) {
      setPlan(result.finalPlan);
      setExecuteSuccess(true);
      
      setTimeout(() => {
        setShowShareModal(true);
      }, 700);
    }
  };  // 模拟合并支付提交并激活后台事务和撒花
  const handlePaymentSubmit = async () => {
    setIsPaying(true);
    // 模拟微信安全支付网关 1.5 秒处理
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPaying(false);
    setShowCashierModal(false);
    triggerConfetti(); // 瞬间撒花飘洒！
    await handleOneClickBuy(); // 立即触发原高德骑手追踪与排队平替 Agent 重规划序列！
  };

  return (
    <div className="min-h-screen w-full max-w-[480px] mx-auto bg-darkbg text-slate-800 flex flex-col relative shadow-2xl border-x border-darkbg-border pb-[140px] font-sans">
      
      {/* 撒花特效粒子容器 */}
      {confetti.map(p => (
        <div 
          key={p.id}
          className="confetti-particle"
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%'
          }}
        />
      ))}

      {/* 1. 扁平精致大厂 Header */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-darkbg-border backdrop-blur-md h-[56px] px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-meituan-dark to-meituan flex items-center justify-center shadow-md">
            <Heart className="w-4.5 h-4.5 text-slate-800 fill-slate-800" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wide text-slate-800 flex items-center">
              美团周末暖心助手
              <span className="text-[8px] bg-amber-500/10 text-amber-800 border border-amber-500/20 px-1 py-0.5 rounded ml-1.5 font-bold scale-90">
                PRO V1.0
              </span>
            </h1>
            <p className="text-[8px] text-slate-400 font-bold tracking-wider">让每次陪伴更温馨简单</p>
          </div>
        </div>

        {/* 优雅低调的爆满测试开关 */}
        <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl text-[9px] font-bold">
          <span className="text-slate-500">模拟高峰爆满</span>
          <input 
            type="checkbox" 
            checked={simulateError}
            onChange={(e) => setSimulateError(e.target.checked)}
            className="w-3 h-3 accent-amber-500 rounded border-slate-300 cursor-pointer"
          />
        </div>
      </header>

      {/* 2. 主滚动内容区 */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        
        {/* 温馨自然的 NLP 对话框 + H5 语音输入法 */}
        <section className="space-y-2.5">
          {/* 极其精致豪华的 AI 思考与本地 Mock 切换栏 */}
          <div className="flex items-center justify-between px-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${useAi ? 'bg-amber-500 animate-ping' : 'bg-slate-400'}`}></span>
              决策引擎大脑
            </span>
            <div className="flex items-center space-x-1">
              <button 
                type="button"
                onClick={() => {
                  setUseAi(false);
                  handlePlan(query, false);
                }}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                  !useAi 
                    ? 'bg-white border-slate-200 text-slate-800 shadow-sm font-extrabold' 
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                ⚡ 经典 Mock 本地
              </button>
              <button 
                type="button"
                onClick={() => {
                  setUseAi(true);
                  if (!isPlanFromAi) {
                    setPlan(null);
                    setConstraints(null);
                    setLogs([]);
                    setQuery("");
                  }
                }}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                  useAi 
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 border-amber-300 text-slate-900 shadow-md shadow-amber-500/10 font-extrabold' 
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Sparkles className={`w-3 h-3 text-slate-900 ${useAi ? 'animate-bounce' : ''}`} />
                MIMO AI 思考
              </button>
            </div>
          </div>

          <div className={`relative bg-white rounded-3xl p-1 border-2 flex items-center shadow-lg transition-all duration-300 ${
            useAi 
              ? 'border-amber-400 shadow-amber-500/[0.03] focus-within:border-amber-500 focus-within:shadow-amber-500/[0.06]' 
              : 'border-darkbg-border/60 shadow-amber-950/[0.01] focus-within:border-meituan/80'
          }`}>
            <textarea
              rows={2}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={useAi ? "AI 思考模式已激活！支持自由输入，为您智能预测真实地标与画线..." : "本地 Mock 模式已激活！将通过经典规则过滤与匹配朝阳公园等地标..."}
              className="flex-1 bg-transparent px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 border-0 focus:ring-0 focus:outline-none resize-none font-medium leading-relaxed"
            />
            
            {/* 语音听写微反馈声波图 & 录音触发键 */}
            <div className="flex items-center space-x-1 shrink-0 pr-1">
              {isListening && (
                <div className="flex items-end space-x-0.5 h-6 px-1 animate-pulse mr-1">
                  <span className="w-[2px] bg-amber-500 rounded-full voice-bar h-1" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-[2px] bg-amber-500 rounded-full voice-bar h-1" style={{ animationDelay: '0.3s' }}></span>
                  <span className="w-[2px] bg-amber-500 rounded-full voice-bar h-1" style={{ animationDelay: '0.5s' }}></span>
                  <span className="w-[2px] bg-amber-500 rounded-full voice-bar h-1" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-[2px] bg-amber-500 rounded-full voice-bar h-1" style={{ animationDelay: '0.4s' }}></span>
                </div>
              )}
              
              <button
                onClick={toggleListening}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  isListening 
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-90'
                }`}
                title={isListening ? "停止语音输入" : "语音输入代替输入法"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                disabled={isLoading}
                onClick={() => handlePlan(query)}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer ${
                  useAi 
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-extrabold shadow-amber-500/10 hover:from-amber-300 hover:to-amber-400' 
                    : 'bg-meituan text-slate-800 hover:bg-meituan-light'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                ) : useAi ? (
                  <Sparkles className="w-4 h-4 text-slate-900" />
                ) : (
                  <Send className="w-3.8 h-3.8 font-bold" />
                )}
              </button>
            </div>
          </div>

          {/* 扁平克制的典型场景预设小药丸 */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePlanPreset(preset.text)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                    query === preset.text 
                      ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm' 
                      : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI 决策历史时光机横向滑动微光抽屉 */}
          {historyList.length > 0 && (
            <div className="space-y-2 mt-3.5 pt-3.5 border-t border-slate-100 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold text-amber-800/90 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  🕰️ AI 推荐决策时光机 (一键回溯比对)
                </span>
                <button 
                  onClick={handleClearHistory}
                  className="text-[9.5px] text-slate-400 hover:text-slate-600 font-extrabold active:scale-95 transition-all cursor-pointer"
                >
                  清空历史
                </button>
              </div>
              <div className="flex overflow-x-auto gap-2 py-1 scrollbar-none">
                {historyList.map((item) => {
                  const isSelected = plan && constraints && constraints.originalQuery === item.constraints.originalQuery;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleRestoreHistory(item)}
                      className={`shrink-0 text-[10px] font-extrabold px-3 py-2 rounded-2xl transition-all duration-300 border backdrop-blur-md flex items-center space-x-1 shadow-sm cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100/70 border-amber-400 text-amber-900 shadow-md ring-1 ring-amber-300 scale-98'
                          : 'bg-white/40 border-slate-200/80 text-slate-600 hover:bg-white/60 hover:border-amber-300/40'
                      }`}
                    >
                      <span>📍</span>
                      <span className="truncate max-w-[120px]">{item.query}</span>
                      <span className="text-[8px] bg-amber-200/50 text-amber-900 px-1 py-0.2 rounded-md font-bold shrink-0">
                        ¥{item.plan.totalCost}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* 当切换到 MIMO 思考模式且尚未生成 AI 方案时，渲染极其精致的 AI 待命与操作导引面板 */}
        {useAi && !plan && !isLoading && (
          <section className="glass-panel p-6 border-amber-300/40 bg-gradient-to-br from-amber-50/15 via-white/40 to-amber-50/5 text-center space-y-4 shadow-[0_8px_32px_rgba(245,158,11,0.04)] rounded-3xl animate-[fadeIn_0.4s_ease-out] border border-amber-200">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              {/* 金色粒子呼吸动画光晕 */}
              <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl animate-pulse"></div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center shadow-md relative z-10">
                <Sparkles className="w-6 h-6 text-slate-900" style={{ animation: 'spin 8s linear infinite' }} />
              </div>
            </div>
            
            <div className="space-y-1.5 max-w-[280px] mx-auto">
              <h3 className="text-xs font-extrabold text-amber-950 flex items-center justify-center gap-1.5">
                🧠 MIMO 旗舰大模型大脑已就绪
              </h3>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                当前已锁定“MIMO AI 思考”模式，不再显示预设 Mock 数据。
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-amber-100/50 text-[10px] text-amber-800 font-bold max-w-[280px] mx-auto">
              💡 输入您的真实出行心愿，点击输入框右侧黄色按钮，即刻召唤 MIMO AI 智能规划您的专属大账单方案！
            </div>
          </section>
        )}

        {/* 高德 API 适配地图区 */}
        {plan && (
          <section className="w-full animate-[fadeIn_0.3s_ease-out]">
            <MapContainer timeline={plan.timeline} isExecuting={isExecuting} />
          </section>
        )}

        {/* 智能管家小美的温馨对话气泡 ── 去AI味，大厂亲和力体现 */}
        {(isLoading || plan) && logs.length > 0 && (
          <section className={`glass-panel p-4 flex items-start space-x-3 bg-amber-50/20 border-amber-100/60 shadow-sm transition-all duration-300 ${isLoading ? 'border-amber-300 bg-amber-50/40 animate-pulse' : ''}`}>
            <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-base">👩‍💼</span>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-800 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-500" />
                  管家小美
                </span>
                <span className="text-[7.5px] text-slate-400 font-mono">
                  {isLoading ? 'Thinking...' : 'Realtime Assistant'}
                </span>
              </div>
              <div className="text-[11px] text-slate-700 leading-relaxed font-semibold space-y-2">
                {logs.slice(-2).map((log, index) => (
                  <p key={index} className={`${log.type === 'error' ? 'text-red-600' : log.type === 'replan' ? 'text-amber-700 font-extrabold bg-amber-100/40 p-1.5 rounded-xl border border-amber-200/50' : 'text-slate-600'} flex items-center flex-wrap`}>
                    {log.message}
                    {isLoading && index === logs.slice(-2).length - 1 && (
                      <span className="inline-flex items-center ml-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce mx-0.5"></span>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce mx-0.5" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce mx-0.5" style={{ animationDelay: '0.4s' }}></span>
                      </span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 行人画像解析状态条 */}
        {plan && constraints && (
          <section className="bg-slate-100/50 border border-slate-200/80 rounded-2xl p-3.5 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              <span>管家已自动锁定的出行画像和定制细节：</span>
              <div className="flex flex-wrap gap-2.5 mt-1.5 font-bold">
                <span className={`flex items-center px-1.5 py-0.5 rounded-md ${constraints.hasChild ? 'bg-cyan-50 text-cyan-700' : 'text-slate-300'}`}>
                  <Baby className="w-3.5 h-3.5 mr-0.5" />
                  带娃家庭 (适合5岁宝宝)
                </span>
                <span className={`flex items-center px-1.5 py-0.5 rounded-md ${constraints.hasSlimming ? 'bg-emerald-50 text-emerald-700' : 'text-slate-300'}`}>
                  <Dumbbell className="w-3.5 h-3.5 mr-0.5" />
                  控糖低卡 (老婆减肥)
                </span>
                <span className={`flex items-center px-1.5 py-0.5 rounded-md ${constraints.isFriendsGroup ? 'bg-amber-50 text-amber-700' : 'text-slate-300'}`}>
                  <Users className="w-3.5 h-3.5 mr-0.5" />
                  社交娱乐 (青年解压)
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 行程时间轴卡片列表 */}
        {plan && (
          <section className="space-y-1.5 animate-[fadeIn_0.4s_ease-out]">
            <h4 className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">小美为您精心编排的行程：</h4>
            <TimelineCards 
              timeline={plan.timeline} 
              onSwapOrder={handleSwapOrder} 
              onShuffleNode={handleShuffleNode}
              isExecuting={isExecuting}
            />
          </section>
        )}
      </main>

      {/* 3. 底部大厂温馨全包下单工具栏 */}
      {plan && (
        <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-40 bg-white/95 border-t border-slate-100 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-lg animate-[slideUp_0.3s_ease-out]">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">美团小管家全包一键下单</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xl font-extrabold font-mono text-slate-800">¥{plan.totalCost}</span>
              <span className="text-[9.5px] text-slate-400 font-bold">总包 (含门票/订座/闪送)</span>
            </div>
          </div>

          <button
            disabled={isExecuting}
            onClick={() => setShowCashierModal(true)}
            className={`px-5 py-2.8 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer ${
              isExecuting 
                ? 'bg-slate-100 text-slate-400 border border-slate-200/50'
                : executeSuccess
                ? 'bg-emerald-500 text-white shadow-emerald-500/10'
                : 'bg-meituan text-slate-800 hover:bg-meituan-light active:scale-95 shadow-md shadow-meituan/5'
            }`}
          >
            <ShoppingBag className="w-4 h-4 font-bold" />
            <span>
              {isExecuting ? '管家自动订购中...' : executeSuccess ? '已全包下单成功' : '一键全包下单/预约'}
            </span>
          </button>
        </div>
      )}

      {/* 4. 微信文案分享温馨弹窗 */}
      {showShareModal && plan && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-5 w-full max-w-[340px] space-y-4 text-center border border-slate-100 shadow-2xl animate-[scaleIn_0.3s_ease-out]">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">温馨行程购买好啦！</h3>
              <p className="text-[10px] text-slate-400 font-bold">小美已自动为您全包购票、线上锁座并呼叫闪送骑手</p>
            </div>

            {/* 微信文案展示框 */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-slate-100 text-left">
              <pre className="text-[10px] text-slate-600 whitespace-pre-wrap font-sans leading-relaxed font-semibold">
                {generateShareText(plan)}
              </pre>
            </div>

            <div className="flex space-x-2 pt-1.5">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateShareText(plan));
                  alert("行程分享文案已成功复制！快去发送给老婆展示你的体贴入微吧～");
                }}
                className="flex-1 py-2.5 rounded-xl bg-meituan text-slate-800 text-xs font-bold active:scale-95 transition-all hover:bg-meituan-light cursor-pointer"
              >
                复制发给家人
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-50 text-slate-500 border border-slate-200/80 text-xs active:scale-95 transition-all hover:bg-slate-100 cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 美团超级管家一键全托收银台 */}
      {showCashierModal && plan && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-end flex-col p-0 backdrop-blur-sm">
          {/* 收银台卡片面板 */}
          <div className="bg-gradient-to-b from-[#FDFBF9] to-[#FFFFFF] rounded-t-[36px] w-full max-w-[480px] px-6 py-6 pb-8 space-y-4 border-t border-amber-100/40 shadow-[0_-12px_40px_rgba(142,138,131,0.12)] backdrop-blur-xl animate-[slideUp_0.35s_ease-out] relative">
            
            {/* 顶部分割小杠 */}
            <div className="w-10 h-1 rounded-full bg-slate-300/60 mx-auto -mt-2 mb-2"></div>
            
            {/* 头部 */}
            <div className="flex justify-between items-center border-b border-[#F5EFE6] pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-meituan flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-slate-800 animate-pulse" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-800">美团超级管家一键结算台</h3>
              </div>
              <span className="text-[8px] text-slate-400 font-mono font-bold tracking-wider">SECURE CHECKOUT</span>
            </div>

            {/* 大额立省横幅 */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-100 p-4 rounded-3xl flex justify-between items-center shadow-inner">
              <div className="space-y-0.5">
                <span className="text-[8px] text-amber-700 font-extrabold tracking-wider block">SUPER SAVINGS BUNDLE</span>
                <p className="text-[11px] font-extrabold text-amber-950">已整合门票/避峰券/特惠尾房</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-amber-600 font-bold block">已自动立省</span>
                <span className="text-xl font-extrabold text-amber-600 font-mono">¥{plan.businessBill.savingsTotal}</span>
              </div>
            </div>

            {/* 费用细项 */}
            <div className="space-y-2">
              <h4 className="text-[9.5px] font-extrabold text-slate-400 tracking-wider pl-1">打包订购细项明细：</h4>
              
              <div className="max-h-[200px] overflow-y-auto pr-1 space-y-2">
                
                {/* 门票价格明细 */}
                {plan.businessBill.ticketPrice && (
                  <div className="bg-[#FDFDFD] border border-[#F5EFE6]/70 p-3 rounded-2xl flex justify-between items-center text-xs font-semibold">
                    <div className="space-y-0.5">
                      <span className="text-slate-800 font-extrabold block">🎫 {plan.timeline[1].node.name} 门票套票</span>
                      <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded-md">
                        {plan.businessBill.ticketPrice.label}
                      </span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-[9.5px] text-slate-400 line-through block font-mono">¥{plan.businessBill.ticketPrice.original}</span>
                      <span className="text-xs text-slate-800 font-extrabold font-mono">¥{plan.businessBill.ticketPrice.current}</span>
                    </div>
                  </div>
                )}

                {/* 餐饮折扣明细 */}
                {plan.businessBill.mealPrice && (
                  <div className="bg-[#FDFDFD] border border-[#F5EFE6]/70 p-3 rounded-2xl flex justify-between items-center text-xs font-semibold">
                    <div className="space-y-0.5">
                      <span className="text-slate-800 font-extrabold block">🍲 {plan.timeline[2].node.name} 座位预订</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                        plan.businessBill.mealPrice.couponDeducted > 0 
                          ? 'text-red-600 bg-red-50 border border-red-100'
                          : 'text-slate-500 bg-slate-100 border border-slate-200'
                      }`}>
                        {plan.businessBill.mealPrice.label}
                      </span>
                    </div>
                    <div className="text-right space-y-0.5">
                      {plan.businessBill.mealPrice.couponDeducted > 0 && (
                        <span className="text-[9.5px] text-slate-400 line-through block font-mono">¥{plan.businessBill.mealPrice.original}</span>
                      )}
                      <span className="text-xs text-slate-800 font-extrabold font-mono">¥{plan.businessBill.mealPrice.current}</span>
                    </div>
                  </div>
                )}

                {/* 即时闪购免邮明细 */}
                {plan.businessBill.retailPrice && (
                  <div className="bg-[#FDFDFD] border border-[#F5EFE6]/70 p-3 rounded-2xl flex justify-between items-center text-xs font-semibold">
                    <div className="space-y-0.5">
                      <span className="text-slate-800 font-extrabold block">💊 美团买药/闪购跑腿订单</span>
                      <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded-md">
                        {plan.businessBill.retailPrice.label}
                      </span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-[9.5px] text-slate-400 line-through block font-mono">¥{plan.businessBill.retailPrice.cost + 5}</span>
                      <span className="text-xs text-slate-800 font-extrabold font-mono">¥{plan.businessBill.retailPrice.cost}</span>
                    </div>
                  </div>
                )}

                {/* 傍晚日落特惠尾房明细 */}
                {plan.businessBill.hotelPrice && (
                  <div className="bg-[#FDFDFD] border border-[#F5EFE6]/70 p-3 rounded-2xl flex justify-between items-center text-xs font-semibold">
                    <div className="space-y-0.5">
                      <span className="text-slate-800 font-extrabold block">🏨 附近精选尾房住宿 (傍晚限时)</span>
                      <span className="text-[9px] text-amber-600 font-extrabold bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded-md">
                        {plan.businessBill.hotelPrice.label}
                      </span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-[9.5px] text-slate-400 line-through block font-mono">¥{plan.businessBill.hotelPrice.original}</span>
                      <span className="text-xs text-slate-800 font-extrabold font-mono">¥{plan.businessBill.hotelPrice.current}</span>
                    </div>
                  </div>
                )}

                {/* 打车价格明细 */}
                {plan.businessBill.taxiPrice && (
                  <div className="bg-[#FDFDFD] border border-[#F5EFE6]/70 p-3 rounded-2xl flex justify-between items-center text-xs font-semibold">
                    <div className="space-y-0.5">
                      <span className="text-slate-800 font-extrabold block">🚗 美团打车 (高德沿马路计价)</span>
                      <span className="text-[9px] text-slate-400 font-extrabold bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-md">
                        {plan.businessBill.taxiPrice.label}
                      </span>
                    </div>
                    <div className="text-right font-mono text-xs text-slate-800 font-extrabold">
                      ¥{plan.businessBill.taxiPrice.estimated}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* 实付款 */}
            <div className="flex justify-between items-baseline border-t border-slate-100 pt-4 px-1">
              <span className="text-xs font-extrabold text-slate-600">微信/美团合并支付金额：</span>
              <span className="text-2xl font-extrabold font-mono text-slate-800">¥{plan.totalCost}</span>
            </div>

            {/* 支付与取消动作栏 */}
            <div className="flex space-x-2 pt-2">
              <button
                disabled={isPaying}
                onClick={handlePaymentSubmit}
                className="flex-1 py-3.2 rounded-2xl bg-emerald-500 text-white text-xs font-extrabold active:scale-95 transition-all hover:bg-emerald-600 flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>微信支付网关安全付款中...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 font-bold text-white" />
                    <span>微信合并安全支付 ¥{plan.totalCost}</span>
                  </>
                )}
              </button>
              <button
                disabled={isPaying}
                onClick={() => setShowCashierModal(false)}
                className="px-4 py-3.2 rounded-2xl bg-slate-100 text-slate-500 border border-slate-200/60 text-xs font-bold active:scale-95 transition-all hover:bg-slate-200 cursor-pointer"
              >
                取消
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

