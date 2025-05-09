import { useState, useCallback, useEffect } from 'react';
import Taro from '@tarojs/taro';
import api from '../services/api';
import { useLocation } from './useLocation';
import { DiaryItem } from './useDiary';

interface UseNearbyDiaryParams {
  initialPage?: number;
  pageSize?: number;
  autoFetch?: boolean;
}

interface UseNearbyDiaryResult {
  nearbyDiaries: DiaryItem[];
  loading: boolean;
  error: string | null;
  locationRequested: boolean;
  fetchNearbyDiaries: () => Promise<void>;
  refreshNearbyDiaries: () => Promise<void>;
  page: number;
  totalPages: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useNearbyDiaries({
  initialPage = 1,
  pageSize = 10,
  autoFetch = true
}: UseNearbyDiaryParams = {}): UseNearbyDiaryResult {
  const [nearbyDiaries, setNearbyDiaries] = useState<DiaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [locationRequested, setLocationRequested] = useState<boolean>(false);
  
  const { location, getLocation } = useLocation();

  const formatDiaryItems = useCallback((items: any[]): DiaryItem[] => {
    return items.map(item => {
      // 如果有视频，优先使用视频的封面图
      const hasVideo = !!item.video;
      const coverImage = (hasVideo && item.images && item.images.length > 0)
        ? item.images[0]
        : (item.images?.[0] || 'https://placeholder.com/300');

      // 格式化距离显示
      let distanceText = '';
      if (item.distance !== undefined) {
        if (item.distance < 1000) {
          distanceText = `${Math.round(item.distance)}米`;
        } else {
          distanceText = `${(item.distance / 1000).toFixed(1)}公里`;
        }
      }

      return {
        id: item._id,
        title: item.title || '无标题',
        coverImage: coverImage,
        videoUrl: item.video || undefined,
        authorName: item.author?.nickname || '未知用户',
        authorAvatar: item.author?.avatar || 'https://api.dicebear.com/6.x/initials/svg?seed=TD',
        likeCount: item.likeCount || 0,
        createdAt: item.createdAt || '',
        location: item.location,
        distance: item.distance,
        distanceText: item.distanceText || distanceText
      };
    });
  }, []);

  // 获取附近日记列表
  const fetchNearbyDiaries = useCallback(async (resetPage = true, showLoading = true) => {
    try {
      setError(null);
      if (showLoading) {
        setLoading(true);
      }

      // 获取位置
      if (!location) {
        setLocationRequested(true);
        const locationData = await getLocation(showLoading);
        if (!locationData) {
          throw new Error('获取位置信息失败');
        }
      }

      if (!location) {
        throw new Error('位置信息不可用');
      }

      const currentPage = resetPage ? 1 : page;
      
      const res = await api.diary.getNearby(
        location.latitude,
        location.longitude,
        currentPage,
        pageSize
      );

      if (res.success && res.data) {
        const formattedDiaries = formatDiaryItems(res.data.items);
        
        if (resetPage) {
          setNearbyDiaries(formattedDiaries);
        } else {
          setNearbyDiaries(prev => [...prev, ...formattedDiaries]);
        }
        
        setTotalPages(res.data.totalPages || 1);
        
        if (resetPage) {
          setPage(1);
        }
      } else {
        throw new Error(res.message || '获取附近日记列表失败');
      }
    } catch (err) {
      console.error('获取附近日记失败:', err);
      setError(err instanceof Error ? err.message : '获取附近日记列表失败');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [formatDiaryItems, getLocation, location, page, pageSize]);

  // 静默刷新（不显示loading状态）
  const refreshNearbyDiaries = useCallback(async () => {
    await fetchNearbyDiaries(true, false);
  }, [fetchNearbyDiaries]);

  // 加载更多
  const loadMore = useCallback(async () => {
    if (page < totalPages && !loading) {
      setPage(prevPage => prevPage + 1);
      await fetchNearbyDiaries(false);
    }
  }, [fetchNearbyDiaries, loading, page, totalPages]);

  // 初始化
  useEffect(() => {
    if (autoFetch) {
      const initFetch = async () => {
        try {
          // 如果有位置信息，直接获取附近日记
          if (location) {
            await fetchNearbyDiaries(true);
          } else {
            // 静默获取位置权限和数据，不显示loading
            const locationData = await getLocation(false);
            if (locationData) {
              await fetchNearbyDiaries(true, false);
            }
          }
        } catch (error) {
          console.log('初始化附近日记失败:', error);
        }
      };
      
      initFetch();
    }
    
    // 刷新事件监听
    const refreshHandler = () => {
      refreshNearbyDiaries();
    };
    
    Taro.eventCenter.on('refreshNearbyDiaries', refreshHandler);
    
    return () => {
      Taro.eventCenter.off('refreshNearbyDiaries', refreshHandler);
    };
  }, [autoFetch, fetchNearbyDiaries, getLocation, location, refreshNearbyDiaries]);

  return {
    nearbyDiaries,
    loading,
    error,
    locationRequested,
    fetchNearbyDiaries: () => fetchNearbyDiaries(true, true),
    refreshNearbyDiaries,
    page,
    totalPages,
    hasMore: page < totalPages,
    loadMore
  };
} 