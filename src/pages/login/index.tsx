import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import useUserStore from '../../store/user';
import { isLoggedIn } from '../../utils/auth';
import Button from '../../components/taro-ui/Button';
import Input from '../../components/taro-ui/Input';
import './index.scss';

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
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // 从zustand中获取状态和方法
  const { login, isLoading, error } = useUserStore();
  
  // 如果已登录，直接跳转到首页
  useEffect(() => {
    const loggedIn = isLoggedIn();
    setDebugInfo(prev => prev + `\n已登录状态：${loggedIn}`);
    
    if (loggedIn) {
      Taro.switchTab({ url: '/pages/index/index' });
    }
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
    
    setDebugInfo(prev => prev + `\n尝试登录: ${formData.username}`);
    
    try {
      const success = await login(formData.username, formData.password);
    
      setDebugInfo(prev => prev + `\n登录结果: ${success ? '成功' : '失败'}`);
      
      if (success) {
        // 检查token是否保存成功
        const token = Taro.getStorageSync('token');
        setDebugInfo(prev => prev + `\n保存的Token: ${token ? '已保存' : '未保存'}`);
        
        Taro.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000
        });
        
        // 跳转到首页
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' });
        }, 2000);
      } else if (error) {
        setDebugInfo(prev => prev + `\n错误信息: ${error}`);
        
        Taro.showToast({
          title: '用户名或密码错误',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setDebugInfo(prev => prev + `\n发生异常: ${errorMsg}`);
      
      Taro.showToast({
        title: '登录时发生错误',
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
    <View className='login-container'>
      <View className='login-header'>
        <Text className='login-title'>旅行日记</Text>
        <Text className='login-subtitle'>记录你的每一次旅行</Text>
      </View>
      
      <View className='login-form'>
        <View className='input-field'>
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
        >
          登录
        </Button>
        
        <View className='login-footer'>
          <Text className='login-register-link' onClick={goToRegister}>
            没有账号？立即注册
          </Text>
        </View>
        
        {/* 调试信息区域，仅开发使用 */}
        {debugInfo && (
          <View className='debug-info'>
            <Text>调试信息：</Text>
            <Text className='debug-text'>{debugInfo}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default Login; 