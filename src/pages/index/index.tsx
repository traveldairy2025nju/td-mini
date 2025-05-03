import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { isLoggedIn } from '../../utils/auth';
import Button from '../../components/taro-ui/Button';
import WaterfallFlow from '../../components/WaterfallFlow';
import { getDiaryList, DiaryItem } from '../../services/diaryService';
import './index.scss';

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
      const data = await getDiaryList();
      setDiaryList(data);
    } catch (error) {
      console.error('获取游记列表失败', error);
      Taro.showToast({
        title: '获取游记列表失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  // 创建游记，需要先检查登录状态
  const handleCreateDiary = () => {
    if (isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/diary/create/index' });
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

  // 点击游记项目，跳转到详情页
  const handleDiaryItemClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/diary/detail/index?id=${id}` });
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
