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