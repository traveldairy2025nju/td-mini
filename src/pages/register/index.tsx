import { View, Text, Image } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import useUserStore from '../../store/user';
import Button from '../../components/taro-ui/Button';
import Input from '../../components/taro-ui/Input';
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
        <Image 
          className='register-logo'
          src='https://images.unsplash.com/photo-1522199710521-72d69614c702?q=80&w=200&auto=format&fit=crop'
        />
        <Text className='register-title'>旅行日记</Text>
        <Text className='register-subtitle'>记录你的每一次旅行</Text>
      </View>
      
      <View className='register-form'>
        <View className='form-title'>注册账号</View>
        
        <View className='avatar-upload' onClick={handleChooseImage}>
          {avatarPath ? (
            <Image 
              className='avatar-upload__image' 
              src={avatarPath} 
              mode='aspectFill'
            />
          ) : (
            <View className='avatar-upload__placeholder'>
              <Text className='iconfont icon-camera'></Text>
              <View className='avatar-upload__text'>上传头像</View>
            </View>
          )}
        </View>
        
        <View className='input-field'>
          <View className='input-icon'>
            <Text className='iconfont icon-user'></Text>
          </View>
          <Input
            name='username'
            title='用户名'
            type='text'
            value={formData.username}
            placeholder='请输入用户名(至少3位)'
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
            <Text className='iconfont icon-lock'></Text>
          </View>
          <Input
            name='password'
            title='密码'
            type='password'
            value={formData.password}
            placeholder='请输入密码(至少6位)'
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
        
        <View className='input-field'>
          <View className='input-icon'>
            <Text className='iconfont icon-lock'></Text>
          </View>
          <Input
            name='confirmPassword'
            title='确认密码'
            type='password'
            value={formData.confirmPassword}
            placeholder='请再次输入密码'
            error={!!errors.confirmPassword}
            required
            onChange={(value) => handleChange('confirmPassword', value)}
          />
          {errors.confirmPassword && (
            <View className='input-field__error'>
              <Text>{errors.confirmPassword}</Text>
            </View>
          )}
        </View>
        
        <View className='input-field'>
          <View className='input-icon'>
            <Text className='iconfont icon-nickname'></Text>
          </View>
          <Input
            name='nickname'
            title='昵称'
            type='text'
            value={formData.nickname}
            placeholder='请输入昵称'
            error={!!errors.nickname}
            required
            onChange={(value) => handleChange('nickname', value)}
          />
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
          注 册
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