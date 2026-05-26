import type { LocationNode } from './mockData';
import { MOCK_LOCATIONS, START_COORDS } from './mockData';

// 大模型自由规划地标节点的结构
export interface AIRecommendationNode {
  name: string;
  description: string;
  price: number;
  duration: number; // 停留分钟数
  tags: string[];
  position: [number, number];
  type: 'play' | 'eat' | 'hotel'; // 明确节点类型
}

// 定义解析出的结构化约束
export interface AppConstraints {
  originalQuery: string;
  durationHours: number; // 默认 5 小时
  maxDistanceKm: number; // 离起点的最大公里数
  hasChild: boolean;     // 是否带娃
  hasSlimming: boolean;  // 是否减肥
  isFriendsGroup: boolean; // 是否是朋友社交
  isYouthVibe: boolean;  // 年轻人热血青春、潮流打卡
  isThrillFun: boolean;  // 刺激嗨玩、夜生活
  isCoupleDate: boolean; // 情侣约会
  isChillRelax: boolean; // 松弛疗愈
  isBudgetSaver: boolean; // 高性价比 / 省钱
  transportPreference: 'subway' | 'taxi' | 'walk' | 'auto'; // 出行工具偏好
  nodes: AIRecommendationNode[]; // 核心节点序列，按建议游玩顺序排列（支持任意多个目的地！）
}

// 门票、餐饮、闪购、酒店、打车、地铁的美团超级全包大账单明细
export interface MeituanBusinessBill {
  ticketPrice?: { original: number; current: number; label: string }; // 门票
  mealPrice?: { original: number; current: number; couponDeducted: number; label: string }; // 餐饮套餐
  retailPrice?: { cost: number; deliveryFee: number; label: string }; // 闪购药品/烘焙
  hotelPrice?: { original: number; current: number; label: string }; // 尾房闪惠
  taxiPrice?: { estimated: number; label: string }; // 运力打车费
  subwayPrice?: { cost: number; label: string }; // 新增：美团交通地铁票预存款
  savingsTotal: number; // 累计已为您省去
  grandTotal: number; // 打包实付总计
}

// 行程时间节点接口
export interface TimelineItem {
  time: string; // "14:00"
  node: LocationNode;
  duration: number; // 停留分钟
  travelTimeToNext?: number; // 到下个节点的交通时间(分钟)
  travelModeToNext?: 'walk' | 'drive' | 'subway'; // 升级支持：步行、打车或地铁
  travelLineDetails?: string; // 新增：具体交通线路详情（如“地铁8号线 天桥站->金鱼胡同站”）
  distanceToNext?: number; // 公里
  actionLabel: string; // 落地执行的动作文本
  actionStatus: 'idle' | 'executing' | 'success' | 'failed';
}

// 完整的活动方案
export interface ActivityPlan {
  timeline: TimelineItem[];
  totalDistance: number;
  totalCost: number;
  totalTimeMinutes: number;
  compatibilityScore: number;
  dietScore: number;
  childFriendlyScore: number;
  friendsVibeScore: number;
  summaryText: string;
  businessBill: MeituanBusinessBill; // 美团打包总收银台账单
}

// 计算两点之间的几何距离并转化为公里 (支持高德真实经纬度 position 或 0-100 虚拟 coords)
export function calculateDistance(
  c1: { x: number; y: number; position?: [number, number] },
  c2: { x: number; y: number; position?: [number, number] }
): number {
  if (c1.position && c2.position) {
    // 经典的哈弗辛公式 (Haversine formula) 计算地球两点间距离 (千米)
    const [lng1, lat1] = c1.position;
    const [lng2, lat2] = c2.position;
    const R = 6371; // 地球半径 km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return parseFloat(dist.toFixed(1));
  }
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  const dist = Math.sqrt(dx * dx + dy * dy) * 0.05; // 映射为 0 - 5 公里
  return parseFloat(dist.toFixed(1));
}

// 根据距离估算交通耗时
export function estimateTravelTime(distanceKm: number): { duration: number; mode: 'walk' | 'drive' } {
  if (distanceKm <= 0.8) {
    return { duration: Math.round((distanceKm / 4.5) * 60 + 2), mode: 'walk' };
  } else {
    return { duration: Math.round((distanceKm / 15) * 60 + 3), mode: 'drive' };
  }
}

// ==========================================
// 1. 小米大模型 API 意图解析器 (流式高并发版)
// ==========================================
import { AI_CONFIG } from './config';
import { mergeTravelProfiles, formatProfileSummary } from './constants/travelProfiles';

// 鲁棒的JSON提取器，能从任何混杂杂质的字符串中精准提取首尾匹配的JSON格式
export function extractPureJSON(text: string): string {
  // 1. 优先提取 Markdown 格式代码块中的内容
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (markdownMatch && markdownMatch[1]) {
    text = markdownMatch[1].trim();
  }
  // 2. 截取第一个大括号 { 与最后一个大括号 } 之间的内容
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1).trim();
  }
  return text.trim();
}

export async function parseNaturalLanguageQuery(
  query: string, 
  useAi: boolean = true,
  onStreamChunk?: (text: string) => void,
  abortSignal?: AbortSignal
): Promise<AppConstraints> {
  const lowercase = query.toLowerCase();
  
  // A. 正则表达式分词本地解析兜底器 (防翻车，保证 100% 成功运行，并且能精准对齐北京多景点行程！)
  const localFallback = (): AppConstraints => {
    const profiles = mergeTravelProfiles(undefined, query);

    // 智能提取交通方式偏好
    let transportPreference: AppConstraints['transportPreference'] = 'auto';
    if (/(地铁|地跌|坐地铁|乘地铁)/.test(lowercase)) {
      transportPreference = 'subway';
    } else if (/(打车|出租|专车|快车|自驾|开车)/.test(lowercase)) {
      transportPreference = 'taxi';
    } else if (/(步行|走路|散步)/.test(lowercase)) {
      transportPreference = 'walk';
    }

    let durationHours = 5;
    const hoursMatch = lowercase.match(/(\d+|一|二|三|四|五|六|七|八)\s*个?小时/);
    if (hoursMatch) {
      const parsed = parseInt(hoursMatch[1]);
      if (!isNaN(parsed)) {
        durationHours = parsed;
      } else {
        const cnMap: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8 };
        durationHours = cnMap[hoursMatch[1]] || 5;
      }
    }

    let maxDistanceKm = 5;
    const distMatch = lowercase.match(/(\d+)\s*公里/);
    if (distMatch) {
      maxDistanceKm = parseInt(distMatch[1]);
    } else if (/(不远|别太远|附近|离家近)/.test(lowercase)) {
      maxDistanceKm = 3;
    }

    // 智能提取并组装多个强指定景点
    const nodes: AIRecommendationNode[] = [];
    
    if (/(天坛)/.test(lowercase)) {
      nodes.push({
        name: '天坛公园',
        description: '探索古代皇家祭祀文化，适合高中生历史学习之旅',
        price: 15,
        duration: 120,
        tags: ['历史遗迹', '文化体验', '摄影胜地', '青年友好'],
        position: [116.4108, 39.8725],
        type: 'play'
      });
    }

    // 如果提到了天坛、故宫或颐和园的多目的地，智能插入便宜坊就餐点
    if (/(便宜坊|烤鸭|吃饭|就餐|餐厅)/.test(lowercase) || (/(天坛)/.test(lowercase) && /(故宫|颐和园)/.test(lowercase))) {
      nodes.push({
        name: '便宜坊烤鸭 (天坛店)',
        description: '正宗北京烤鸭，经济实惠，方便游玩天坛后用餐',
        price: 80,
        duration: 80,
        tags: ['北京风味', '经济实惠', '近景点', '口碑好'],
        position: [116.4153, 39.8732],
        type: 'eat'
      });
    }

    if (/(故宫|紫禁城)/.test(lowercase)) {
      nodes.push({
        name: '故宫博物院',
        description: '参观明清两代皇家宫殿，领略宏伟的宫廷建筑与历史珍宝',
        price: 60,
        duration: 150,
        tags: ['故宫大开眼界', '国宝级展览', '世界文化遗产'],
        position: [116.3974, 39.9180],
        type: 'play'
      });
    }

    if (/(颐和园)/.test(lowercase)) {
      nodes.push({
        name: '颐和园',
        description: '漫步于皇家山水园林之中，欣赏十七孔桥与万寿山的精美景观',
        price: 30,
        duration: 120,
        tags: ['皇家园林', '精美山水', '江南古风'],
        position: [116.2730, 39.9920],
        type: 'play'
      });
    }

    // 提到了住宿或者属于天坛故宫颐和园的超级长途行程，自动插针高特惠酒店
    if (/(住宿|酒店|全季|安缦|睡觉)/.test(lowercase) || (/(颐和园)/.test(lowercase) && /(故宫)/.test(lowercase))) {
      nodes.push({
        name: '全季酒店 (北京中关村颐和园店)',
        description: '距离颐和园很近，环境清幽舒适，性价比高',
        price: 280,
        duration: 0,
        tags: ['限时特惠', '品质连锁', '温馨舒适'],
        position: [116.2760, 39.9880],
        type: 'hotel'
      });
    }

    // 如果什么都没匹配到，则依然回退到朝阳公园默认地标
    if (nodes.length === 0) {
      nodes.push({
        name: '奈尔宝家庭中心 (蓝色港湾店)',
        description: '国内顶奢室内儿童乐园，配有全职看护与高安全性设计。',
        price: 198,
        duration: 120,
        tags: ['亲子乐园', '室内恒温', '高安全性'],
        position: [116.479133, 39.953049],
        type: 'play'
      });
      nodes.push({
        name: '火烧云傣家菜 (蓝色港湾店)',
        description: '超人气云南特色菜，排队狂魔，口味独特香辣开胃。',
        price: 95,
        duration: 80,
        tags: ['排队爆满', '极佳口味', '云南风情'],
        position: [116.4793, 39.9532],
        type: 'eat'
      });
    }

    // 跨区大北京线路，自动调大最大范围至 30 公里
    const isBeijingRoute = /(天坛|故宫|颐和园)/.test(lowercase);
    const finalMaxDistance = isBeijingRoute ? 30 : maxDistanceKm;

    return {
      originalQuery: query,
      durationHours,
      maxDistanceKm: finalMaxDistance,
      ...profiles,
      transportPreference,
      nodes,
    };
  };

  if (!useAi) {
    return localFallback();
  }

  // B. 尝试利用用户配置的大模型接口进行语义结构化抽取 (流式输出版)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 既然是流式，将总超时放宽到 60 秒

    // 联动外部中断信号，如果用户在前台点击“停止思考”，则瞬间终止底层的 fetch 流式连接
    if (abortSignal) {
      if (abortSignal.aborted) {
        controller.abort();
      } else {
        abortSignal.addEventListener('abort', () => {
          controller.abort();
        });
      }
    }

    // 智能拼接 baseUrl，保证不管是相对路径还是绝对路径均能完美拼接
    let url = AI_CONFIG.baseURL;
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    const targetUrl = `${url}/chat/completions`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_CONFIG.apiKey}`,
        "Accept": "text/event-stream"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: AI_CONFIG.model,
        temperature: 0.1,
        stream: true, // 开启流式传输！
        messages: [
          {
            role: "system",
            content: `你是一个智能周末出行管家小美的语义提取与地标规划助手。请精准解析用户的周末出行心愿，提取结构化参数，并根据用户的描述进行自由的地标/商户推荐与高德经纬度坐标预测。必须严格以简洁的 JSON 格式输出，不要包含 any markdown 代码块格式（如 \`\`\`json），也不要带任何文字解释！

输出的 JSON 结构必须为：
{
  "durationHours": 数字，建议的周末出行总时长（几小时），若未提及则默认 5,
  "maxDistanceKm": 数字，离家/起点的最大公里数（北京跨区景点如天坛、故宫、颐和园跨度较大，若包含这类跨区景点请设为 30），若未提及则默认 5,
  "hasChild": 布尔值，是否带小孩/儿童/宝宝/学龄前/几岁娃,
  "hasSlimming": 布尔值，是否有减肥/瘦身/减脂/低盐低糖/轻食/沙拉等健康塑形需求,
  "isFriendsGroup": 布尔值，是否是朋友聚会/闺蜜兄弟/桌游社交,
  "isYouthVibe": 布尔值，是否体现年轻人热血激情、青春潮流、网红打卡、元气满满,
  "isThrillFun": 布尔值，是否追求刺激嗨玩，如密室、剧本杀、Live、音乐节、酒吧、电竞、极限运动,
  "isCoupleDate": 布尔值，是否是情侣约会、纪念日、浪漫二人世界,
  "isChillRelax": 布尔值，是否偏松弛疗愈、慢生活、露营看海、温泉发呆,
  "isBudgetSaver": 布尔值，是否强调省钱、性价比、预算有限,
  "transportPreference": 字符串，"subway" | "taxi" | "walk" | "auto" 中的一个，如果用户强指定了出行方式如“坐地铁”则为 subway，提到“打车”则为 taxi，提到“步行/散步”则为 walk，未强指定则为 auto,
  "nodes": [
    {
      "name": "真实好玩的景点、餐饮商户或酒店住宿名称。必须优先规划用户在心愿中指定的全部景点（例如用户同时指定了天坛、故宫、颐和园，必须在nodes序列中全部输出这三个景点，一个不能少！）。并在景点之间合适的位置智能插针规划就餐点（eat），若提到过夜、住宿或行程大于5小时，在最末尾智能推荐插针一个高品质住宿点（hotel）",
      "description": "为什么推荐这里的温馨推荐语 (不超过40字)",
      "price": 价格数字（如门票价格、餐人均消费或酒店单晚价格），例如150,
      "duration": 游玩或就餐建议停留分钟数数字（景点通常为120-180分钟，餐饮通常为80分钟，酒店住宿可为0）,
      "tags": ["适合标签，3-4个"],
      "position": [经度, 纬度] (必须为真实的高德经纬度坐标数组。天坛高德坐标[116.4108, 39.8725]；故宫高德坐标[116.3974, 39.9180]；颐和园高德坐标[116.2730, 39.9920]。经度在前纬度在后，必须准确！),
      "type": "play" | "eat" | "hotel"
    }
  ]
}`
          },
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Fetch error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let completeText = "";
    let reasoningText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;

        if (trimmed.startsWith("data: ")) {
          try {
            const dataJson = JSON.parse(trimmed.slice(6));
            const choice = dataJson.choices?.[0];
            const contentChunk = choice?.delta?.content || choice?.text || "";
            const reasoningChunk = choice?.delta?.reasoning_content || "";

            let hasUpdated = false;
            if (reasoningChunk) {
              reasoningText += reasoningChunk;
              hasUpdated = true;
            }
            if (contentChunk) {
              completeText += contentChunk;
              hasUpdated = true;
            }

            if (hasUpdated && onStreamChunk) {
              if (completeText) {
                onStreamChunk(completeText);
              } else {
                onStreamChunk(`🤔 正在深度规划中：\n${reasoningText}`);
              }
            }
          } catch (e) {
            console.warn("Parse stream chunk error:", e, trimmed);
          }
        }
      }
    }

    const jsonString = extractPureJSON(completeText);
    const parsedData = JSON.parse(jsonString);
    clearTimeout(timeoutId);

    const profiles = mergeTravelProfiles(parsedData, query);
    const transportPreference = parsedData.transportPreference ?? (/(地铁|地跌|坐地铁|乘地铁)/.test(lowercase) ? 'subway' : /(打车|出租|专车|快车|自驾|开车)/.test(lowercase) ? 'taxi' : /(步行|走路|散步)/.test(lowercase) ? 'walk' : 'auto');

    if (Array.isArray(parsedData.nodes) && parsedData.nodes.length > 0) {
      return {
        originalQuery: query,
        durationHours: parsedData.durationHours ?? 5,
        maxDistanceKm: parsedData.maxDistanceKm ?? 5,
        ...profiles,
        transportPreference,
        nodes: parsedData.nodes.map((n: any) => ({
          name: n.name || "推荐景点",
          description: n.description || "管家小美特惠推荐",
          price: typeof n.price === 'number' ? n.price : 0,
          duration: typeof n.duration === 'number' ? n.duration : 120,
          tags: Array.isArray(n.tags) ? n.tags : ["热门推荐"],
          position: Array.isArray(n.position) && n.position.length === 2 ? [Number(n.position[0]), Number(n.position[1])] : [116.4108, 39.8725],
          type: n.type === 'eat' ? 'eat' : n.type === 'hotel' ? 'hotel' : 'play'
        }))
      };
    } else {
      throw new Error("No nodes found in AI response");
    }

  } catch (err: any) {
    // 若是由于用户手动“停止思考”触发的中断，直接向上抛出 AbortError，坚决不进行本地降级兜底
    if (err.name === 'AbortError' || (abortSignal && abortSignal.aborted)) {
      throw err;
    }
    console.error("AI service error, fallback to local:", err);
    return localFallback();
  }
}
// 2. 多目标路线规划器 (包含美团多业务价格计算)
// ==========================================
export function generateSmartPlan(
  constraints: AppConstraints,
  customOrderIds?: string[]
): ActivityPlan {
  
  // 1. 如果有 customOrderIds (拖拽重排等)，我们可以把 nodes 按照 customOrderIds 进行排序还原
  let orderedNodes = [...constraints.nodes];
  if (customOrderIds && customOrderIds.length > 0) {
    const nodeMap = new Map(orderedNodes.map(n => [n.name, n]));
    const matched: AIRecommendationNode[] = [];
    customOrderIds.forEach(name => {
      const found = nodeMap.get(name);
      if (found) matched.push(found);
    });
    // 把没匹配上的补在后面
    orderedNodes.forEach(n => {
      if (!matched.some(m => m.name === n.name)) {
        matched.push(n);
      }
    });
    orderedNodes = matched;
  }

  // 2. 确定起点
  // 如果第一站是北京跨区地标，我们将起点模拟在第一站附近的一个“高中生宿舍”或者“北京南站”
  const firstNode = orderedNodes[0];
  const isBeijingRoute = firstNode && /(天坛|故宫|颐和园)/.test(firstNode.name);
  
  const startPosition: [number, number] = isBeijingRoute ? [116.3790, 39.8650] : START_COORDS.position || [116.479, 39.952]; // 北京南站 / 朝阳公园
  const startName = isBeijingRoute ? '北京南站 (宿舍起点)' : '从温暖的家出发';

  const startNode: LocationNode = {
    id: 'start-node',
    name: startName,
    type: 'play', // 借用 play
    coords: { x: 50, y: 50 },
    position: startPosition,
    tags: ['出发点'],
    price: 0,
    duration: 0,
    suitableFor: ['all'],
    description: isBeijingRoute ? '周六清晨，开启充满期待的北京经典历史文化游学之旅！' : '今日出行规划：已智能收敛至离家合理范围内的优质成熟商圈，避开无谓的舟车劳顿。',
    realtimeStatus: { availability: 'available', queueTables: 0, queueWaitMinutes: 0 }
  };

  // 3. 确定起始时间
  // 如果游玩地标 >= 3 个，判定为全天超级特快特种兵行程，从上午 08:30 出发；否则下午 14:00 出发
  const playNodesCount = orderedNodes.filter(n => n.type === 'play').length;
  let currentMinutes = playNodesCount >= 3 ? (8 * 60 + 30) : (14 * 60);
  const startMinutes = currentMinutes;

  const formatTime = (totalMin: number): string => {
    const hh = Math.floor(totalMin / 60);
    const mm = Math.round(totalMin % 60);
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  };

  const timeline: TimelineItem[] = [];

  // 4. 依次构建时间轴
  let prevPos = startPosition;
  let prevName = startName;

  // 门票累加
  let ticketOriginal = 0;
  let ticketCurrent = 0;
  let ticketCount = 0;

  // 餐饮累加
  let mealOriginal = 0;
  let mealCurrent = 0;
  let mealCoupon = 0;

  // 住宿累加
  let hotelOriginal = 0;
  let hotelCurrent = 0;
  let hotelNode: AIRecommendationNode | null = null;

  // 闪购累加
  let retailCost = 0;

  // 交通累加
  let totalDistance = 0;
  let taxiCost = 0;
  let subwayCost = 0;

  const personCount = 1; // 题目指定“我是一名高中生”，所以全包账单以 1 人计费，极其符合画像！

  for (let i = 0; i < orderedNodes.length; i++) {
    const nodeData = orderedNodes[i];
    
    // 计算上一节点到当前节点的交通信息
    const dist = calculateDistance({ x: 50, y: 50, position: prevPos }, { x: 50, y: 50, position: nodeData.position });
    totalDistance += dist;

    // 智能决策交通方式
    let travelMode: 'walk' | 'drive' | 'subway' = 'drive';
    let travelTime = 15;
    let cost = 0;
    let details = '';

    if (dist <= 1.0) {
      travelMode = 'walk';
      travelTime = Math.max(3, Math.round((dist / 4.5) * 60 + 2));
      details = `🚶 步行前往下一站 (约 ${dist}公里，用时 ${travelTime}分钟)`;
    } else if (constraints.transportPreference === 'subway' || dist > 4.5) {
      travelMode = 'subway';
      travelTime = Math.round((dist / 28) * 60 + 12);
      cost = 4 * personCount; // 地铁票价
      subwayCost += cost;
      
      // 智能猜测地铁换乘路线
      let lineFrom = '地铁线';
      let stationFrom = '乘车点';
      let stationTo = '目的站';

      if (prevName.includes('天坛')) { lineFrom = '地铁 8 号线'; stationFrom = '天桥站'; }
      else if (prevName.includes('故宫')) { lineFrom = '地铁 8 号线'; stationFrom = '金鱼胡同站'; }
      else if (prevName.includes('颐和园')) { lineFrom = '地铁 4 号线'; stationFrom = '北宫门站'; }
      else if (prevName.includes('北京南站')) { lineFrom = '地铁 4 号线'; stationFrom = '北京南站'; }
      else { lineFrom = '地铁 10 号线'; stationFrom = '附近地铁站'; }

      if (nodeData.name.includes('天坛')) { stationTo = '天桥站'; }
      else if (nodeData.name.includes('故宫')) { stationTo = '金鱼胡同站'; }
      else if (nodeData.name.includes('颐和园')) { stationTo = '北宫门站'; }
      else if (nodeData.name.includes('便宜坊')) { stationTo = '天桥站'; }
      else { stationTo = '就近地铁站'; }

      details = `🚇 乘坐 ${lineFrom} (从 ${stationFrom} ──> ${stationTo}，票价 ¥${cost}，约 ${travelTime}分钟)`;
    } else {
      travelMode = 'drive';
      travelTime = Math.max(5, Math.round((dist / 18) * 60 + 4));
      cost = Math.max(14, Math.round(dist * 2.4 + 4)) * personCount;
      taxiCost += cost;
      details = `🚗 呼叫美团打车 (高德路网预估里程 ${dist}公里，约 ${travelTime}分钟，预估 ¥${cost})`;
    }

    // 记录上一节点的到下节点交通
    if (i === 0) {
      // 第一段是从起点出发
      timeline.push({
        time: formatTime(currentMinutes),
        node: startNode,
        duration: 0,
        travelTimeToNext: travelTime,
        travelModeToNext: travelMode,
        travelLineDetails: details,
        distanceToNext: dist,
        actionLabel: '一键出发',
        actionStatus: 'idle'
      });
      currentMinutes += travelTime;
    } else {
      // 更新前一节点的 travel 属性
      const prevTimelineItem = timeline[timeline.length - 1];
      prevTimelineItem.travelTimeToNext = travelTime;
      prevTimelineItem.travelModeToNext = travelMode;
      prevTimelineItem.travelLineDetails = details;
      prevTimelineItem.distanceToNext = dist;
      currentMinutes += travelTime;
    }

    // 把 AIRecommendationNode 格式化为 LocationNode
    const lNode: LocationNode = {
      id: `dynamic-node-${i}`,
      name: nodeData.name,
      type: nodeData.type === 'hotel' ? 'play' : nodeData.type, // hotel 在 UI 渲染中归入景点模块展示
      coords: { x: 50, y: 50 },
      position: nodeData.position,
      tags: nodeData.tags,
      price: nodeData.price,
      duration: nodeData.duration,
      suitableFor: ['all'],
      description: nodeData.description,
      realtimeStatus: {
        availability: 'available',
        queueTables: 0,
        queueWaitMinutes: 0,
        ticketsLeft: 99
      }
    };

    // 动作标签
    let actionLabel = '智能游玩';
    if (nodeData.type === 'eat') {
      actionLabel = '自动预订餐厅靠窗座';
      
      mealOriginal += nodeData.price * personCount;
      mealCurrent += Math.round(nodeData.price * 0.9 * personCount); // 美团团购餐饮 9 折
      mealCoupon += (nodeData.price * personCount) - Math.round(nodeData.price * 0.9 * personCount);
    } else if (nodeData.type === 'hotel') {
      actionLabel = '预订美团限时尾房特惠';
      hotelNode = nodeData;
      
      hotelOriginal += nodeData.price;
      hotelCurrent += Math.round(nodeData.price * 0.7 * personCount); // 美团日落尾房 7 折
    } else {
      actionLabel = '在线扫码购票入园';
      
      ticketOriginal += nodeData.price * personCount;
      ticketCurrent += Math.round(nodeData.price * 0.85 * personCount); // 美团特惠门票 8.5 折
      ticketCount += personCount;
    }

    timeline.push({
      time: formatTime(currentMinutes),
      node: lNode,
      duration: nodeData.duration,
      actionLabel,
      actionStatus: 'idle'
    });

    currentMinutes += nodeData.duration;
    prevPos = nodeData.position;
    prevName = nodeData.name;
  }

  // 5. 闪购协同插针
  // 如果是高中生经典长跑行程，自动在餐饮点配送一盒“三九感冒灵/润喉糖”至餐厅前台，体现美团闪购的跨业务极速配送！
  const lastEatNodeIdx = timeline.findIndex(t => t.node.type === 'eat');
  if (lastEatNodeIdx !== -1) {
    retailCost = 15; // 一盒感冒灵 15 元
  }

  // 6. 计算最终的大账单与省钱金额
  const playSaving = ticketOriginal - ticketCurrent;
  const mealSaving = mealCoupon;
  const hotelSaving = hotelOriginal - hotelCurrent;
  
  const savingsTotal = playSaving + mealSaving + hotelSaving + (retailCost > 0 ? 5 : 0); // 闪送免配送费 5 元
  const grandTotal = ticketCurrent + mealCurrent + hotelCurrent + retailCost + taxiCost + subwayCost;

  const businessBill: MeituanBusinessBill = {
    savingsTotal,
    grandTotal
  };

  if (ticketOriginal > 0) {
    businessBill.ticketPrice = {
      original: ticketOriginal,
      current: ticketCurrent,
      label: `美团专享景点门票特惠`
    };
  }
  if (mealOriginal > 0) {
    businessBill.mealPrice = {
      original: mealOriginal,
      current: mealCurrent,
      couponDeducted: mealCoupon,
      label: `美团买单专享折扣`
    };
  }
  if (retailCost > 0) {
    businessBill.retailPrice = {
      cost: retailCost,
      deliveryFee: 0,
      label: `闪购美团买药 (免¥5跑腿费)`
    };
  }
  if (hotelNode && hotelOriginal > 0) {
    businessBill.hotelPrice = {
      original: hotelOriginal,
      current: hotelCurrent,
      label: `傍晚特惠尾房限时抢购价`
    };
  }
  if (taxiCost > 0) {
    businessBill.taxiPrice = {
      estimated: taxiCost,
      label: `美团打车 (高德路网计价)`
    };
  }
  if (subwayCost > 0) {
    businessBill.subwayPrice = {
      cost: subwayCost,
      label: `地铁交通票 (多段无缝绿色乘车)`
    };
  }

  // 计算多维匹配得分
  const dietScore = constraints.hasSlimming ? 95 : 85;
  const childFriendlyScore = constraints.hasChild ? 98 : 75;
  const friendsVibeScore = constraints.isFriendsGroup ? 96 : 80;
  const youthVibeScore =
    constraints.isYouthVibe || constraints.isThrillFun ? 97 : 78;
  const compatibilityScore = Math.round(
    (dietScore + childFriendlyScore + friendsVibeScore + youthVibeScore) / 4,
  );

  const totalTimeMinutes = currentMinutes - startMinutes;
  
  // 简短摘要
  const formatHourString = (min: number) => {
    const h = (min / 60).toFixed(1);
    return `${h}小时`;
  };

  const playNames = orderedNodes.filter(n => n.type === 'play').map(n => n.name).join('、');
  const hotelText = hotelNode ? `傍晚住宿 [${hotelNode.name}]，` : '';
  const summaryText = `小美已为您智能编排好全程约 ${formatHourString(totalTimeMinutes)} 的周末游学活动：先去游玩 [${playNames}]，${hotelText}累计为您打包立省 ￥${savingsTotal}！`;

  return {
    timeline,
    totalDistance: parseFloat(totalDistance.toFixed(1)),
    totalCost: grandTotal,
    totalTimeMinutes,
    compatibilityScore,
    dietScore,
    childFriendlyScore,
    friendsVibeScore,
    summaryText,
    businessBill
  };
}

// 辅助匹配最优零售闪购节点的逻辑
function matchBestRetailNode(constraints: AppConstraints): LocationNode {
  if (constraints.hasSlimming) {
    return MOCK_LOCATIONS.find(n => n.id === 'retail-3')!;
  }
  if (constraints.hasChild) {
    return MOCK_LOCATIONS.find(n => n.id === 'retail-2')!;
  }
  return MOCK_LOCATIONS.find(n => n.id === 'retail-1')!;
}

// ==========================================
// 3. 工具执行与异常自适应 Re-Planning 引擎
// ==========================================
export interface ThoughtLog {
  timestamp: string;
  type: 'thought' | 'action' | 'success' | 'error' | 'replan';
  message: string;
}

export async function executePlanTools(
  plan: ActivityPlan,
  constraints: AppConstraints,
  onProgress: (timeline: TimelineItem[], logs: ThoughtLog[]) => void,
  simulateError: boolean = false
): Promise<{ success: boolean; finalPlan: ActivityPlan; finalLogs: ThoughtLog[] }> {
  
  const currentTimeline = JSON.parse(JSON.stringify(plan.timeline)) as TimelineItem[];
  const logs: ThoughtLog[] = [];

  const addLog = (type: ThoughtLog['type'], message: string) => {
    const timeStr = new Date().toLocaleTimeString();
    logs.push({ timestamp: timeStr, type, message });
    onProgress([...currentTimeline], [...logs]);
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // --- Step 1: 解析隐式约束 ---
  addLog('thought', `正在分析用户目标: "${constraints.originalQuery}"`);
  await delay(1000);
  addLog('thought', `发现隐式约束 ── 出行画像: [${formatProfileSummary(constraints)}]。`);
  addLog('thought', `距离限制: < ${constraints.maxDistanceKm}km。正在调用 searchNearbyLocations()...`);
  await delay(800);

  // --- Step 2: 执行第一个景点门票购买 ---
  const playItem = currentTimeline[1];
  playItem.actionStatus = 'executing';
  addLog('action', `正在调用 buyTickets() 预订门票 ── [${playItem.node.name}]...`);
  await delay(1200);
  playItem.actionStatus = 'success';
  addLog('success', `门票预订成功！已在线模拟出票: 电子票码 [MT-${Math.floor(100000 + Math.random() * 900000)}]。`);
  await delay(600);

  // --- Step 3: 执行闪购跑腿配送 ---
  const matchedRetail = matchBestRetailNode(constraints);
  addLog('action', `美团闪购协同 ── 正在调用 dispatchDelivery() 派单 [${matchedRetail.name}]，拟送达 [${currentTimeline[2].node.name}]...`);
  await delay(1000);
  addLog('success', `闪购订单支付成功，配送骑手 [李小兵] 已接单，配送中。`);
  await delay(600);

  // --- Step 4: 执行就餐取号预订 (触发异常校验) ---
  const eatItem = currentTimeline[2];
  eatItem.actionStatus = 'executing';
  addLog('action', `正在调用 checkRealtimeStatus() 校验就餐名额 ── [${eatItem.node.name}]...`);
  await delay(1000);

  if (simulateError || eatItem.node.id === 'eat-6') {
    eatItem.actionStatus = 'failed';
    addLog('error', `[API EXCEPTION] 餐厅 [${eatItem.node.name}] 人数爆满！目前排号 ${eatItem.node.realtimeStatus.queueTables} 桌，等待约 ${eatItem.node.realtimeStatus.queueWaitMinutes} 分钟。超出合理行程时长。`);
    await delay(1000);
    
    // --- Re-Planning 开始 ---
    addLog('replan', `触发 Agent 自适应 Re-Planning！正在中断原就餐订单，调用 rePlanRoute()...`);
    await delay(1200);

    const rePlannedEat = MOCK_LOCATIONS.find(n => n.type === 'eat' && n.id !== eatItem.node.id && n.realtimeStatus.availability !== 'full')!;
    addLog('thought', `找到最优替代路线 ── 平替就餐点为 [${rePlannedEat.name}]，主打轻食沙拉，目前无需排队，距离景点仅 350 米。`);
    await delay(800);

    eatItem.node = rePlannedEat;
    eatItem.actionLabel = '自动预订餐厅卡座';
    eatItem.actionStatus = 'executing';
    
    const newDist = calculateDistance(currentTimeline[1].node.coords, rePlannedEat.coords);
    const newTravel = estimateTravelTime(newDist);
    currentTimeline[1].distanceToNext = newDist;
    currentTimeline[1].travelTimeToNext = newTravel.duration;
    currentTimeline[1].travelModeToNext = newTravel.mode;

    addLog('action', `正在为您自动全包下单平替方案：预订 [${rePlannedEat.name}] 沙拉座席并生成阻断片配药单...`);
    await delay(1500);
    
    eatItem.actionStatus = 'success';
    addLog('success', `平替餐饮预订成功！座位预约码 [SEAT-802]，已通知闪送骑手修改送达目的地。`);
    await delay(800);

    const newPlan = generateSmartPlan(constraints, [currentTimeline[1].node.id, rePlannedEat.id]);
    addLog('success', `🎉 全链路“帮我把事情做完”一键式落地成功！所有订单已闭环，正在为您生成微信分享文案...`);
    
    return {
      success: true,
      finalPlan: newPlan,
      finalLogs: logs
    };
  }

  eatItem.actionStatus = 'success';
  addLog('success', `就餐席位锁定成功！预约码 [SEAT-${Math.floor(100 + Math.random() * 900)}]。提前取座生效中。`);
  await delay(800);
  addLog('success', `🎉 全链路“帮我把事情做完”一键式落地成功！所有订单已闭环，正在为您生成微信分享文案...`);

  return {
    success: true,
    finalPlan: plan,
    finalLogs: logs
  };
}

// ==========================================
// 4. 微信文案分享生成
// ==========================================
export function generateShareText(plan: ActivityPlan): string {
  const t = plan.timeline;
  if (t.length <= 1) {
    return "老婆，今天周末游玩计划已经安排妥当啦！随时可以出发～";
  }

  const startItem = t[0];
  const playItems = t.slice(1).filter(item => item.node.type === 'play' && item.node.id !== 'start-node');
  const eatItems = t.slice(1).filter(item => item.node.type === 'eat');
  const hotelItem = t.slice(1).find(item => item.node.name.includes('酒店') || item.node.name.includes('全季'));

  const playNames = playItems.map(item => item.node.name).join('、');
  const eatNames = eatItems.map(item => item.node.name).join('、');

  let shareText = `老婆，今天的周末活动帮咱家搞定啦！安排妥妥的，行程 ${startItem.time} 准时出发：\n`;
  if (playNames) {
    shareText += `1. 玩乐精选：去游玩 [${playNames}]，我已经把票买好啦～\n`;
  }
  if (eatNames) {
    shareText += `2. 美食大餐：去吃 [${eatNames}]，我查了不需要现场排长队，座位/特惠已锁定！\n`;
  }
  if (plan.businessBill.retailPrice) {
    shareText += `3. 即时买药/闪送：我还通过美团买药提前给咱送了润喉糖/阻断片，直接寄到餐厅～\n`;
  }
  if (hotelItem) {
    shareText += `4. 温馨落脚点：晚上我们顺便住在附近的 [${hotelItem.node.name}]，已享受美团傍晚日落尾房超低闪惠价！\n`;
  }
  shareText += `\n大账单已帮我们合并美团特惠，累计打包省下 ￥${plan.businessBill.savingsTotal}！搞定了，我们出发！`;
  return shareText;
}
