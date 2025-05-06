import Taro from '@tarojs/taro';
import { clearIconCache } from './iconHelper';

// 主题色类型定义
export interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
}

// 预设主题
export const THEMES = {
  default: {
    primaryColor: '#1296db',
    secondaryColor: '#ff5348'
  },
  red: {
    primaryColor: '#f5222d',
    secondaryColor: '#fa8c16'
  },
  green: {
    primaryColor: '#52c41a',
    secondaryColor: '#13c2c2'
  },
  purple: {
    primaryColor: '#722ed1',
    secondaryColor: '#eb2f96'
  }
};

// 主题存储的键名
const THEME_STORAGE_KEY = 'TD_THEME_COLORS';

// 获取当前主题颜色
export function getThemeColors(): ThemeColors {
  try {
    const themeStr = Taro.getStorageSync(THEME_STORAGE_KEY);
    if (themeStr) {
      return JSON.parse(themeStr);
    }
  } catch (e) {
    console.error('读取主题配置失败', e);
  }
  
  // 默认返回默认主题
  return THEMES.default;
}

// 应用主题到CSS变量
export function applyTheme(theme: ThemeColors = getThemeColors()): void {
  // 获取 CSS 根节点
  if (typeof document !== 'undefined') {
    // H5环境
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    
    // 设置RGB值，用于rgba计算
    const rgb = hexToRgb(theme.primaryColor);
    document.documentElement.style.setProperty('--primary-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    
    document.documentElement.style.setProperty('--primary-light', `${theme.primaryColor}1a`); // 10%透明度
    document.documentElement.style.setProperty('--primary-dark', darkenColor(theme.primaryColor, 0.2));
    document.documentElement.style.setProperty('--primary-light-color', lightenColor(theme.primaryColor, 0.6)); // 浅色版主题色
    document.documentElement.style.setProperty('--primary-shadow', `${theme.primaryColor}4d`); // 30%透明度
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
  } else {
    // 小程序环境下，使用页面样式设置
    // 注意：小程序不能直接操作 CSS 变量，只能通过内联样式设置
    console.log('应用主题色:', theme);
    Taro.nextTick(() => {
      // 通过事件通知页面更新主题
      Taro.eventCenter.trigger('themeChange', theme);
    });
  }
}

// 辅助函数: Hex转RGB
function hexToRgb(hex: string): {r: number, g: number, b: number} {
  // 移除#号
  hex = hex.replace('#', '');
  
  // 转为RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

// 保存并应用主题
export function setTheme(theme: ThemeColors, needReload: boolean = true): void {
  try {
    // 清除图标缓存
    clearIconCache();
    
    // 保存到存储中
    Taro.setStorageSync(THEME_STORAGE_KEY, JSON.stringify(theme));
    // 应用主题
    applyTheme(theme);
    
    // 小程序环境下需要重新加载应用来应用主题
    if (needReload && process.env.TARO_ENV !== 'h5') {
      // 延迟执行，确保主题设置已保存
      setTimeout(() => {
        // 重新加载小程序
        const currentPage = Taro.getCurrentPages().pop();
        const route = currentPage ? currentPage.route : 'pages/index/index';
        Taro.reLaunch({
          url: `/${route}`,
          success: () => {
            console.log('小程序已重新加载以应用主题');
          }
        });
      }, 500);
    }
  } catch (e) {
    console.error('保存主题配置失败', e);
  }
}

// 切换到预设主题
export function switchToPresetTheme(themeName: keyof typeof THEMES): void {
  const theme = THEMES[themeName];
  if (theme) {
    setTheme(theme);
  }
}

// 创建自定义主题
export function createCustomTheme(primaryColor: string, secondaryColor?: string): void {
  const customTheme: ThemeColors = {
    primaryColor,
    secondaryColor: secondaryColor || getComplementaryColor(primaryColor)
  };
  setTheme(customTheme);
}

// 辅助函数: 颜色加深
function darkenColor(hex: string, amount: number): string {
  // 移除#号
  hex = hex.replace('#', '');
  
  // 转为RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // 加深颜色
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));
  
  // 转回hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 辅助函数: 颜色变浅
function lightenColor(hex: string, amount: number): string {
  // 移除#号
  hex = hex.replace('#', '');
  
  // 转为RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // 变浅颜色
  r = Math.min(255, Math.floor(r + (255 - r) * amount));
  g = Math.min(255, Math.floor(g + (255 - g) * amount));
  b = Math.min(255, Math.floor(b + (255 - b) * amount));
  
  // 转回hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 辅助函数: 获取互补色
function getComplementaryColor(hex: string): string {
  hex = hex.replace('#', '');
  
  // 转为RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // 求互补色 (255 - 原色)
  r = 255 - r;
  g = 255 - g;
  b = 255 - b;
  
  // 转回hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
} 