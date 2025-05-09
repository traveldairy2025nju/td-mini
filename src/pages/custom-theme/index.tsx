import { View, Text, Input } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { createCustomTheme, getThemeColors } from '../../utils/themeManager';
import { useTheme } from '../../hooks';
import ColorPicker from '../../components/color-picker';
import './index.scss';

function CustomTheme() {
  const currentTheme = getThemeColors();
  const [primaryColor, setPrimaryColor] = useState(currentTheme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(currentTheme.secondaryColor);
  const [colorError, setColorError] = useState('');
  const { hexToRgba } = useTheme();
  
  // 控制颜色选择器显示状态
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false);
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false);

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
  
  // 处理颜色选择器确认选择
  const handleColorPickerConfirm = (isPrimary: boolean) => (color) => {
    if (isPrimary) {
      setPrimaryColor(color.hex);
      setShowPrimaryPicker(false);
    } else {
      setSecondaryColor(color.hex);
      setShowSecondaryPicker(false);
    }
    setColorError('');
  };
  
  // 处理颜色选择器取消选择
  const handleColorPickerCancel = (isPrimary: boolean) => () => {
    if (isPrimary) {
      setShowPrimaryPicker(false);
    } else {
      setShowSecondaryPicker(false);
    }
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
          <View 
            className='color-preview' 
            style={{ backgroundColor: primaryColor }}
            onClick={() => setShowPrimaryPicker(true)}
          ></View>
        </View>

        <View className='form-group'>
          <Text className='form-label'>辅助色</Text>
          <Input
            className='color-input'
            value={secondaryColor}
            onInput={handleSecondaryColorChange}
            placeholder='#RRGGBB格式，如 #ff5348'
          />
          <View 
            className='color-preview' 
            style={{ backgroundColor: secondaryColor }}
            onClick={() => setShowSecondaryPicker(true)}
          ></View>
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

        <View 
          className='save-button'
          onClick={handleSaveTheme}
          style={{
            backgroundColor: primaryColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 8px ${hexToRgba(primaryColor, 0.3)}`
          }}
        >
          保存设置
        </View>
      </View>
      
      {/* 主题色选择器 */}
      <ColorPicker 
        show={showPrimaryPicker}
        initColor={primaryColor}
        onConfirm={handleColorPickerConfirm(true)}
        onCancel={handleColorPickerCancel(true)}
      />
      
      {/* 辅助色选择器 */}
      <ColorPicker 
        show={showSecondaryPicker}
        initColor={secondaryColor}
        onConfirm={handleColorPickerConfirm(false)}
        onCancel={handleColorPickerCancel(false)}
      />
    </View>
  );
}

export default CustomTheme; 