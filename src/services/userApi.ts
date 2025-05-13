import Taro from '@tarojs/taro';
import { request } from './request';
import uploadApi from './uploadApi';

interface RegisterUserData {
  username: string;
  password: string;
  nickname: string;
  avatarUrl?: string;
}

// 用户相关接口
const userApi = {
  // 用户注册
  register: async (data, avatarFilePath) => {
    try {
      const userData: RegisterUserData = {
        username: data.username,
        password: data.password,
        nickname: data.nickname
      };
      
      // 如果有头像，先上传头像获取URL
      if (avatarFilePath) {
        const uploadRes = await uploadApi.uploadFile(avatarFilePath);
        
        if (!uploadRes.success || !uploadRes.data || !uploadRes.data.url) {
          throw new Error('头像上传失败');
        }
        
        // 将头像URL添加到注册数据中
        userData.avatarUrl = uploadRes.data.url;
      }
      
      // 执行注册请求
      const result = await request({
        url: '/api/users/register',
        method: 'POST',
        data: userData
      });
      
      if (result.success && result.data) {
        // 保存token
        if (result.data.token) {
          Taro.setStorageSync('token', result.data.token);
        }
        
        // 保存用户信息
        if (result.data.user) {
          // 确保存储的是对象而不是字符串
          let userInfo = result.data.user;
          if (typeof userInfo === 'string') {
            try {
              userInfo = JSON.parse(userInfo);
            } catch (e) {
              console.error('解析用户信息失败:', e);
            }
          }
          Taro.setStorageSync('userInfo', userInfo);
        }
      }
      
      return result;
    } catch (error) {
      console.error('注册错误:', error);
      throw error;
    }
  },

  // 用户登录
  login: async (params) => {
    try {
      const { username, password } = params;
      const res = await request({
        url: '/api/users/login',
        method: 'POST',
        data: { username, password }
      });
      
      console.log('登录响应:', res);
      
      // 如果登录成功，保存token和用户信息
      if (res.success && res.data) {
        // 保存token
        if (res.data.token) {
          console.log('保存token到本地');
          Taro.setStorageSync('token', res.data.token);
        }
        
        // 保存用户信息
        if (res.data.user) {
          console.log('保存用户信息到本地');
          // 确保存储的是对象而不是字符串
          let userInfo = res.data.user;
          if (typeof userInfo === 'string') {
            try {
              userInfo = JSON.parse(userInfo);
            } catch (e) {
              console.error('解析用户信息失败:', e);
            }
          }
          Taro.setStorageSync('userInfo', userInfo);
        }
      }
      
      return res;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  // 获取用户个人资料
  getUserProfile: async () => {
    try {
      console.log('获取用户个人资料');
      const res = await request({
        url: '/api/users/profile',
        method: 'GET'
      });
      
      console.log('获取用户个人资料响应:', res);
      return res;
    } catch (error) {
      console.error('获取用户个人资料失败:', error);
      throw error;
    }
  },

  // 获取当前用户信息，用于验证登录状态
  getCurrentUser: async () => {
    try {
      const res = await request({
        url: '/api/users/profile',
        method: 'GET'
      });
      
      console.log('获取当前用户信息结果:', res);
      
      if (res.success && res.data) {
        // 确保存储的是对象而不是字符串
        let userInfo = res.data;
        if (typeof userInfo === 'string') {
          try {
            userInfo = JSON.parse(userInfo);
          } catch (e) {
            console.error('解析用户信息失败:', e);
          }
        }
        // 更新本地存储的用户信息
        Taro.setStorageSync('userInfo', userInfo);
        return userInfo;
      }
      
      return null;
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
      return null;
    }
  },

  // 更新用户头像
  updateAvatar: async (filePath) => {
    try {
      // 第一步：先使用通用上传接口上传文件
      const uploadRes = await uploadApi.uploadFile(filePath);
      
      if (!uploadRes.success || !uploadRes.data || !uploadRes.data.url) {
        throw new Error('头像上传失败');
      }
      
      // 第二步：发送PUT请求更新用户头像URL
      const updateRes = await request({
        url: '/api/users/avatar',
        method: 'PUT',
        data: { avatarUrl: uploadRes.data.url }
      });
      
      // 如果更新成功，同时更新本地存储的用户信息
      if (updateRes.success && updateRes.data) {
        const userInfoStr = Taro.getStorageSync('userInfo');
        if (userInfoStr) {
          // 确保userInfo是对象，如果是字符串则解析
          let userInfo = userInfoStr;
          if (typeof userInfoStr === 'string') {
            try {
              userInfo = JSON.parse(userInfoStr);
            } catch (e) {
              console.error('解析用户信息失败:', e);
              // 如果解析失败，使用API返回的用户信息
              userInfo = updateRes.data;
            }
          }
          
          userInfo.avatar = uploadRes.data.url;
          Taro.setStorageSync('userInfo', userInfo);
        }
      }
      
      return updateRes;
    } catch (error) {
      console.error('头像上传错误:', error);
      throw error;
    }
  },

  // 更新用户昵称
  updateNickname: async (nickname) => {
    try {
      const updateRes = await request({
        url: '/api/users/nickname',
        method: 'PUT',
        data: { nickname }
      });
      
      // 如果更新成功，同时更新本地存储的用户信息
      if (updateRes.success && updateRes.data) {
        const userInfoStr = Taro.getStorageSync('userInfo');
        if (userInfoStr) {
          // 确保userInfo是对象，如果是字符串则解析
          let userInfo = userInfoStr;
          if (typeof userInfoStr === 'string') {
            try {
              userInfo = JSON.parse(userInfoStr);
            } catch (e) {
              console.error('解析用户信息失败:', e);
              // 如果解析失败，使用API返回的用户信息
              userInfo = updateRes.data;
            }
          }
          
          // 更新昵称
          userInfo.nickname = nickname;
          Taro.setStorageSync('userInfo', userInfo);
        }
      }
      
      return updateRes;
    } catch (error) {
      console.error('更新昵称错误:', error);
      throw error;
    }
  },

  // 检查当前登录状态
  checkLoginStatus: async () => {
    console.log('检查当前登录状态');
    
    // 检查本地存储
    const token = Taro.getStorageSync('token');
    const userInfoStr = Taro.getStorageSync('userInfo');
    
    // 解析用户信息
    let userInfo = null;
    if (userInfoStr) {
      if (typeof userInfoStr === 'string') {
        try {
          userInfo = JSON.parse(userInfoStr);
        } catch (e) {
          console.error('解析用户信息失败:', e);
          // 解析失败时清除存储的信息，强制重新登录
          Taro.removeStorageSync('userInfo');
        }
      } else {
        userInfo = userInfoStr;
      }
    }
    
    console.log('本地token:', token ? '已存在' : '不存在');
    console.log('本地用户信息:', userInfo ? '已存在' : '不存在');
    
    // 如果没有token，用户未登录
    if (!token) {
      console.log('无token，用户未登录');
      return { isLoggedIn: false };
    }
    
    // 如果有token但没有用户信息，尝试获取
    if (!userInfo) {
      try {
        console.log('有token但无用户信息，尝试从API获取');
        // 直接使用request避免循环引用
        const res = await request({
          url: '/api/users/profile',
          method: 'GET'
        });
        
        if (res.success && res.data) {
          // 保存用户信息
          Taro.setStorageSync('userInfo', res.data);
          return { 
            isLoggedIn: true, 
            user: res.data,
            token
          };
        } else {
          // API请求成功但没有返回用户信息，清除token
          console.log('API未返回用户信息，清除token');
          Taro.removeStorageSync('token');
          return { isLoggedIn: false };
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 如果是401错误，清除token
        if (error.message && error.message.includes('登录')) {
          Taro.removeStorageSync('token');
        }
        return { isLoggedIn: false };
      }
    }
    
    // 有token和用户信息，用户已登录
    return { 
      isLoggedIn: true, 
      user: userInfo,
      token
    };
  },
};

export default userApi;
