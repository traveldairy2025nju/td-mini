import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import WaterfallFlow from '../../components/WaterfallFlow';
import api from '../../services/api';
import './index.scss';

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

function Index() {
  const [diaries, setDiaries] = useState<DiaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeTab, setActiveTab] = useState('discover'); // 默认选中"发现"标签

  // 组件挂载时和Tab切换时获取数据
  useDidShow(() => {
    console.log('首页 - 页面显示');
    fetchDiaries();

    // 通知TabBar更新选中状态
    Taro.eventCenter.trigger('tabIndexChange', 0);
  });

  // 添加事件监听器，监听收藏状态变化
  useEffect(() => {
    const refreshHandler = () => {
      console.log('接收到刷新首页事件');
      fetchDiaries();
    };

    // 注册事件
    Taro.eventCenter.on('refreshHomePage', refreshHandler);

    // 清理函数
    return () => {
      Taro.eventCenter.off('refreshHomePage', refreshHandler);
    };
  }, []);

  // 获取游记列表
  const fetchDiaries = async () => {
    try {
      setLoading(true);
      // 添加时间戳参数避免缓存
      const res = await api.diary.getAll({ _t: Date.now() });
      console.log('首页 - API返回的原始数据:', res);

      if (res.success && res.data && res.data.items) {
        // 转换API返回的数据为组件需要的格式
        const formattedDiaries = res.data.items.map(item => {
          console.log('首页 - 处理游记项:', item);
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

        console.log('首页 - 格式化后的游记列表:', formattedDiaries);
        setDiaries(formattedDiaries);
      } else {
        // 如果API调用失败，显示错误信息
        throw new Error(res.message || '获取游记列表失败');
      }
    } catch (error) {
      console.error('获取游记列表失败', error);
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
    console.log('首页 - 点击游记，ID:', id);
    if (!id) {
      console.error('首页 - 游记ID无效');
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
    console.log('点击搜索图标，准备跳转到搜索页面');
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
          发现
        </View>
        <View
          className={`tab-item ${activeTab === 'nearby' ? 'active' : ''}`}
          onClick={() => handleTabChange('nearby')}
        >
          附近
        </View>

        {/* 搜索图标 */}
        <View className='search-icon' onClick={handleSearchClick}>
          🔍
        </View>
      </View>

      {/* 内容区域 */}
      {renderContent()}
    </View>
  );
}

export default Index;
