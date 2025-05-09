import { useState, useCallback, useEffect } from 'react';
import Taro from '@tarojs/taro';
import api from '../services/api';

// 日记项目类型
export interface DiaryItem {
  id: string;
  title: string;
  coverImage: string;
  videoUrl?: string;
  authorName: string;
  authorAvatar?: string;
  likeCount: number;
  createdAt: string;
  location?: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  distance?: number;
  distanceText?: string;
}

interface UseDiaryParams {
  initialPage?: number;
  pageSize?: number;
}

interface UseDiaryResult {
  diaries: DiaryItem[];
  loading: boolean;
  error: string | null;
  fetchDiaries: () => Promise<void>;
  page: number;
  totalPages: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDiary({ initialPage = 1, pageSize = 10 }: UseDiaryParams = {}): UseDiaryResult {
  const [diaries, setDiaries] = useState<DiaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);

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

  // 获取日记列表
  const fetchDiaries = useCallback(async (resetPage = true) => {
    try {
      setError(null);
      setLoading(true);

      const currentPage = resetPage ? 1 : page;
      
      // 使用getAll代替getList
      const res = await api.diary.getAll({ page: currentPage, limit: pageSize, _t: Date.now() });

      if (res.success && res.data) {
        const formattedDiaries = formatDiaryItems(res.data.items);
        
        if (resetPage) {
          setDiaries(formattedDiaries);
        } else {
          setDiaries(prev => [...prev, ...formattedDiaries]);
        }
        
        setTotalPages(res.data.totalPages || 1);
        
        if (resetPage) {
          setPage(1);
        }
      } else {
        throw new Error(res.message || '获取日记列表失败');
      }
    } catch (err) {
      console.error('获取日记列表失败:', err);
      setError(err instanceof Error ? err.message : '获取日记列表失败');
    } finally {
      setLoading(false);
    }
  }, [formatDiaryItems, page, pageSize]);

  // 加载更多
  const loadMore = useCallback(async () => {
    if (page < totalPages && !loading) {
      setPage(prevPage => prevPage + 1);
      await fetchDiaries(false);
    }
  }, [fetchDiaries, loading, page, totalPages]);

  // 刷新
  const refresh = useCallback(async () => {
    await fetchDiaries(true);
  }, [fetchDiaries]);

  // 初次加载
  useEffect(() => {
    fetchDiaries(true);
    
    // 刷新事件监听
    const refreshHandler = () => {
      refresh();
    };
    
    Taro.eventCenter.on('refreshDiaries', refreshHandler);
    
    return () => {
      Taro.eventCenter.off('refreshDiaries', refreshHandler);
    };
  }, [fetchDiaries, refresh]);

  return {
    diaries,
    loading,
    error,
    fetchDiaries: refresh,
    page,
    totalPages,
    hasMore: page < totalPages,
    loadMore,
    refresh
  };
} 