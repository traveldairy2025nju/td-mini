/**
 * 颜色工具类
 * 提供HSV、RGB和Hex颜色格式的转换函数
 */

// HSV转RGB
export const hsv2rgb = (h: number, s: number, v: number): { r: number, g: number, b: number } => {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

// RGB转HSV
export const rgb2hsv = (r: number, g: number, b: number): { h: number, s: number, v: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta === 0) {
    h = 0;
  } else if (max === r) {
    h = ((g - b) / delta) % 6;
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }

  h /= 6;
  if (h < 0) h += 1;

  return { h, s, v };
};

// RGB转Hex
export const rgb2hex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

// Hex转RGB
export const hex2rgb = (hex: string): { r: number, g: number, b: number } => {
  // 移除# 如果存在
  hex = hex.replace('#', '');
  
  // 支持短格式 #fff -> #ffffff
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
};

// 生成预设颜色数组
export const generatePresetColors = (): string[] => {
  return [
    '#FF0000', // Red
    '#FF4500', // OrangeRed
    '#FF8C00', // DarkOrange
    '#FFD700', // Gold
    '#FFFF00', // Yellow
    '#9ACD32', // YellowGreen
    '#00FF00', // Lime
    '#008000', // Green
    '#00FFFF', // Cyan
    '#1E90FF', // DodgerBlue
    '#0000FF', // Blue
    '#800080', // Purple
    '#FF00FF', // Magenta
    '#C71585', // MediumVioletRed
    '#8B4513', // SaddleBrown
    '#A0522D', // Sienna
    '#F5F5DC', // Beige
    '#FFFFFF', // White
    '#A9A9A9', // DarkGray
    '#000000'  // Black
  ];
};

/**
 * 将颜色变浅
 * @param hex 十六进制颜色值
 * @param amount 变浅的程度（0-1）
 * @returns 变浅后的颜色值
 */
export function lightenColor(hex: string, amount: number): string {
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

/**
 * 将十六进制颜色转换为RGBA颜色
 * @param hex 十六进制颜色值
 * @param alpha 透明度（0-1）
 * @returns RGBA颜色字符串
 */
export function hexToRgba(hex: string, alpha: number): string {
  // 移除#号
  hex = hex.replace('#', '');
  
  // 转为RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // 返回rgba格式
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
} 