import Taro from '@tarojs/taro';

// 缓存处理过的图标，避免重复处理
const iconCache: Record<string, string> = {};

/**
 * 清除图标缓存
 * 当主题更改时调用
 */
export function clearIconCache(): void {
  // 清空缓存对象
  for (const key in iconCache) {
    delete iconCache[key];
  }
  console.log('图标缓存已清空');
}

/**
 * 为SVG图标添加指定颜色
 * @param svgPath SVG图标的路径
 * @param color 要应用的颜色，十六进制格式(#RRGGBB)
 * @returns Base64编码的SVG数据URL
 */
export async function getSvgIconWithColor(svgPath: string, color: string): Promise<string> {
  const cacheKey = `${svgPath}_${color}`;
  
  // 检查缓存
  if (iconCache[cacheKey]) {
    return iconCache[cacheKey];
  }
  
  try {
    // 读取SVG文件
    const res = await Taro.getFileSystemManager().readFileSync(svgPath, 'utf8');
    const svgContent = res as string;
    
    // 注入颜色
    const coloredSvg = svgContent.replace(/fill="([^"]*)"/g, `fill="${color}"`);
    
    // 转为Base64编码的数据URL
    // 使用TextEncoder将字符串转换为ArrayBuffer
    const encoder = new TextEncoder();
    const arrayBuffer = encoder.encode(coloredSvg).buffer;
    const base64 = Taro.arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:image/svg+xml;base64,${base64}`;
    
    // 缓存结果
    iconCache[cacheKey] = dataUrl;
    
    return dataUrl;
  } catch (e) {
    console.error('处理SVG图标失败', e);
    return svgPath; // 出错时返回原路径
  }
}

/**
 * 为PNG图标添加指定颜色
 * @param pngPath PNG图标路径
 * @param color 要应用的颜色，十六进制格式(#RRGGBB)
 * @returns 处理后的临时图片路径
 */
export function getPngIconWithColor(pngPath: string, color: string): Promise<string> {
  const cacheKey = `${pngPath}_${color}`;
  
  // 检查缓存
  if (iconCache[cacheKey]) {
    return Promise.resolve(iconCache[cacheKey]);
  }
  
  return new Promise((resolve, reject) => {
    // 处理相对路径，尝试将相对路径转换为绝对路径
    const fixedPath = pngPath.startsWith('../') 
      ? pngPath.replace('../', '/') 
      : pngPath;
    
    // 创建一个临时canvas进行颜色处理
    const canvasId = `iconCanvas_${Date.now()}`;
    
    // 获取图片信息
    Taro.getImageInfo({
      src: fixedPath,
      success: (imgInfo) => {
        const ctx = Taro.createCanvasContext(canvasId);
        
        // 绘制原图
        ctx.drawImage(fixedPath, 0, 0, imgInfo.width, imgInfo.height);
        
        // 应用颜色
        ctx.globalCompositeOperation = 'source-in';
        ctx.setFillStyle(color);
        ctx.fillRect(0, 0, imgInfo.width, imgInfo.height);
        
        // 导出为图片
        ctx.draw(false, () => {
          Taro.canvasToTempFilePath({
            canvasId,
            success: (res) => {
              // 缓存结果
              iconCache[cacheKey] = res.tempFilePath;
              resolve(res.tempFilePath);
            },
            fail: (err) => {
              console.error('生成临时图片失败:', err);
              // 失败时返回原路径
              resolve(pngPath);
            }
          });
        });
      },
      fail: (err) => {
        console.error('获取图片信息失败:', err, '图片路径:', fixedPath);
        // 图片不存在或无法加载时，直接返回原路径
        resolve(pngPath);
      }
    });
  });
}

/**
 * 根据文件类型，为图标添加颜色
 * @param iconPath 图标路径
 * @param color 要应用的颜色
 * @returns 处理后的图标路径
 */
export async function getColoredIcon(iconPath: string, color: string): Promise<string> {
  // 判断文件类型
  if (iconPath.endsWith('.svg')) {
    return getSvgIconWithColor(iconPath, color);
  } else if (iconPath.endsWith('.png')) {
    return getPngIconWithColor(iconPath, color);
  }
  
  // 不支持的格式返回原路径
  return iconPath;
} 