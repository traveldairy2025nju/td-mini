import { View, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
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

  useEffect(() => {
    const path = Taro.getCurrentInstance().router?.path;
    if (path) {
      const tabIndex = tabList.findIndex(item => path.includes(item.pagePath));
      if (tabIndex !== -1) {
        setSelected(tabIndex);
      }
    }
  }, []);

  // 处理TabBar点击
  const switchTab = (index: number, path: string) => {
    setSelected(index);
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

