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
  authorName: string;
  authorAvatar?: string; // 添加作者头像字段
  likeCount: number;
  createdAt: string;
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
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeTab, setActiveTab] = useState('discover'); // 默认选中"发现"标签
  const [theme, setTheme] = useState<ThemeColors>(getThemeColors());

  // 组件挂载时和Tab切换时获取数据
  useDidShow(() => {
    fetchDiaries();

    // 通知TabBar更新选中状态
    Taro.eventCenter.trigger('tabIndexChange', 0);
  });

  // 添加事件监听器，监听收藏状态变化
  useEffect(() => {
    const refreshHandler = () => {
      fetchDiaries();
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

  // 获取游记列表
  const fetchDiaries = async () => {
    try {
      setLoading(true);
      // 添加时间戳参数避免缓存
      const res = await api.diary.getAll({ _t: Date.now() });

      if (res.success && res.data && res.data.items) {
        // 转换API返回的数据为组件需要的格式
        const formattedDiaries = res.data.items.map(item => {
          // 使用MongoDB的_id字段作为唯一标识
          return {
            id: item._id, // 使用_id而不是id
            title: item.title || '无标题',
            coverImage: item.images?.[0] || 'https://placeholder.com/300',
            authorName: item.author?.nickname || '未知用户',
            authorAvatar: item.author?.avatar || 'https://api.dicebear.com/6.x/initials/svg?seed=TD', // 添加作者头像
            likeCount: item.likeCount || 0, // 使用likeCount字段
            createdAt: item.createdAt || ''
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
    setActiveTab(tab);
    // 如果是附近标签，未来可以在这里实现获取附近的游记
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
          <View className='empty-container'>附近功能即将上线，敬请期待！</View>
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
