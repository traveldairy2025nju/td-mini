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
        data,
        contentType: 'multipart/form-data'
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
  updateAvatar: (filePath) => {
    return uploadFile({
      url: '/api/users/avatar',
      method: 'PUT',
      filePath,
      name: 'avatar'
    });
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