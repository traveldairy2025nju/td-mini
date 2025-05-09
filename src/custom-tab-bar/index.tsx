import { View, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { isLoggedIn } from '../utils/auth';
import { getThemeColors } from '../utils/themeManager';
import router, { ROUTES, TAB_ROUTES } from '../routes';
import './index.scss';

// SVG图标内容
const HOME_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;

const USER_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

const PLUS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

interface TabItem {
  pagePath: string;
  text: string;
  icon: string;
}

export default function CustomTabBar() {
  const [selected, setSelected] = useState(0);
  const [theme, setTheme] = useState(getThemeColors());
  
  const [tabList] = useState<TabItem[]>([
    {
      pagePath: TAB_ROUTES.HOME.slice(1), // 移除前导斜杠
      text: '首页',
      icon: HOME_ICON
    },
    {
      pagePath: TAB_ROUTES.MY.slice(1), // 移除前导斜杠
      text: '我的',
      icon: USER_ICON
    }
  ]);

  // 生成SVG的data URL
  const getSvgDataUrl = (svgContent: string, color: string) => {
    const encodedSvg = encodeURIComponent(svgContent.replace('currentColor', color));
    return `data:image/svg+xml,${encodedSvg}`;
  };

  // 监听主题变化
  useEffect(() => {
    const handleThemeChange = (newTheme) => {
      setTheme(newTheme);
    };
    
    Taro.eventCenter.on('themeChange', handleThemeChange);
    
    return () => {
      Taro.eventCenter.off('themeChange', handleThemeChange);
    };
  }, []);

  // 组件挂载时添加路由事件监听
  useEffect(() => {
    Taro.eventCenter.on('tabIndexChange', handleTabIndexChange);
    updateSelectedTab();
    return () => {
      Taro.eventCenter.off('tabIndexChange', handleTabIndexChange);
    };
  }, []);

  // 每次显示时更新Tab状态
  useDidShow(() => {
    console.log('TabBar - useDidShow触发');
    updateSelectedTab();
  });

  // 处理Tab索引变化
  const handleTabIndexChange = (index: number) => {
    console.log('TabBar - 接收到tabIndexChange事件:', index);
    setSelected(index);
  };

  // 根据当前路径更新选中的tab
  const updateSelectedTab = () => {
    const currentPage = Taro.getCurrentInstance();
    const path = currentPage.router?.path || '';

    if (path === 'pages/index/index') {
      setSelected(0);
    } else if (path === 'pages/my/index') {
      setSelected(1);
    } else {
      if (path.includes('/pages/index')) {
        setSelected(0);
      } else if (path.includes('/pages/my')) {
        setSelected(1);
      }
    }
  };

  // 处理TabBar点击
  const switchTab = (index: number, path: string) => {
    Taro.eventCenter.trigger('tabIndexChange', index);
    setSelected(index);
    router.switchTab(`/${path}`);
  };

  // 处理中间加号按钮点击
  const handleCreateDiary = () => {
    if (isLoggedIn()) {
      router.navigateToCreateDiary();
    } else {
      Taro.showModal({
        title: '提示',
        content: '您需要先登录才能创建游记',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            router.navigateToLogin();
          }
        }
      });
    }
  };

  return (
    <View className='custom-tab-bar' style={{ backgroundColor: '#ffffff' }}>
      <View className='tab-bar-border'></View>
      
      <View className='tab-bar-item' onClick={() => switchTab(0, tabList[0].pagePath)}>
        <Image
          className='tab-bar-icon'
          src={getSvgDataUrl(tabList[0].icon, selected === 0 ? theme.primaryColor : '#999999')}
        />
        <View 
          className={`tab-bar-text ${selected === 0 ? 'selected' : ''}`} 
          style={selected === 0 ? { color: theme.primaryColor } : {}}
        >
          {tabList[0].text}
        </View>
      </View>

      <View className='tab-bar-plus-container' onClick={handleCreateDiary}>
        <View className='tab-bar-plus-button' style={{ background: theme.secondaryColor }}>
          <Image 
            className='tab-bar-plus-icon' 
            src={getSvgDataUrl(PLUS_ICON, '#ffffff')}
          />
        </View>
      </View>

      <View className='tab-bar-item' onClick={() => switchTab(1, tabList[1].pagePath)}>
        <Image
          className='tab-bar-icon'
          src={getSvgDataUrl(tabList[1].icon, selected === 1 ? theme.primaryColor : '#999999')}
        />
        <View 
          className={`tab-bar-text ${selected === 1 ? 'selected' : ''}`}
          style={selected === 1 ? { color: theme.primaryColor } : {}}
        >
          {tabList[1].text}
        </View>
      </View>
    </View>
  );
}

