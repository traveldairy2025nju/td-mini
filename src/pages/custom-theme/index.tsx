import { View, Text, Input } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { createCustomTheme, getThemeColors } from '../../utils/themeManager';
import Button from '../../components/taro-ui/Button';
import './index.scss';

function CustomTheme() {
  const currentTheme = getThemeColors();
  const [primaryColor, setPrimaryColor] = useState(currentTheme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(currentTheme.secondaryColor);
  const [colorError, setColorError] = useState('');

  // 颜色格式验证
  const validateColor = (color: string): boolean => {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(color);
  };

  // 处理主色变化
  const handlePrimaryColorChange = (e) => {
    const color = e.detail.value;
    setPrimaryColor(color);
    setColorError('');
  };

  // 处理次色变化
  const handleSecondaryColorChange = (e) => {
    const color = e.detail.value;
    setSecondaryColor(color);
    setColorError('');
  };

  // 保存主题设置
  const handleSaveTheme = () => {
    // 验证颜色格式
    if (!validateColor(primaryColor)) {
      setColorError('主题色格式不正确，请使用 #RRGGBB 格式');
      return;
    }

    if (!validateColor(secondaryColor)) {
      setColorError('辅助色格式不正确，请使用 #RRGGBB 格式');
      return;
    }

    // 提示用户正在应用主题
    Taro.showLoading({
      title: '正在应用主题...',
      mask: true
    });

    // 应用主题 - 会自动重新加载小程序
    createCustomTheme(primaryColor, secondaryColor);

    // 无需手动返回，小程序将重新加载
  };

  return (
    <View className='custom-theme-container'>
      <View className='custom-theme-header'>
        <Text className='custom-theme-title'>自定义主题色</Text>
      </View>

      <View className='custom-theme-form'>
        <View className='form-group'>
          <Text className='form-label'>主题色</Text>
          <Input
            className='color-input'
            value={primaryColor}
            onInput={handlePrimaryColorChange}
            placeholder='#RRGGBB格式，如 #1296db'
          />
          <View className='color-preview' style={{ backgroundColor: primaryColor }}></View>
        </View>

        <View className='form-group'>
          <Text className='form-label'>辅助色</Text>
          <Input
            className='color-input'
            value={secondaryColor}
            onInput={handleSecondaryColorChange}
            placeholder='#RRGGBB格式，如 #ff5348'
          />
          <View className='color-preview' style={{ backgroundColor: secondaryColor }}></View>
        </View>

        {colorError && (
          <View className='error-message'>
            <Text>{colorError}</Text>
          </View>
        )}

        <View className='theme-preview'>
          <Text className='preview-title'>预览效果</Text>
          <View className='preview-container'>
            <View className='preview-item' style={{ backgroundColor: primaryColor }}>
              <Text className='preview-text'>主题色</Text>
            </View>
            <View className='preview-item' style={{ backgroundColor: secondaryColor }}>
              <Text className='preview-text'>辅助色</Text>
            </View>
          </View>
        </View>

        <Button className='save-button' onClick={handleSaveTheme}>
          保存设置
        </Button>
      </View>
    </View>
  );
}

export default CustomTheme; 