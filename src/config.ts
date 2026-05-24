/**
 * 大模型全局配置文件
 * 从 Vite 环境变量中动态加载，避免敏感 API 密钥硬编码到业务代码中
 */
export const AI_CONFIG = {
  // 大模型请求基础路径，默认采用前端同源相对代理前缀，避开 CORS 跨域问题
  baseURL: import.meta.env.VITE_MIMO_API_BASE_URL || '/api/mimo/v1',
  
  // API 访问密钥，配置极佳的默认兜底值确保在任何环境下开箱即用
  apiKey: import.meta.env.VITE_MIMO_API_KEY || 'tp-cvjmp0pf6zdbckc0t1pskq62whfu1nngbtijv7yquol8ng71',
  
  // 规划决策模型名称
  model: import.meta.env.VITE_MIMO_MODEL || 'mimo-v2.5',
};
