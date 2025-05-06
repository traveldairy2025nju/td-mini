// 环境配置文件
// 根据不同环境设置不同的API基础URL

// 开发环境配置
export const DEV_CONFIG = {
  BASE_URL: 'http://localhost:3000',
};

// 生产环境配置
export const PROD_CONFIG = {
  BASE_URL: 'https://your-production-api-url.com', // 生产环境URL，需要在部署前修改
};

// 根据环境变量选择配置
const ENV_CONFIG = process.env.NODE_ENV === 'production' ? PROD_CONFIG : DEV_CONFIG;

export default ENV_CONFIG; 