import { useState, useEffect, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { getThemeColors, ThemeColors, setTheme as setThemeUtil } from '../utils/themeManager';

interface UseThemeResult {
  theme: ThemeColors;
  setTheme: (themeColors: ThemeColors) => void;
  lightenColor: (hex: string, amount: number) => string;
  hexToRgba: (hex: string, alpha: number) => string;
}

export function useTheme(): UseThemeResult {
  const [theme, setThemeState] = useState<ThemeColors>(getThemeColors());

  useEffect(() => {
    // 监听主题变化事件
    const themeChangeHandler = (newTheme: ThemeColors) => {
      setThemeState(newTheme);
    };
    
    Taro.eventCenter.on('themeChange', themeChangeHandler);
    
    return () => {
      Taro.eventCenter.off('themeChange', themeChangeHandler);
    };
  }, []);

  // 设置主题并触发事件
  const setTheme = useCallback((newTheme: ThemeColors) => {
    setThemeUtil(newTheme);
    setThemeState(newTheme);
  }, []);

  // 浅色处理函数
  const lightenColor = useCallback((hex: string, amount: number): string => {
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
  }, []);

  // 颜色转rgba
  const hexToRgba = useCallback((hex: string, alpha: number): string => {
    // 移除#号
    hex = hex.replace('#', '');
    
    // 转为RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  return {
    theme,
    setTheme,
    lightenColor,
    hexToRgba
  };
} 