import { View, Text, Button, Input, Image } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import useUserStore from '../../store/user';
import './index.scss';

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  nickname: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
  nickname?: string;
}

function Register() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: ''
  });
  const [avatarPath, setAvatarPath] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  
  // 从zustand中获取状态和方法
  const { register, isLoading, error } = useUserStore();
  
  // 处理表单变化
  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除对应的错误信息
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // 特殊处理确认密码
    if (name === 'password' && formData.confirmPassword && value !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '两次输入的密码不一致' }));
    } else if (name === 'confirmPassword' && formData.password && value !== formData.password) {
      setErrors(prev => ({ ...prev, confirmPassword: '两次输入的密码不一致' }));
    } else if (name === 'confirmPassword' && formData.password && value === formData.password) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };
  
  // 处理头像上传
  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        setAvatarPath(tempFilePath);
      }
    });
  };
  
  // 表单验证
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名长度不能小于3位';
    }
    
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度不能小于6位';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    if (!formData.nickname.trim()) {
      newErrors.nickname = '请输入昵称';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 提交表单
  const handleSubmit = async () => {
    if (!validate()) return;
    
    const registerData = {
      username: formData.username,
      password: formData.password,
      nickname: formData.nickname
    };
    
    const files = avatarPath ? { avatar: avatarPath } : undefined;
    
    const success = await register(registerData, files);
    
    if (success) {
      Taro.showToast({
        title: '注册成功',
        icon: 'success',
        duration: 2000
      });
      
      // 跳转到首页
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 2000);
    } else if (error) {
      Taro.showToast({
        title: '注册失败，用户名可能已存在',
        icon: 'none',
        duration: 2000
      });
    }
  };
  
  // 返回登录页
  const goToLogin = () => {
    Taro.navigateBack();
  };
  
  return (
    <View className='register-container'>
      <View className='register-header'>
        <Text className='register-title'>注册账号</Text>
      </View>
      
      <View className='register-form'>
        <View className='avatar-upload' onClick={handleChooseImage}>
          {avatarPath ? (
            <Image 
              className='avatar-upload__image' 
              src={avatarPath} 
              mode='aspectFill'
            />
          ) : (
            <View className='avatar-upload__placeholder'>
              <View className='avatar-upload__text'>点击上传头像</View>
            </View>
          )}
        </View>
        
        <View className='input-field'>
          <View className='input-field__label'>
            <Text className='input-field__required'>*</Text>
            <Text>用户名</Text>
          </View>
          <View className={`input-field__input-container ${errors.username ? 'input-field__input-container--error' : ''}`}>
            <Input
              className='input-field__input'
              name='username'
              type='text'
              value={formData.username}
              placeholder='请输入用户名(至少3位)'
              onInput={(e) => handleChange('username', e.detail.value)}
            />
          </View>
          {errors.username && (
            <View className='input-field__error'>
              <Text>{errors.username}</Text>
            </View>
          )}
        </View>
        
        <View className='input-field'>
          <View className='input-field__label'>
            <Text className='input-field__required'>*</Text>
            <Text>密码</Text>
          </View>
          <View className={`input-field__input-container ${errors.password ? 'input-field__input-container--error' : ''}`}>
            <Input
              className='input-field__input'
              name='password'
              password
              value={formData.password}
              placeholder='请输入密码(至少6位)'
              onInput={(e) => handleChange('password', e.detail.value)}
            />
          </View>
          {errors.password && (
            <View className='input-field__error'>
              <Text>{errors.password}</Text>
            </View>
          )}
        </View>
        
        <View className='input-field'>
          <View className='input-field__label'>
            <Text className='input-field__required'>*</Text>
            <Text>确认密码</Text>
          </View>
          <View className={`input-field__input-container ${errors.confirmPassword ? 'input-field__input-container--error' : ''}`}>
            <Input
              className='input-field__input'
              name='confirmPassword'
              password
              value={formData.confirmPassword}
              placeholder='请再次输入密码'
              onInput={(e) => handleChange('confirmPassword', e.detail.value)}
            />
          </View>
          {errors.confirmPassword && (
            <View className='input-field__error'>
              <Text>{errors.confirmPassword}</Text>
            </View>
          )}
        </View>
        
        <View className='input-field'>
          <View className='input-field__label'>
            <Text className='input-field__required'>*</Text>
            <Text>昵称</Text>
          </View>
          <View className={`input-field__input-container ${errors.nickname ? 'input-field__input-container--error' : ''}`}>
            <Input
              className='input-field__input'
              name='nickname'
              type='text'
              value={formData.nickname}
              placeholder='请输入昵称'
              onInput={(e) => handleChange('nickname', e.detail.value)}
            />
          </View>
          {errors.nickname && (
            <View className='input-field__error'>
              <Text>{errors.nickname}</Text>
            </View>
          )}
        </View>
        
        <Button 
          type='primary' 
          className='register-button'
          loading={isLoading}
          onClick={handleSubmit}
        >
          注册
        </Button>
        
        <View className='register-footer'>
          <Text className='register-login-link' onClick={goToLogin}>
            已有账号？返回登录
          </Text>
        </View>
      </View>
    </View>
  );
}

export default Register; 