import { View, Image } from '@tarojs/components';
import Taro, { useDidShow, useDidHide } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { isLoggedIn } from '../utils/auth';
import './index.scss';

interface TabItem {
  pagePath: string;
  text: string;
  iconPath: string;
  selectedIconPath: string;
}

export default function CustomTabBar() {
  const [selected, setSelected] = useState(0);
  const [tabList] = useState<TabItem[]>([
    {
      pagePath: 'pages/index/index',
      text: '首页',
      iconPath: '../assets/icons/home.png',
      selectedIconPath: '../assets/icons/home-active.png'
    },
    {
      pagePath: 'pages/my/index',
      text: '我的',
      iconPath: '../assets/icons/user.png',
      selectedIconPath: '../assets/icons/user-active.png'
    }
  ]);

  // 组件挂载时添加路由事件监听
  useEffect(() => {
    // 监听页面显示事件
    Taro.eventCenter.on('tabIndexChange', handleTabIndexChange);

    // 初始化时执行一次
    updateSelectedTab();

    // 组件卸载时移除事件监听
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

    console.log('TabBar - 当前路径:', path);

    // 根据路径精确匹配
    if (path === 'pages/index/index') {
      console.log('TabBar - 激活首页tab');
      setSelected(0);
    } else if (path === 'pages/my/index') {
      console.log('TabBar - 激活我的tab');
      setSelected(1);
    } else {
      // 如果不是精确匹配，尝试模糊匹配
      if (path.includes('/pages/index')) {
        console.log('TabBar - 模糊匹配激活首页tab');
        setSelected(0);
      } else if (path.includes('/pages/my')) {
        console.log('TabBar - 模糊匹配激活我的tab');
        setSelected(1);
      } else {
        console.log('TabBar - 未匹配到主页面路径');
      }
    }
  };

  // 处理TabBar点击
  const switchTab = (index: number, path: string) => {
    // 触发全局事件，通知索引变化
    Taro.eventCenter.trigger('tabIndexChange', index);

    // 先设置选中状态，再切换页面
    setSelected(index);
    console.log('TabBar - 点击Tab切换到:', index, path);
    Taro.switchTab({ url: `/${path}` });
  };

  // 处理中间加号按钮点击
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
    <View className='custom-tab-bar'>
      <View className='tab-bar-border'></View>
      <View className='tab-bar-item' onClick={() => switchTab(0, tabList[0].pagePath)}>
        <Image
          className='tab-bar-icon'
          src={selected === 0 ? tabList[0].selectedIconPath : tabList[0].iconPath}
        />
        <View className={`tab-bar-text ${selected === 0 ? 'selected' : ''}`}>
          {tabList[0].text}
        </View>
      </View>

      <View className='tab-bar-plus-container' onClick={handleCreateDiary}>
        <View className='tab-bar-plus-button'>
          <Image className='tab-bar-plus-icon' src='../assets/icons/plus.png' />
        </View>
      </View>

      <View className='tab-bar-item' onClick={() => switchTab(1, tabList[1].pagePath)}>
        <Image
          className='tab-bar-icon'
          src={selected === 1 ? tabList[1].selectedIconPath : tabList[1].iconPath}
        />
        <View className={`tab-bar-text ${selected === 1 ? 'selected' : ''}`}>
          {tabList[1].text}
        </View>
      </View>
    </View>
  );
}

