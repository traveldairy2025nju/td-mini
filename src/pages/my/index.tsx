import { View, Text, Image, Button } from '@tarojs/components';
import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import useUserStore from '../../store/user';
import { checkLogin } from '../../utils/auth';
import './index.scss';

function My() {
  // 从zustand中获取状态和方法
  const { 
    userInfo, 
    isLogin, 
    isLoading, 
    updateProfile, 
    updateAvatar, 
    updateNickname, 
    logout 
  } = useUserStore();
  
  useEffect(() => {
    // 检查登录状态
    if (checkLogin()) {
      updateProfile();
    }
  }, []);
  
  // 更新头像
  const handleUpdateAvatar = () => {
    if (checkLogin()) {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        try {
          Taro.showLoading({ title: '上传中...' });
          const success = await updateAvatar(tempFilePath);
          
          if (success) {
            Taro.showToast({
              title: '头像更新成功',
              icon: 'success',
              duration: 2000
            });
          }
        } catch (error) {
          Taro.showToast({
            title: '上传头像失败',
            icon: 'none',
            duration: 2000
          });
        } finally {
          Taro.hideLoading();
        }
      }
    });
    }
  };
  
  // 更新昵称
  const handleUpdateNickname = () => {
    if (checkLogin()) {
      Taro.navigateTo({
        url: '/pages/edit-nickname/index'
          });
        }
  };
  
  // 前往我的游记列表
  const goToMyDiaries = () => {
    if (checkLogin()) {
      Taro.navigateTo({ url: '/pages/my-diaries/index' });
    }
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
  
  return (
    <View className='my-container'>
      {!isLoading && !isLogin ? (
        <View className='my-not-login'>
          <Text className='my-login-tip'>您还未登录</Text>
          <Button 
            type='primary' 
            className='my-login-button'
            onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}
          >
            去登录
          </Button>
        </View>
      ) : (
        <>
          <View className='my-header'>
            <View className='my-avatar-wrapper' onClick={handleUpdateAvatar}>
              <Image 
                className='my-avatar' 
                src={userInfo?.avatar || 'https://placeholder.com/150'} 
                mode='aspectFill'
              />
              <View className='my-avatar-edit'>
                <Text className='my-avatar-edit-text'>编辑</Text>
              </View>
            </View>
            <View className='my-info' onClick={handleUpdateNickname}>
              <Text className='my-nickname'>{userInfo?.nickname || '游客'}</Text>
              <Text className='my-username'>@{userInfo?.username || ''}</Text>
            </View>
          </View>
          
          <View className='my-content'>
            <View className='menu-list'>
              <View className='menu-item' onClick={goToMyDiaries}>
                <Text className='menu-item-title'>我的游记</Text>
                <Text className='menu-item-arrow'>›</Text>
              </View>
              
              {userInfo?.role === 'admin' && (
                <View 
                  className='menu-item' 
                  onClick={() => Taro.navigateTo({ url: '/pages/admin/index' })}
                >
                  <Text className='menu-item-title'>管理中心</Text>
                  <Text className='menu-item-arrow'>›</Text>
                </View>
              )}
              
              <View 
                className='menu-item'
                onClick={() => Taro.navigateTo({ url: '/pages/about/index' })}
              >
                <Text className='menu-item-title'>关于我们</Text>
                <Text className='menu-item-arrow'>›</Text>
              </View>
            </View>
            
            <Button 
              className='my-logout-button'
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </View>
        </>
      )}
    </View>
  );
}

export default My; 