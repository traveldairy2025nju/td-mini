import { View, Text, Image } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import WaterfallFlow from '../../components/WaterfallFlow';
import api from '../../services/api';
import { getThemeColors, ThemeColors } from '../../utils/themeManager';
import './index.scss';

// SVG图标定义
const SEARCH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

// 生成SVG的data URL
const getSvgDataUrl = (svgContent: string, color: string) => {
  const encodedSvg = encodeURIComponent(svgContent.replace('currentColor', color));
  return `data:image/svg+xml,${encodedSvg}`;
};

// 游记项目类型
interface DiaryItem {
  id: string;
  title: string;
  coverImage: string;
  videoUrl?: string; // 添加视频URL字段
  authorName: string;
  authorAvatar?: string; // 添加作者头像字段
  likeCount: number;
  createdAt: string;
  location?: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  distance?: number; // 距离（米）
  distanceText?: string; // 格式化后的距离文本
}

// 浅色处理函数
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

function Index() {
  const [diaries, setDiaries] = useState<DiaryItem[]>([]);
  const [nearbyDiaries, setNearbyDiaries] = useState<DiaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('discover'); // 默认选中"发现"标签
  const [theme, setTheme] = useState<ThemeColors>(getThemeColors());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);

  // 组件挂载时
  useEffect(() => {
    // 立即加载常规游记列表
    fetchDiaries();

    // 同时尝试获取位置并预加载附近游记
    initLocationAndNearbyDiaries();

    // 注册刷新事件监听
    const refreshHandler = () => {
      if (activeTab === 'discover') {
        fetchDiaries();
      } else if (activeTab === 'nearby') {
        fetchNearbyDiaries();
      }
    };

    // 注册事件
    Taro.eventCenter.on('refreshHomePage', refreshHandler);

    // 监听主题变化事件
    const themeChangeHandler = (newTheme: ThemeColors) => {
      setTheme(newTheme);
    };
    Taro.eventCenter.on('themeChange', themeChangeHandler);

    // 清理函数
    return () => {
      Taro.eventCenter.off('refreshHomePage', refreshHandler);
      Taro.eventCenter.off('themeChange', themeChangeHandler);
    };
  }, []);

  // Tab切换时获取数据
  useDidShow(() => {
    // 更新选中的标签页
    if (activeTab === 'discover') {
      fetchDiaries();
    } else if (activeTab === 'nearby') {
      if (!currentLocation && !locationRequested) {
        // 如果还没有位置信息，初始化位置和附近游记
        initLocationAndNearbyDiaries();
      } else if (nearbyDiaries.length === 0) {
        // 如果有位置但没有数据，加载附近游记
        fetchNearbyDiaries();
      } else {
        // 如果已有数据，静默刷新检查是否有更新
        refreshNearbyDiaries();
      }
    }

    // 通知TabBar更新选中状态
    Taro.eventCenter.trigger('tabIndexChange', 0);
  });

  // 初始化位置和附近游记
  const initLocationAndNearbyDiaries = async () => {
    setLocationRequested(true);
    try {
      // 静默获取位置权限和数据，不显示loading
      const location = await getCurrentLocation(false);
      if (location) {
        // 预加载附近游记数据，但不影响用户体验
        loadNearbyDiaries(location);
      }
    } catch (error) {
      console.log('预加载附近游记失败:', error);
      // 这里不显示错误，只记录日志，等用户切换到附近标签时再提示
    }
  };

  // 加载附近游记（被预加载或主动加载调用）
  const loadNearbyDiaries = async (location) => {
    try {
      setNearbyError(null);

      const res = await api.diary.getNearby(
        location.latitude,
        location.longitude,
        page,
        10
      );

      if (res.success && res.data) {
        // 转换API返回的数据为组件需要的格式
        const formattedNearbyDiaries = res.data.items.map(item => {
          // 格式化距离显示
          let distanceText = '';
          if (item.distance !== undefined) {
            if (item.distance < 1000) {
              distanceText = `${Math.round(item.distance)}米`;
            } else {
              distanceText = `${(item.distance / 1000).toFixed(1)}公里`;
            }
          }

          // 如果有视频，优先使用视频的封面图
          const hasVideo = !!item.video;
          const coverImage = (hasVideo && item.images && item.images.length > 0)
            ? item.images[0]
            : (item.images?.[0] || 'https://placeholder.com/300');

          return {
            id: item._id,
            title: item.title || '无标题',
            coverImage: coverImage,
            videoUrl: item.video || '', // 添加视频URL
            authorName: item.author?.nickname || '未知用户',
            authorAvatar: item.author?.avatar || 'https://api.dicebear.com/6.x/initials/svg?seed=TD',
            likeCount: item.likeCount || 0,
            createdAt: item.createdAt || '',
            location: item.location,
            distance: item.distance,
            distanceText: item.distanceText || distanceText
          };
        });

        setNearbyDiaries(formattedNearbyDiaries);
        setTotalPages(res.data.totalPages || 1);
      } else {
        throw new Error(res.message || '获取附近游记列表失败');
      }
    } catch (error) {
      console.error('获取附近游记失败:', error);
      setNearbyError(error instanceof Error ? error.message : '获取附近游记列表失败');
      setNearbyDiaries([]);
    } finally {
      setNearbyLoading(false);
    }
  };

  // 获取当前位置，showLoading参数控制是否显示加载状态
  const getCurrentLocation = async (showLoading = true): Promise<{latitude: number; longitude: number} | null> => {
    try {
      if (showLoading) {
        setNearbyLoading(true);
      }

      const res = await api.location.getCurrentLocation();
      const location = res as {latitude: number; longitude: number};
      setCurrentLocation(location);
      return location;
    } catch (error) {
      console.error('获取位置失败:', error);
      if (showLoading) {
        Taro.showToast({
          title: '获取位置失败，请检查位置权限',
          icon: 'none'
        });
        setNearbyError('获取位置失败，请检查位置权限');
      }
      return null;
    }
  };

  // 获取游记列表
  const fetchDiaries = async () => {
    try {
      setLoading(true);
      // 添加时间戳参数避免缓存
      const res = await api.diary.getAll({ _t: Date.now() });

      if (res.success && res.data && res.data.items) {
        // 转换API返回的数据为组件需要的格式
        const formattedDiaries = res.data.items.map(item => {
          // 如果有视频，优先使用视频的封面图
          const hasVideo = !!item.video;
          const coverImage = (hasVideo && item.images && item.images.length > 0)
            ? item.images[0]
            : (item.images?.[0] || 'https://placeholder.com/300');

          // 使用MongoDB的_id字段作为唯一标识
          return {
            id: item._id, // 使用_id而不是id
            title: item.title || '无标题',
            coverImage: coverImage,
            videoUrl: item.video || '', // 添加视频URL
            authorName: item.author?.nickname || '未知用户',
            authorAvatar: item.author?.avatar || 'https://api.dicebear.com/6.x/initials/svg?seed=TD',
            likeCount: item.likeCount || 0,
            createdAt: item.createdAt || '',
            location: item.location,
            distance: item.distance,
            distanceText: item.distanceText
          };
        });

        setDiaries(formattedDiaries);
      } else {
        // 如果API调用失败，显示错误信息
        throw new Error(res.message || '获取游记列表失败');
      }
    } catch (error) {
      Taro.showToast({
        title: '获取游记列表失败',
        icon: 'none'
      });
      // 加载失败时设置为空数组
      setDiaries([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取附近游记列表（用户主动切换到附近标签时调用）
  const fetchNearbyDiaries = async () => {
    try {
      setNearbyLoading(true);
      setNearbyError(null);

      // 获取位置并显示加载状态
      const location = await getCurrentLocation(true);

      if (!location) {
        throw new Error('获取位置失败，请检查位置权限');
      }

      // 加载附近游记数据
      await loadNearbyDiaries(location);

    } catch (error) {
      let errorMessage = '获取附近游记列表失败';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Taro.showToast({
        title: errorMessage,
        icon: 'none'
      });
      // 加载失败时设置为空数组
      setNearbyDiaries([]);
      setNearbyLoading(false);
    }
  };

  // 点击游记项目，跳转到详情页
  const handleDiaryItemClick = (id: string) => {
    if (!id) {
      Taro.showToast({
        title: '游记ID无效',
        icon: 'none'
      });
      return;
    }
    Taro.navigateTo({ url: `/pages/diary/detail/index?id=${id}` });
  };

  // 切换标签页
  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;

    setActiveTab(tab);
    if (tab === 'nearby') {
      refreshNearbyDiaries();
    }
  };

  // 刷新附近游记数据，静默获取并只在有变化时才更新UI
  const refreshNearbyDiaries = async () => {
    try {
      // 获取位置但不显示loading
      const location = currentLocation || await getCurrentLocation(false);

      if (!location) {
        // 如果没有位置信息，则使用标准方法获取（会显示loading）
        fetchNearbyDiaries();
        return;
      }

      // 使用当前位置静默获取新数据
      const res = await api.diary.getNearby(
        location.latitude,
        location.longitude,
        page,
        10
      );

      if (res.success && res.data) {
        // 转换API返回的数据为组件需要的格式
        const formattedNewDiaries = res.data.items.map(item => {
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
            coverImage: item.images?.[0] || 'https://placeholder.com/300',
            authorName: item.author?.nickname || '未知用户',
            authorAvatar: item.author?.avatar || 'https://api.dicebear.com/6.x/initials/svg?seed=TD',
            likeCount: item.likeCount || 0,
            createdAt: item.createdAt || '',
            location: item.location,
            distance: item.distance,
            distanceText: item.distanceText || distanceText
          };
        });

        // 检查新数据与旧数据是否相同
        const hasChanged = hasDataChanged(nearbyDiaries, formattedNewDiaries);

        if (hasChanged) {
          // 只有数据变化时才更新UI
          setNearbyDiaries(formattedNewDiaries);
          setTotalPages(res.data.totalPages || 1);

          // 显示提示，告知用户数据已更新
          Taro.showToast({
            title: '发现新游记，已更新',
            icon: 'success',
            duration: 1500
          });
        }
      }
    } catch (error) {
      console.error('静默刷新附近游记失败:', error);
      // 静默刷新失败不提示用户，如有必要可以调用标准获取方法
      if (nearbyDiaries.length === 0) {
        fetchNearbyDiaries();
      }
    }
  };

  // 比较两组数据是否有变化
  const hasDataChanged = (oldData: DiaryItem[], newData: DiaryItem[]): boolean => {
    // 如果长度不同，数据肯定变化了
    if (oldData.length !== newData.length) return true;

    // 创建一个旧数据ID的集合，用于快速查找
    const oldIds = new Set(oldData.map(item => item.id));

    // 检查是否有新的ID不在旧数据中
    for (const item of newData) {
      if (!oldIds.has(item.id)) return true;
    }

    // 进一步检查内容是否变化（如点赞数等）
    // 为简化实现，这里只比较几个关键字段
    for (let i = 0; i < newData.length; i++) {
      const newItem = newData[i];
      const oldItem = oldData.find(item => item.id === newItem.id);

      if (oldItem && (
          oldItem.likeCount !== newItem.likeCount ||
          oldItem.distance !== newItem.distance ||
          oldItem.title !== newItem.title
      )) {
        return true;
      }
    }

    return false;
  };

  // 点击搜索图标
  const handleSearchClick = () => {
    Taro.navigateTo({ url: '/pages/search/index' });
  };

  // 渲染内容区域
  const renderContent = () => {
    if (activeTab === 'discover') {
      return (
        <View className='diary-list-section'>
          {loading ? (
            <View className='loading-container'>加载中...</View>
          ) : diaries.length > 0 ? (
            <WaterfallFlow
              diaryList={diaries}
              onItemClick={handleDiaryItemClick}
            />
          ) : (
            <View className='empty-container'>暂无游记，快来创建第一篇吧！</View>
          )}
        </View>
      );
    } else {
      // 附近标签的内容
      return (
        <View className='nearby-content'>
          {nearbyLoading ? (
            <View className='loading-container'>加载中...</View>
          ) : nearbyDiaries.length > 0 ? (
            <WaterfallFlow
              diaryList={nearbyDiaries}
              onItemClick={handleDiaryItemClick}
            />
          ) : (
            <View className='empty-container'>
              {nearbyError ? nearbyError : '附近暂无游记，快来创建第一篇吧！'}
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <View className='index-container'>
      {/* 顶部标签栏 */}
      <View className='tab-bar'>
        <View
          className={`tab-item ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => handleTabChange('discover')}
        >
          <Text style={activeTab === 'discover' ? { color: theme.primaryColor } : {}}>发现</Text>
          {activeTab === 'discover' && (
            <View
              className='active-indicator'
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60px',
                height: '6px',
                backgroundColor: theme.primaryColor,
                borderRadius: '3px'
              }}
            ></View>
          )}
        </View>
        <View
          className={`tab-item ${activeTab === 'nearby' ? 'active' : ''}`}
          onClick={() => handleTabChange('nearby')}
        >
          <Text style={activeTab === 'nearby' ? { color: theme.primaryColor } : {}}>附近</Text>
          {activeTab === 'nearby' && (
            <View
              className='active-indicator'
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60px',
                height: '6px',
                backgroundColor: theme.primaryColor,
                borderRadius: '3px'
              }}
            ></View>
          )}
        </View>

        {/* 搜索图标 */}
        <View className='search-icon' onClick={handleSearchClick}>
          <Image
            className='search-icon-img'
            src={require('../../assets/icons/search.svg')}
            style={{ width: '28px', height: '28px' }}
          />
        </View>
      </View>

      {/* 内容区域 */}
      {renderContent()}
    </View>
  );
}

export default Index;
