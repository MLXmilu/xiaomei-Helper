import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const dir = dirname(fileURLToPath(import.meta.url));
const content = `export const HOME_COPY = {
  badge: '美团周末管家 2.0',
  title: '开始规划我的周末',
  titleHighlight: '',
  subtitle:
    '美团周末管家 — 本地短时出行规划与一键执行。从自然语言理解到路线规划、一键下单，让每次陪伴更温馨简单。',
  subtitleShort:
    '告诉小美你的周末安排，帮你串联行程、订好吃喝玩乐、买票避排队。',
  quickStartLabel: '或选择一个场景，快速开启：',
  moreScenes: '更多场景',
  continueLabel: '继续上次的规划',
  continueAction: '接着规划',
  lastEditedPrefix: '上次编辑',
  ctaPrimary: '开始规划我的周末',
  ctaRandom: '随机灵感',
  navRecommend: '智能推荐上线',
  ctaDemo: '体验亲子示例',
  trust: ['离家3公里内', '避开排队高峰', '一键全包下单'],
  featuresTitle: '四大核心能力',
  featuresSubtitle: '从理解到执行，全链路闭环',
  scenariosTitle: '热门出行场景',
  scenariosSubtitle: '一键体验不同画像下的智能规划',
  stepsTitle: '三步搞定周末',
  recentTitle: '最近规划',
  ctaBannerTitle: '准备好规划下一个周末了吗？',
  ctaBannerDesc: '让小美帮你把想法变成可执行的完美行程',
  ctaBannerBtn: '立即开始规划',
  viewAll: '查看全部',
  tryNow: '立即体验',
  preview: {
    assistant: '管家小美',
    role: '您的周末出行顾问',
    emoji: '👩‍💼',
    online: '在线',
    quote:
      '带5岁娃和减肥老婆，周六下午3公里内，帮我安排吃喝玩乐，避开排队高峰...',
    planTitle: '为你定制的周末方案',
    planIcons: [
      { icon: '📋', label: '行程' },
      { icon: '🗺️', label: '地图' },
      { icon: '🛒', label: '下单' },
      { icon: '⏱️', label: '避峰' },
    ],
    venues: [
      { icon: '🎪', label: '奈尔宝乐园', price: '¥198' },
      { icon: '🥗', label: 'Wagas 轻食', price: '¥85' },
      { icon: '🚇', label: '地铁 14 号线', price: '¥6' },
    ],
    totalLabel: '预估全包价',
    total: '¥269',
    viewPlan: '查看完整方案',
  },
  steps: [
    { step: '01', title: '说出心愿', desc: '用话描述出行心愿，自动识别带娃、减肥等需求' },
    { step: '02', title: '查看方案', desc: '高德地图连线 + 时间轴行程，随时调整顺序' },
    { step: '03', title: '一键下单', desc: '门票、订座、闪购、打车全包，管家帮你搞定' },
  ],
  stats: [
    { value: '3km', label: '智能半径过滤' },
    { value: '<1s', label: '本地极速匹配' },
    { value: '全包', label: '门票订座闪送' },
  ],
} as const;
`;

writeFileSync(join(dir, '../src/constants/copy.ts'), content, 'utf8');
console.log('copy.ts updated');
