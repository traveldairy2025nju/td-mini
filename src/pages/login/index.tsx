import { View, Text, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import useUserStore from '../../store/user';
import { isLoggedIn } from '../../utils/auth';
import Button from '../../components/taro-ui/Button';
import Input from '../../components/taro-ui/Input';
import { getThemeColors, ThemeColors } from '../../utils/themeManager';
import './index.scss';

// 浅色处理函数
function lightenColor(hex: string, amount: number): string {
  // 移除#号
  hex = hex.replace('#', '');
  
  // 转为RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // 变浅颜色
  r = Math.min(255, Math.floor(r + (255 - r) * amount));
  g = Math.min(255, Math.floor(g + (255 - g) * amount));
  b = Math.min(255, Math.floor(b + (255 - b) * amount));
  
  // 转回hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 颜色转rgba
function hexToRgba(hex: string, alpha: number): string {
  // 移除#号
  hex = hex.replace('#', '');
  
  // 转为RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface FormData {
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
}

function Login() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [theme, setTheme] = useState<ThemeColors>(getThemeColors());

  // 从zustand中获取状态和方法
  const { login, isLoading, error } = useUserStore();

  // 如果已登录，直接跳转到首页
  useEffect(() => {
    const loggedIn = isLoggedIn();

    if (loggedIn) {
      Taro.switchTab({ url: '/pages/index/index' });
    }
    
    // 监听主题变化事件
    const themeChangeHandler = (newTheme: ThemeColors) => {
      setTheme(newTheme);
    };
    Taro.eventCenter.on('themeChange', themeChangeHandler);
    
    return () => {
      Taro.eventCenter.off('themeChange', themeChangeHandler);
    };
  }, []);

  // 处理表单变化
  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // 清除对应的错误信息
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 表单验证
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度不能小于6位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      console.log('提交登录表单:', formData);
      const success = await login(formData.username, formData.password);

      if (success) {
        Taro.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000
        });

        // 跳转到首页
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' });
        }, 2000);
      } else {
        // 显示具体的错误信息
        Taro.showToast({
          title: error || '登录失败，请检查用户名和密码',
          icon: 'none',
          duration: 2000
        });
        console.error('登录失败，错误信息:', error);
      }
    } catch (err) {
      console.error('登录异常:', err);
      Taro.showToast({
        title: err instanceof Error ? err.message : '登录时发生错误',
        icon: 'none',
        duration: 2000
      });
    }
  };

  // 前往注册页
  const goToRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' });
  };

  return (
    <View 
      className='login-container'
      style={{
        background: `linear-gradient(135deg, ${lightenColor(theme.primaryColor, 0.6)} 0%, ${theme.primaryColor} 100%)`
      }}
    >
      <View className='login-header'>
        <Image
          className='login-logo'
          src='https://images.unsplash.com/photo-1522199710521-72d69614c702?q=80&w=200&auto=format&fit=crop'
        />
        <Text className='login-title'>旅行日记</Text>
        <Text className='login-subtitle'>记录你的每一次旅行</Text>
      </View>

      <View className='login-form'>
        <View className='form-title'>登录账号</View>

        <View className='input-field'>
          <View className='input-icon'>
            <Text 
              className='iconfont icon-user'
              style={{ color: theme.primaryColor }}
            ></Text>
          </View>
          <Input
            name='username'
            title='用户名'
            type='text'
            value={formData.username}
            placeholder='请输入用户名'
            error={!!errors.username}
            required
            onChange={(value) => handleChange('username', value)}
          />
          {errors.username && (
            <View className='input-field__error'>
              <Text>{errors.username}</Text>
            </View>
          )}
        </View>

        <View className='input-field'>
          <View className='input-icon'>
            <Text 
              className='iconfont icon-lock'
              style={{ color: theme.primaryColor }}
            ></Text>
          </View>
          <Input
            name='password'
            title='密码'
            type='password'
            value={formData.password}
            placeholder='请输入密码'
            error={!!errors.password}
            required
            onChange={(value) => handleChange('password', value)}
          />
          {errors.password && (
            <View className='input-field__error'>
              <Text>{errors.password}</Text>
            </View>
          )}
        </View>

        <Button
          type='primary'
          className='login-button'
          loading={isLoading}
          onClick={handleSubmit}
          style={{
            background: `linear-gradient(90deg, ${theme.primaryColor} 0%, ${theme.primaryColor}cc 100%)`,
            boxShadow: `0 8px 16px ${hexToRgba(theme.primaryColor, 0.3)}`
          }}
        >
          登 录
        </Button>

        <View className='login-footer'>
          <Text 
            className='login-register-link' 
            onClick={goToRegister}
            style={{ color: theme.primaryColor }}
          >
            没有账号？立即注册
          </Text>
        </View>
      </View>
    </View>
  );
}

export default Login;
