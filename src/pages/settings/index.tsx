import { View, Text } from '@tarojs/components';
import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import useUserStore from '../../store/user';
import { checkLogin } from '../../utils/auth';
import Button from '../../components/taro-ui/Button';
import './index.scss';

function Settings() {
  // 从zustand中获取状态和方法
  const { 
    userInfo, 
    isLogin, 
    logout,
    updateProfile 
  } = useUserStore();
  
  useEffect(() => {
    // 检查登录状态并更新用户资料
    if (checkLogin()) {
      updateProfile();
    } else {
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000,
        complete: () => {
          Taro.redirectTo({ url: '/pages/login/index' });
        }
      });
    }
  }, []);
  
  // 更新昵称
  const handleUpdateNickname = () => {
    Taro.navigateTo({ url: '/pages/edit-nickname/index' });
  };
  
  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          Taro.reLaunch({ url: '/pages/login/index' });
        }
      }
    });
  };

  // 关于我们
  const handleAboutUs = () => {
    Taro.navigateTo({ url: '/pages/about/index' });
  };
  
  // 管理员中心
  const handleAdminCenter = () => {
    Taro.navigateTo({ url: '/pages/admin/index' });
  };
  
  return (
    <View className='settings-container'>
      <View className='settings-header'>
        <Text className='settings-title'>设置</Text>
      </View>
      
      <View className='settings-list'>
        <View className='settings-item' onClick={handleUpdateNickname}>
          <View className='settings-item-info'>
            <Text className='settings-item-label'>修改昵称</Text>
            <Text className='settings-item-value'>{userInfo?.nickname}</Text>
          </View>
          <Text className='settings-item-arrow'>›</Text>
        </View>
        
        {userInfo?.role === 'admin' && (
          <View className='settings-item' onClick={handleAdminCenter}>
            <View className='settings-item-info'>
              <Text className='settings-item-label'>管理中心</Text>
            </View>
            <Text className='settings-item-arrow'>›</Text>
          </View>
        )}
        
        <View className='settings-item' onClick={handleAboutUs}>
          <View className='settings-item-info'>
            <Text className='settings-item-label'>关于我们</Text>
          </View>
          <Text className='settings-item-arrow'>›</Text>
        </View>
      </View>
      
      <Button 
        className='logout-button'
        onClick={handleLogout}
      >
        退出登录
      </Button>
    </View>
  );
}

export default Settings; 