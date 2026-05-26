import type { AppConstraints } from '../agentEngine';

/** 出行画像字段（与 AppConstraints 中的布尔字段对应） */
export type TravelProfileKey =
  | 'hasChild'
  | 'hasSlimming'
  | 'isFriendsGroup'
  | 'isYouthVibe'
  | 'isThrillFun'
  | 'isCoupleDate'
  | 'isChillRelax'
  | 'isBudgetSaver';

export const TRAVEL_PROFILE_META: {
  key: TravelProfileKey;
  label: string;
  color: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'pink' | 'teal' | 'orange';
  test: RegExp;
}[] = [
  { key: 'isYouthVibe', label: '热血青春', color: 'rose', test: /(热血|激情|年轻|青春|00后|95后|z世代|燃|很嗨|嗨翻|元气|潮流|网红打卡|打卡圣地|不服老|冲冲冲)/ },
  { key: 'isThrillFun', label: '刺激嗨玩', color: 'violet', test: /(刺激|爽|玩疯|密室|剧本杀|蹦迪|livehouse|音乐节|酒吧|夜店|电竞|过山车|鬼屋|滑雪|冲浪|攀岩|卡丁车)/ },
  { key: 'isFriendsGroup', label: '朋友聚会', color: 'amber', test: /(朋友|男生|女生|聚会|闺蜜|兄弟|桌游|社交|一帮|姐妹局|兄弟局)/ },
  { key: 'isCoupleDate', label: '情侣约会', color: 'pink', test: /(情侣|约会|二人世界|男朋友|女朋友|对象|纪念日|浪漫|烛光)/ },
  { key: 'hasChild', label: '带娃家庭', color: 'cyan', test: /(孩子|娃|宝|儿童|5岁|五岁|三岁|学龄前|亲子)/ },
  { key: 'hasSlimming', label: '控糖低卡', color: 'emerald', test: /(减肥|减脂|瘦|轻食|沙拉|卡路里|控糖|热量|减重|低卡)/ },
  { key: 'isChillRelax', label: '松弛疗愈', color: 'teal', test: /(放松|疗愈|佛系|慢生活|发呆|露营|看海|温泉|spa|晒太阳|治愈|躺平)/ },
  { key: 'isBudgetSaver', label: '高性价比', color: 'orange', test: /(省钱|便宜|性价比|预算|穷游|薅羊毛|实惠|不贵|控制花费)/ },
];

export function parseTravelProfiles(text: string): Pick<AppConstraints, TravelProfileKey> {
  const s = text.toLowerCase();
  const out = {} as Pick<AppConstraints, TravelProfileKey>;
  for (const { key, test } of TRAVEL_PROFILE_META) {
    out[key] = test.test(s);
  }
  return out;
}

export function mergeTravelProfiles(
  fromAi: Partial<Record<TravelProfileKey, boolean>> | undefined,
  query: string,
): Pick<AppConstraints, TravelProfileKey> {
  const local = parseTravelProfiles(query);
  const merged = { ...local };
  if (fromAi) {
    for (const { key } of TRAVEL_PROFILE_META) {
      if (typeof fromAi[key] === 'boolean') {
        merged[key] = fromAi[key]!;
      }
    }
  }
  return merged;
}

export function getMatchedProfileLabels(constraints: AppConstraints): string[] {
  return TRAVEL_PROFILE_META.filter(p => constraints[p.key]).map(p => p.label);
}

export function formatProfileSummary(constraints: AppConstraints): string {
  const labels = getMatchedProfileLabels(constraints);
  return labels.length > 0 ? labels.join('、') : '通用周末';
}

/** 填写时可对照的要点（提醒用户说什么，画像才更好识别） */
export const INPUT_HINT_CHECKLIST = [
  { icon: '👥', title: '谁一起', detail: '朋友聚会 / 情侣约会 / 带娃家庭' },
  { icon: '🔥', title: '什么氛围', detail: '热血青春 / 刺激嗨玩 / 松弛疗愈' },
  { icon: '📍', title: '去哪玩', detail: '目的地、想去的店或景点名称' },
  { icon: '⏱️', title: '时间与范围', detail: '周六下午、约 4 小时、离家 3 公里内' },
  { icon: '🥗', title: '饮食偏好', detail: '控糖低卡、清淡、人均预算' },
  { icon: '🚇', title: '交通方式', detail: '地铁 / 打车 / 步行（可选）' },
] as const;

/** 一键填入的示例句（覆盖各类画像关键词） */
export const PROFILE_EXAMPLE_PROMPTS = [
  {
    label: '热血夜玩',
    text: '周末和兄弟来一场热血激情的城市夜玩，想打卡潮流地标，再安排密室或 Live，别太远，下午 4 小时左右',
  },
  {
    label: '情侣约会',
    text: '年轻情侣浪漫约会，想吃饭再看夜景，预算适中，打车出行',
  },
  {
    label: '带娃轻松',
    text: '带 5 岁娃和老婆，周六下午 3 公里内，先室内乐园再吃点清淡的，控糖低卡',
  },
  {
    label: '刺激嗨玩',
    text: '朋友聚会想玩刺激一点的，密室剧本杀或电竞都行，嗨一晚，地铁方便到达',
  },
  {
    label: '松弛周末',
    text: '想放松疗愈一下，露营或温泉慢生活，不赶行程，性价比高一点',
  },
] as const;

export const INPUT_PLACEHOLDER_AI =
  '例：我和兄弟周末热血打卡，想潮流夜玩+密室，下午 4 小时、3 公里内，地铁出行…';

export const INPUT_PLACEHOLDER_STANDARD =
  '例：带 5 岁娃，周六下午 3 公里内，先玩再吃清淡的…（也可点下方场景快捷填入）';
