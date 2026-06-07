export interface LocationNode {
  id: string;
  name: string;
  type: 'play' | 'eat' | 'retail';
  coords: { x: number; y: number }; // 0-100 局部坐标系，保持与原有打分系统兼容
  position: [number, number];       // 真实高德经纬度坐标 [lng, lat]
  tags: string[];
  price: number;
  duration: number; // 建议游玩/用餐分钟数
  suitableFor: ('child' | 'slimming' | 'friends' | 'all')[];
  description: string;
  realtimeStatus: {
    availability: 'available' | 'limited' | 'full';
    queueTables: number; // 餐饮排号桌数
    queueWaitMinutes: number; // 预计排队等待分钟
    ticketsLeft?: number; // 游玩票数
  };
}

// 模拟北京“朝阳公园 / 蓝色港湾”商圈的真实高德物理坐标数据
export const MOCK_LOCATIONS: LocationNode[] = [
  // ================= 游玩/活动节点 (Play - 适合亲子或朋友) =================
  {
    id: 'play-1',
    name: '奈尔宝家庭中心 (蓝色港湾店)',
    type: 'play',
    coords: { x: 25, y: 30 },
    position: [116.479133, 39.953049],
    tags: ['亲子乐园', '室内恒温', '高安全性', '5岁宝宝极力推荐'],
    price: 198,
    duration: 120,
    suitableFor: ['child', 'all'],
    description: '国内顶奢室内儿童乐园，配有全职看护与高安全性软包设计，适合3-8岁儿童，家长可完全松弛。',
    realtimeStatus: { availability: 'available', queueTables: 0, queueWaitMinutes: 0, ticketsLeft: 45 }
  },
  {
    id: 'play-2',
    name: 'UCCA尤伦斯当代艺术中心展',
    type: 'play',
    coords: { x: 45, y: 15 },
    position: [116.493863, 39.986877],
    tags: ['潮流展览', '高颜值拍照', '艺术熏陶', '男女聚会'],
    price: 120,
    duration: 90,
    suitableFor: ['friends', 'all'],
    description: '当前火爆的先锋艺术家中国首展，现场空间布置极具张力，极适合年轻人拍照发朋友圈。',
    realtimeStatus: { availability: 'available', queueTables: 0, queueWaitMinutes: 0, ticketsLeft: 12 }
  },
  {
    id: 'play-3',
    name: '极客部落沉浸式密室 (微恐版)',
    type: 'play',
    coords: { x: 75, y: 35 },
    position: [116.488056, 39.948611],
    tags: ['沉浸密室', '悬疑烧脑', '心跳刺激', '解压神作'],
    price: 158,
    duration: 90,
    suitableFor: ['friends'],
    description: '极具烧脑性的机械解密密室，有真人NPC互动，适合年轻人组队解压。不适合5岁儿童。',
    realtimeStatus: { availability: 'limited', queueTables: 0, queueWaitMinutes: 0, ticketsLeft: 4 }
  },
  {
    id: 'play-4',
    name: '木木手工皮艺DIY工坊',
    type: 'play',
    coords: { x: 30, y: 55 },
    position: [116.469145, 39.944208],
    tags: ['DIY手作', '情侣推荐', '静心慢节奏', '高质感'],
    price: 135,
    duration: 100,
    suitableFor: ['friends', 'all'],
    description: '温馨静谧的手工皮具工坊，可亲手制作钥匙扣、钱包，专业指导，适合情侣、闺蜜打发下午。',
    realtimeStatus: { availability: 'available', queueTables: 0, queueWaitMinutes: 0, ticketsLeft: 8 }
  },
  {
    id: 'play-5',
    name: '乐派派儿童海洋水上乐园',
    type: 'play',
    coords: { x: 20, y: 40 },
    position: [116.476000, 39.948000],
    tags: ['水上亲子', '温水泳池', '儿童嬉戏'],
    price: 160,
    duration: 120,
    suitableFor: ['child', 'all'],
    description: '室内四季温水水乐园，滑梯安全性极高，水深仅40cm，适合低龄宝宝嬉水。',
    realtimeStatus: { availability: 'available', queueTables: 0, queueWaitMinutes: 0, ticketsLeft: 30 }
  },
  {
    id: 'play-6',
    name: '幻境VR元宇宙极速空间',
    type: 'play',
    coords: { x: 80, y: 20 },
    position: [116.485000, 39.960000],
    tags: ['科技电玩', '极限竞速', '多人群游'],
    price: 98,
    duration: 60,
    suitableFor: ['friends'],
    description: '戴上最新款VR头显体验过山车与多人射击大作，沉浸感十足，深受年轻人喜爱。',
    realtimeStatus: { availability: 'available', queueTables: 0, queueWaitMinutes: 0, ticketsLeft: 20 }
  },

  // ================= 餐饮节点 (Eat - 适合不同人群饮食习惯) =================
  {
    id: 'eat-1',
    name: '绿色工坊 · 减脂轻食 (商圈店)',
    type: 'eat',
    coords: { x: 35, y: 35 },
    position: [116.478800, 39.952500],
    tags: ['轻食沙拉', '少油低盐', '标注卡路里', '老婆减肥极力推荐'],
    price: 65,
    duration: 60,
    suitableFor: ['slimming', 'all'],
    description: '专业营养师配比的减脂沙拉餐厅，招牌烤鸡胸肉能量碗仅380大卡，低碳无负担，深得减脂人群好评。',
    realtimeStatus: { availability: 'available', queueTables: 0, queueWaitMinutes: 0 }
  },
  {
    id: 'eat-2',
    name: '西贝莜面村 (家庭亲子餐厅)',
    type: 'eat',
    coords: { x: 28, y: 32 },
    position: [116.479500, 39.953500],
    tags: ['亲子餐厅', '儿童餐免费', '环境卫生', '适合宝宝'],
    price: 95,
    duration: 70,
    suitableFor: ['child', 'all'],
    description: '西北民间菜，主打健康杂粮与鲜嫩牛羊肉。承诺不添加香精色素，免费提供高品质婴儿餐和宝宝玩具包。',
    realtimeStatus: { availability: 'available', queueTables: 2, queueWaitMinutes: 10 }
  },
  {
    id: 'eat-3',
    name: '赤坂炙烤 · 潮流日式烧肉店',
    type: 'eat',
    coords: { x: 70, y: 40 },
    position: [116.481200, 39.954800],
    tags: ['高档日料', '肉质极佳', '聚会常客', '油脂丰富'],
    price: 220,
    duration: 80,
    suitableFor: ['friends'],
    description: '工业风日式烤肉排队王，主打M9和牛雪花排、厚切牛舌，氛围感拉满，适合男女性社交，但油脂较高，不适合减肥。',
    realtimeStatus: { availability: 'limited', queueTables: 18, queueWaitMinutes: 45 }
  },
  {
    id: 'eat-4',
    name: '青藤小院 · 精致无糖素食馆',
    type: 'eat',
    coords: { x: 50, y: 50 },
    position: [116.475500, 39.951000],
    tags: ['精致素食', '有机无糖', '禅意空间', '减肥轻断食'],
    price: 140,
    duration: 75,
    suitableFor: ['slimming', 'all'],
    description: '隐藏在商圈顶层的禅意素食，采用无糖配方与有机食材制作精致菜肴，对控糖减脂人士极其友好。',
    realtimeStatus: { availability: 'available', queueTables: 0, queueWaitMinutes: 0 }
  },
  {
    id: 'eat-5',
    name: '小木屋米酒屋 · 延边社交酒馆',
    type: 'eat',
    coords: { x: 78, y: 45 },
    position: [116.483000, 39.956000],
    tags: ['社交酒馆', '特色延边菜', '把酒言欢', '帅哥美女偏爱'],
    price: 110,
    duration: 90,
    suitableFor: ['friends'],
    description: '主打特色蓝莓米酒、辣鸡爪与参鸡汤，小酌社交的圣地，夜晚气氛极其热闹，备受年轻人追捧。',
    realtimeStatus: { availability: 'limited', queueTables: 12, queueWaitMinutes: 30 }
  },
  {
    id: 'eat-6',
    name: '凑凑火锅茶憩 (蓝色港湾爆满店)',
    type: 'eat',
    coords: { x: 40, y: 28 },
    position: [116.479300, 39.953200],
    tags: ['有料火锅', '网红台式奶茶', '社交排队王'],
    price: 160,
    duration: 90,
    suitableFor: ['friends'],
    description: '主打台式麻辣锅与大红袍珍珠奶茶，社交属性极强。本商圈爆满店，常年需要长时间排号。',
    realtimeStatus: { availability: 'full', queueTables: 48, queueWaitMinutes: 110 }
  },

  // ================= 即时零售/闪购节点 (Retail - 支撑一键购的配送操作) =================
  {
    id: 'retail-1',
    name: '野兽派花艺 · 蓝色港湾闪送店',
    type: 'retail',
    coords: { x: 30, y: 10 },
    position: [116.478500, 39.954000],
    tags: ['跑腿送花', '轻奢高颜值', '纪念日神助攻'],
    price: 299,
    duration: 25,
    suitableFor: ['all'],
    description: '精美手捧花束，包含保鲜玫瑰与优雅包装，专人闪送，30分钟内送达指定餐厅。',
    realtimeStatus: { availability: 'available', queueTables: 0, queueWaitMinutes: 0 }
  },
  {
    id: 'retail-2',
    name: '好利来 · 精致烘焙蛋糕铺',
    type: 'retail',
    coords: { x: 55, y: 25 },
    position: [116.479800, 39.952800],
    tags: ['生日蛋糕', '经典芝士', '甜蜜特送'],
    price: 168,
    duration: 30,
    suitableFor: ['child', 'friends', 'all'],
    description: '经典半熟芝士蛋糕、巧克熊宝宝蛋糕，全线使用纯动物奶油，下单即配蜡烛与生日帽。',
    realtimeStatus: { availability: 'available', queueTables: 0, queueWaitMinutes: 0 }
  },
  {
    id: 'retail-3',
    name: '小美买药 · 24小时药急送',
    type: 'retail',
    coords: { x: 48, y: 60 },
    position: [116.474000, 39.946000],
    tags: ['即时送药', '餐前阻断', '日常必备', '解酒护肝'],
    price: 45,
    duration: 15,
    suitableFor: ['slimming', 'friends', 'all'],
    description: '提供餐前白芸豆阻断片（减肥伴侣）、即时醒酒药、儿童防蚊贴等急需物资，15分钟必达。',
    realtimeStatus: { availability: 'available', queueTables: 0, queueWaitMinutes: 0 }
  }
];

// 模拟初始的地理位置坐标（小明的家：北京市朝阳区枣营北里附近真实经纬度）
export const START_COORDS = { 
  x: 10, 
  y: 20,
  position: [116.473551, 39.957018] as [number, number]
};
