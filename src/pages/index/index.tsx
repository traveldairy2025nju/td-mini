import { View, Text } from '@tarojs/components';
import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { isLoggedIn } from '../../utils/auth';
import Button from '../../components/taro-ui/Button';
import './index.scss';

function Index() {
  useEffect(() => {
    // 可以在这里做一些首页初始化的工作
    console.log('首页加载完成');
  }, []);

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

  return (
    <View className='index-container'>
      <View className='index-header'>
        <Text className='index-title'>旅行日记</Text>
        <Text className='index-subtitle'>记录美好旅行时刻</Text>
      </View>

      <View className='index-content'>
        <Text className='index-welcome'>欢迎使用旅行日记小程序</Text>
        <Text className='index-desc'>这里将展示最新的旅行游记</Text>
        
        <Button type='primary' className='index-button' onClick={handleCreateDiary}>
          创建游记
        </Button>
      </View>
    </View>
  );
}

export default Index;
