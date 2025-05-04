import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { isLoggedIn } from '../../utils/auth';
import Button from '../../components/taro-ui/Button';
import WaterfallFlow from '../../components/WaterfallFlow';
import api from '../../services/api';
import './index.scss';

// 游记项目类型
interface DiaryItem {
  id: string;
  title: string;
  coverImage: string;
  authorName: string;
  likeCount: number;
  viewCount: number;
  createdAt: string;
}

function Index() {
  const [diaryList, setDiaryList] = useState<DiaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取游记列表数据
    fetchDiaryList();
  }, []);

  // 获取游记列表
  const fetchDiaryList = async () => {
    try {
      setLoading(true);
      const res = await api.diary.getAll();
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
            likeCount: item.likes || 0,
            viewCount: item.views || 0,
            createdAt: item.createdAt || ''
          };
        });

        console.log('首页 - 格式化后的游记列表:', formattedDiaries);
        setDiaryList(formattedDiaries);
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
      setDiaryList([]);
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

  // 创建游记，需要先检查登录状态
  const handleCreateDiary = () => {
    if (isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/create-diary/index' });
    } else {
      Taro.showModal({
        title: '提示',
        content: '您需要先登录才能创建游记',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' });
          }
        }
      });
    }
  };

  return (
    <View className='index-container'>
      <View className='index-header'>
        <Text className='index-title'>旅行日记</Text>
        <Text className='index-subtitle'>记录美好旅行时刻</Text>
      </View>

      {/* 创建游记按钮 */}
      <View className='action-bar'>
        <Button type='primary' className='create-diary-btn' onClick={handleCreateDiary}>
          创建游记
        </Button>
      </View>

      {/* 游记列表瀑布流 */}
      <View className='diary-list-section'>
        <View className='section-title'>
          <Text>最新游记</Text>
        </View>

        {loading ? (
          <View className='loading-container'>加载中...</View>
        ) : diaryList.length > 0 ? (
          <WaterfallFlow
            diaryList={diaryList}
            onItemClick={handleDiaryItemClick}
          />
        ) : (
          <View className='empty-container'>暂无游记，快来创建第一篇吧！</View>
        )}
      </View>
    </View>
  );
}

export default Index;
