import { useState, useCallback } from 'react';
import Taro from '@tarojs/taro';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface UseLocationResult {
  location: LocationCoords | null;
  loading: boolean;
  error: string | null;
  getLocation: (showLoading?: boolean) => Promise<LocationCoords | null>;
  hasLocation: boolean;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(async (showLoading = true): Promise<LocationCoords | null> => {
    try {
      setError(null);
      setLoading(true);

      if (showLoading) {
        Taro.showLoading({ title: '获取位置中...' });
      }

      // 获取位置权限
      const settingRes = await Taro.getSetting();
      if (!settingRes.authSetting['scope.userLocation']) {
        // 如果没有授权，先请求授权
        await Taro.authorize({ scope: 'scope.userLocation' });
      }

      // 获取位置信息
      const res = await Taro.getLocation({ type: 'gcj02' });
      const locationData = {
        latitude: res.latitude,
        longitude: res.longitude
      };

      // 更新位置状态
      setLocation(locationData);
      setLoading(false);

      if (showLoading) {
        Taro.hideLoading();
      }

      return locationData;
    } catch (err) {
      console.error('获取位置失败:', err);
      setError(err instanceof Error ? err.message : '获取位置失败');
      setLoading(false);
      
      if (showLoading) {
        Taro.hideLoading();
        Taro.showToast({
          title: '获取位置失败，请检查位置权限',
          icon: 'none'
        });
      }
      
      return null;
    }
  }, []);

  return {
    location,
    loading,
    error,
    getLocation,
    hasLocation: location !== null
  };
} 