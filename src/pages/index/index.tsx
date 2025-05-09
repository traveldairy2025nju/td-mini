import { View, Text, Image } from '@tarojs/components';
import { useEffect, useState, useMemo } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import WaterfallFlow from '../../components/WaterfallFlow';
import { useDiary, useNearbyDiaries, useTheme, useRouter, DiaryItem } from '../../hooks';
import './index.scss';

// SVG图标定义
const SEARCH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

// 生成SVG的data URL
const getSvgDataUrl = (svgContent: string, color: string) => {
  const encodedSvg = encodeURIComponent(svgContent.replace('currentColor', color));
  return `data:image/svg+xml,${encodedSvg}`;
};

function Index() {
  // 使用hooks
  const { theme, lightenColor } = useTheme();
  const { diaries, loading: diaryLoading, error: diaryError, fetchDiaries } = useDiary();
  const { 
    nearbyDiaries, 
    loading: nearbyLoading, 
    error: nearbyError,
    locationRequested,
    fetchNearbyDiaries,
    refreshNearbyDiaries
  } = useNearbyDiaries({ autoFetch: true });
  const { 
    toDiaryDetail, 
    toCreateDiary, 
    navigateTo, 
    ROUTES 
  } = useRouter();

  const [activeTab, setActiveTab] = useState('discover'); // 默认选中"发现"标签

  // 根据主题设置CSS变量
  useEffect(() => {
    if (theme && theme.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    }
  }, [theme]);

  // 组件挂载时
  useEffect(() => {
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

    // 清理函数
    return () => {
      Taro.eventCenter.off('refreshHomePage', refreshHandler);
    };
  }, [activeTab, fetchDiaries, fetchNearbyDiaries]);

  // Tab切换时获取数据
  useDidShow(() => {
    // 更新选中的标签页
    if (activeTab === 'discover') {
      fetchDiaries();
    } else if (activeTab === 'nearby') {
      if (nearbyDiaries.length === 0) {
        // 如果没有数据，加载附近游记
        fetchNearbyDiaries();
      } else {
        // 如果已有数据，静默刷新检查是否有更新
        refreshNearbyDiaries();
      }
    }

    // 通知TabBar更新选中状态
    Taro.eventCenter.trigger('tabIndexChange', 0);
  });

  // 点击日记项
  const handleDiaryItemClick = (id: string) => {
    toDiaryDetail(id);
  };

  // Tab切换处理
  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab);

    if (tab === 'nearby' && nearbyDiaries.length === 0) {
      fetchNearbyDiaries();
    }
  };

  // 点击搜索
  const handleSearchClick = () => {
    navigateTo(ROUTES.SEARCH);
  };

  // 渲染内容
  const renderContent = () => {
    // 根据选中的标签页显示不同内容
    if (activeTab === 'discover') {
      if (diaryLoading) {
        return (
          <View className='loading-container'>
            <View className='loading-spinner'></View>
            <Text>加载中...</Text>
          </View>
        );
      }

      if (diaryError) {
        return (
          <View className='error-container'>
            <Text className='error-text'>加载失败: {diaryError}</Text>
            <View
              className='error-retry-button'
              onClick={() => fetchDiaries()}
              style={{ backgroundColor: theme.primaryColor }}
            >
              重试
            </View>
          </View>
        );
      }

      return (
        <WaterfallFlow
          items={diaries}
          onItemClick={handleDiaryItemClick}
          columnGap={12}
          style={{ paddingBottom: '100px' }}
        />
      );
    } else if (activeTab === 'nearby') {
      if (nearbyLoading) {
        return (
          <View className='loading-container'>
            <View className='loading-spinner'></View>
            <Text>加载中...</Text>
          </View>
        );
      }

      if (nearbyError) {
        return (
          <View className='error-container'>
            <Text className='error-text'>
              {nearbyError.includes('位置') ? '无法获取位置信息，请检查位置权限' : nearbyError}
            </Text>
            <View
              className='error-retry-button'
              onClick={() => fetchNearbyDiaries()}
              style={{ backgroundColor: theme.primaryColor }}
            >
              重试
            </View>
          </View>
        );
      }

      if (nearbyDiaries.length === 0 && !nearbyLoading) {
        return (
          <View className='empty-container'>
            <Text className='empty-text'>附近暂无游记</Text>
            <Text className='empty-subtext'>成为第一个记录这里的人吧！</Text>
            <View
              className='create-diary-button'
              style={{ backgroundColor: theme.primaryColor }}
              onClick={toCreateDiary}
            >
              创建游记
            </View>
          </View>
        );
      }

      return (
        <WaterfallFlow
          items={nearbyDiaries}
          onItemClick={handleDiaryItemClick}
          columnGap={12}
          style={{ paddingBottom: '100px' }}
          locationBadge={true}
        />
      );
    }

    return null;
  };

  return (
    <View className='index'>
      {/* 搜索栏 */}
      <View className='search-bar' onClick={handleSearchClick}>
        <View className='search-bar-inner'>
          <Image
            className='search-icon'
            src={getSvgDataUrl(SEARCH_ICON, theme.primaryColor)}
            mode='aspectFit'
          />
          <Text className='search-placeholder'>搜索游记、地点</Text>
        </View>
      </View>

      {/* 标签页 */}
      <View className='tab-container'>
        <View className='tab-wrapper'>
          <View
            className={`tab-item ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => handleTabChange('discover')}
          >
            <Text className='tab-text'>发现</Text>
            {activeTab === 'discover' && (
              <View
                className='tab-indicator'
                style={{ backgroundColor: theme.primaryColor }}
              ></View>
            )}
          </View>
          <View
            className={`tab-item ${activeTab === 'nearby' ? 'active' : ''}`}
            onClick={() => handleTabChange('nearby')}
          >
            <Text className='tab-text'>附近</Text>
            {activeTab === 'nearby' && (
              <View
                className='tab-indicator'
                style={{ backgroundColor: theme.primaryColor }}
              ></View>
            )}
          </View>
        </View>
      </View>

      {/* 内容区域 */}
      <View className='content-container'>
        {renderContent()}
      </View>
    </View>
  );
}

export default Index;
