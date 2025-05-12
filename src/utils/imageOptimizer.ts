/**
 * 图片优化工具
 * 提供图片预加载、压缩、占位图等优化功能
 */

/**
 * 添加图片尺寸参数
 * 对于支持动态调整大小的图片服务（如七牛云、阿里云OSS等）
 * 可以通过URL参数来请求适合当前设备的图片尺寸
 */
export function getOptimizedImageUrl(url: string, width?: number, quality = 80): string {
  if (!url) return url;
  
  // 跳过非HTTP图片
  if (!url.startsWith('http')) return url;
  
  // 避免重复添加参数
  if (url.includes('?imageMogr2')) return url;
  
  try {
    // 如果未指定宽度，获取设备宽度
    if (!width) {
      const systemInfo = wx.getSystemInfoSync();
      // 考虑设备像素比，获取适合当前设备的图片
      width = Math.floor(systemInfo.windowWidth * systemInfo.pixelRatio);
    }
    
    // 根据不同的图片服务添加不同的参数
    // 这里以七牛云为例，可以根据实际使用的图片服务调整
    if (url.includes('myqcloud.com')) {
      // 腾讯云COS服务
      return `${url}?imageView2/1/w/${width}/q/${quality}`;
    } else if (url.includes('aliyuncs.com')) {
      // 阿里云OSS服务
      return `${url}?x-oss-process=image/resize,w_${width}/quality,q_${quality}`;
    } else {
      // 通用七牛云服务或其他支持类似参数的服务
      return `${url}?imageMogr2/thumbnail/${width}x/quality/${quality}`;
    }
  } catch (error) {
    console.error('优化图片URL失败:', error);
    return url;
  }
}

// 图片缓存
const imageCache: Record<string, string> = {};

/**
 * 预加载图片并缓存结果
 */
export function preloadImage(url: string): Promise<string> {
  if (imageCache[url]) {
    return Promise.resolve(imageCache[url]);
  }
  
  return new Promise((resolve, reject) => {
    const optimizedUrl = getOptimizedImageUrl(url);
    wx.getImageInfo({
      src: optimizedUrl,
      success: res => {
        imageCache[url] = res.path;
        resolve(res.path);
      },
      fail: err => {
        console.error('预加载图片失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 批量预加载图片
 */
export function preloadImages(urls: string[]): Promise<string[]> {
  const promises = urls.map(url => preloadImage(url).catch(err => {
    console.error(`预加载图片 ${url} 失败:`, err);
    return url; // 如果预加载失败，返回原始URL
  }));
  
  return Promise.all(promises);
}

/**
 * 获取缩略图URL
 * 用于列表显示时的小图
 */
export function getThumbnailUrl(url: string): string {
  return getOptimizedImageUrl(url, 300, 70);
}

/**
 * 生成占位图数据URI
 * 用于在图片加载前显示
 */
export function getPlaceholderImage(width: number, height: number, color = '#f0f0f0'): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='${color.replace('#', '%23')}'/%3E%3C/svg%3E`;
}

/**
 * 清除图片缓存
 */
export function clearImageCache(): void {
  Object.keys(imageCache).forEach(key => {
    delete imageCache[key];
  });
} 