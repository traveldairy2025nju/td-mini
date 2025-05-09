import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { 
  THEMES, 
  ThemeColors, 
  getThemeColors, 
  switchToPresetTheme 
} from '../../utils/themeManager';
import { useRouter } from '../../hooks';
import './index.scss';

// 主题显示名称
const THEME_NAMES = {
  default: '默认蓝色',
  red: '活力红色',
  green: '自然绿色',
  purple: '高雅紫色'
};

function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<ThemeColors>(getThemeColors());
  const [activeTheme, setActiveTheme] = useState<string>('');
  const { navigateTo, ROUTES } = useRouter();
  
  // 获取当前主题对应的名称
  useEffect(() => {
    // 查找当前使用的预设主题
    const themeEntry = Object.entries(THEMES).find(([_, theme]) => 
      theme.primaryColor === currentTheme.primaryColor
    );
    
    if (themeEntry) {
      setActiveTheme(themeEntry[0]);
    }
  }, [currentTheme]);
  
  // 选择预设主题
  const handleSelectTheme = (themeName: string) => {
    // 显示加载提示
    Taro.showLoading({
      title: '正在应用主题...',
      mask: true
    });
    
    // 应用主题
    switchToPresetTheme(themeName as keyof typeof THEMES);
    
    // 延迟返回，给用户一些视觉反馈
    setTimeout(() => {
      Taro.hideLoading();
      Taro.navigateBack();
    }, 500);
  };
  
  // 前往自定义主题页面
  const handleCustomTheme = () => {
    navigateTo(ROUTES.CUSTOM_THEME);
  };
  
  return (
    <View className='theme-selector-container'>
      <View className='theme-selector-header'>
        <Text className='theme-selector-title'>选择主题</Text>
        <Text className='theme-selector-description'>选择一个预设主题或创建自定义主题</Text>
      </View>
      
      <View className='theme-list'>
        {Object.entries(THEMES).map(([name, theme]) => (
          <View 
            key={name}
            className={`theme-item ${activeTheme === name ? 'active' : ''}`}
            onClick={() => handleSelectTheme(name)}
          >
            <View 
              className='theme-color-block'
              style={{ backgroundColor: theme.primaryColor }}
            />
            <Text className='theme-name'>{THEME_NAMES[name]}</Text>
            {activeTheme === name && <Text className='theme-check'>✓</Text>}
          </View>
        ))}
      </View>
      
      <View className='custom-theme-btn' onClick={handleCustomTheme}>
        自定义颜色
      </View>
    </View>
  );
}

export default ThemeSelector; 