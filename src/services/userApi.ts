import Taro from '@tarojs/taro';
import { request } from './request';
import uploadApi from './uploadApi';

// 用户相关接口
const userApi = {
  // 用户注册
  register: async (data) => {
    return request({
      url: '/api/users/register',
      method: 'POST',
      data
    });
  },

  // 带头像的用户注册
  registerWithAvatar: async (data, avatarFilePath) => {
    try {
      // 创建表单数据
      const formData = {
        username: data.username,
        password: data.password,
        nickname: data.nickname
      };

      // 执行带文件的注册请求
      const result = await Taro.uploadFile({
        url: `${process.env.BASE_URL || ''}/api/users/register`,
        filePath: avatarFilePath,
        name: 'avatar',
        formData
      });

      const response = JSON.parse(result.data);

      if (result.statusCode >= 200 && result.statusCode < 300 && response.success) {
        // 保存token
        if (response.data && response.data.token) {
          Taro.setStorageSync('token', response.data.token);
        }
        return response;
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (error) {
      console.error('注册错误:', error);
      throw error;
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
      url: '/api/users/profile',
      method: 'GET'
    });
  },

  // 更新用户头像
  updateAvatar: async (filePath) => {
    try {
      // 第一步：先使用通用上传接口上传文件
      const uploadRes = await uploadApi.uploadFile(filePath);

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
