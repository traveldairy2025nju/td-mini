import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import useUserStore from '../../store/user';
import { checkLogin } from '../../utils/auth';
import { useTheme } from '../../hooks';
import { THEMES, ThemeColors, getThemeColors, switchToPresetTheme, createCustomTheme } from '../../utils/themeManager';
import { useRouter } from '../../hooks';
import './index.scss';

function Settings() {
  // 从zustand中获取状态和方法
  const { 
    userInfo, 
    isLogin, 
    logout,
    updateProfile 
  } = useUserStore();
  
  // 路由钩子
  const { navigateTo, redirectTo, reLaunch, ROUTES } = useRouter();
  
  // 当前主题色
  const [currentTheme, setCurrentTheme] = useState<ThemeColors>(getThemeColors());
  const { hexToRgba } = useTheme();
  
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
          redirectTo(ROUTES.LOGIN);
        }
      });
    }
    
    // 获取当前主题色
    setCurrentTheme(getThemeColors());
    
    // 监听主题变化
    const handleThemeChange = (newTheme) => {
      setCurrentTheme(newTheme);
    };
    
    Taro.eventCenter.on('themeChange', handleThemeChange);
    
    return () => {
      Taro.eventCenter.off('themeChange', handleThemeChange);
    };
  }, []);
  
  // 更新昵称
  const handleUpdateNickname = () => {
    navigateTo(ROUTES.EDIT_NICKNAME);
  };
  
  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          reLaunch(ROUTES.LOGIN);
        }
      }
    });
  };

  // 关于我们
  const handleAboutUs = () => {
    navigateTo('/pages/about/index');
  };
  
  // 管理员中心
  const handleAdminCenter = () => {
    navigateTo('/pages/admin/index');
  };
  
  // 切换主题色
  const handleSwitchTheme = () => {
    const themeList = Object.keys(THEMES);
    const currentThemeName = themeList.find(name => 
      THEMES[name].primaryColor === currentTheme.primaryColor
    ) || 'default';
    
    // 显示主题选择器
    Taro.showActionSheet({
      itemList: [
        '默认蓝色', 
        '活力红色', 
        '自然绿色', 
        '高雅紫色', 
        '自定义颜色'
      ],
      success: (res) => {
        const { tapIndex } = res;
        if (tapIndex < 4) {
          // 显示加载提示
          Taro.showLoading({
            title: '正在应用主题...',
            mask: true
          });
          
          // 预设主题
          const themeName = themeList[tapIndex];
          switchToPresetTheme(themeName as keyof typeof THEMES);
          // 无需返回，小程序将自动重新加载
        } else {
          // 自定义颜色 - 跳转到一个专门的输入页面
          navigateTo(ROUTES.CUSTOM_THEME);
        }
      }
    });
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
        
        <View className='settings-item' onClick={handleSwitchTheme}>
          <View className='settings-item-info'>
            <Text className='settings-item-label'>主题颜色</Text>
            <View className='theme-color-preview' style={{ backgroundColor: currentTheme.primaryColor }}></View>
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
      
      <View 
        className='logout-button'
        onClick={handleLogout}
        style={{
          boxShadow: `0 4px 12px ${hexToRgba('#ff4d4f', 0.1)}, 0 2px 4px ${hexToRgba('#ff4d4f', 0.05)}`,
          border: `1px solid ${hexToRgba('#ff4d4f', 0.15)}`
        }}
      >
        退出登录
      </View>
    </View>
  );
}

export default Settings; 