export const PLANNER_COPY = {
  pageTitle: '行程规划',
  pageSubtitle: '在左侧说出安排，地图与时间轴会同步更新',
  simulateError: '模拟下单失败',
  aiModeTitle: '联网推荐模式',
  aiModeDesc: '请写清：谁一起、什么氛围（如热血/刺激/放松）、去哪、多久多远。写完后右侧会出现出行画像标签。',
  emptyEmoji: '🗺️',
  emptyTitle: '还没有行程',
  emptyDesc: '在左侧输入或选一个场景，小美会帮你排路线',
  timelineTitle: '时间轴',
} as const;

export const HISTORY_COPY = {
  pageTitle: '决策历史',
  pageSubtitle: '仅展示与 AI 管家小美的对话规划记录',
  clearAll: '清空全部',
  deleteSelected: '删除选中',
  selectAll: '全选',
  emptyEmoji: '💬',
  emptyTitle: '暂无数据',
  emptyDesc: '请先在「行程规划」开启智能推荐并完成一次 AI 对话，记录会自动出现在这里',
  emptyCta: '去和 AI 规划周末',
  restore: '恢复此对话方案',
} as const;

export const CASHIER_COPY = {
  title: '确认下单',
  savingsTag: 'SUPER SAVINGS',
  savingsDesc: '门票/订座/闪购',
  savingsLabel: '共省',
  ticketPrefix: '门票',
  ticketSuffix: '预订',
  mealPrefix: '订座',
  mealSuffix: '排号',
  retailTitle: '闪购 补给',
  hotelTitle: '酒店 住宿',
  taxiTitle: '打车 接送',
  totalLabel: '应付合计',
  paying: '支付中...',
  confirmPay: '确认支付',
  cancel: '取消',
} as const;
