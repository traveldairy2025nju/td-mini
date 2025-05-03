import Taro from '@tarojs/taro';
import { request, uploadFile } from './request';

// 用户相关接口
const userApi = {
  // 用户注册
  register: (data, files) => {
    if (files && files.avatar) {
      return uploadFile({
        url: '/api/users/register',
        filePath: files.avatar,
        name: 'avatar',
        formData: data
      });
    } else {
      return request({
        url: '/api/users/register',
        method: 'POST',
        data
      });
    }
  },
  
  // 用户登录
  login: (data) => {
    return request({
      url: '/api/users/login',
      method: 'POST',
      data
    }).then(res => {
      if (res.success && res.data && res.data.token) {
        // 立即保存token到storage
        Taro.setStorageSync('token', res.data.token);
      }
      return res;
    });
  },
  
  // 获取用户资料
  getProfile: () => {
    return request({
      url: '/api/users/profile'
    });
  },
  
  // 更新用户头像
  updateAvatar: async (filePath) => {
    try {
      // 第一步：先使用通用上传接口上传文件
      const uploadRes = await uploadFile({
        url: '/api/upload',
        filePath,
        name: 'file'
      });
      
      if (!uploadRes.success || !uploadRes.data || !uploadRes.data.url) {
        throw new Error('文件上传失败');
      }
      
      // 第二步：发送PUT请求更新用户头像URL
      const updateRes = await request({
        url: '/api/users/avatar',
        method: 'PUT',
        data: { avatarUrl: uploadRes.data.url }
      });
      
      return updateRes;
    } catch (error) {
      console.error('头像上传错误:', error);
      throw error;
    }
  },
  
  // 更新用户昵称
  updateNickname: (nickname) => {
    return request({
      url: '/api/users/nickname',
      method: 'PUT',
      data: { nickname }
    });
  }
};

export default userApi; 