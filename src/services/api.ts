import Taro from '@tarojs/taro';

const BASE_URL = 'http://localhost:3000';  // 开发环境使用本地API，生产环境需要修改

// 日志函数
const logDebug = (message: string) => {
  console.log(`[API Debug] ${message}`);
};

// 请求拦截器
function interceptor(chain) {
  const requestParams = chain.requestParams;
  const { url } = requestParams;
  const token = Taro.getStorageSync('token');
  
  // 添加token到请求头
  if (token) {
    logDebug(`请求添加token: ${url}`);
    requestParams.header = {
      ...requestParams.header,
      Authorization: `Bearer ${token}`
    };
  } else {
    logDebug(`请求无token: ${url}`);
  }

  return chain.proceed(requestParams).then(res => {
    // 处理响应结果
    if (res.statusCode === 401) {
      logDebug(`响应状态401，需要重新登录: ${url}`);
      // token失效，需要重新登录
      Taro.removeStorageSync('token');
      Taro.removeStorageSync('userInfo');
      Taro.navigateTo({ url: '/pages/login/index' });
      return Promise.reject(new Error('请重新登录'));
    }
    return res;
  });
}

// 注册拦截器
Taro.addInterceptor(interceptor);

// 封装请求方法
const request = (options) => {
  logDebug(`发起请求: ${options.method || 'GET'} ${options.url}`);
  
  return Taro.request({
    url: `${BASE_URL}${options.url}`,
    data: options.data,
    method: options.method || 'GET',
    header: {
      'Content-Type': options.contentType || 'application/json',
      ...options.header
    }
  }).then(res => {
    const { statusCode, data } = res;
    logDebug(`请求结果: ${statusCode} ${options.url}`);
    console.log('响应数据:', data);
    
    if (statusCode >= 200 && statusCode < 300) {
      return data;
    } else {
      const errorMsg = data.message || '请求失败';
      logDebug(`请求错误: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }).catch(error => {
    logDebug(`请求异常: ${error.message}`);
    throw error;
  });
};

// 封装上传方法
const uploadFile = (options) => {
  const token = Taro.getStorageSync('token');
  const header = token ? { Authorization: `Bearer ${token}` } : {};
  
  logDebug(`发起上传: ${options.url}`);
  
  return Taro.uploadFile({
    url: `${BASE_URL}${options.url}`,
    filePath: options.filePath,
    name: options.name,
    formData: options.formData,
    header
  }).then(res => {
    logDebug(`上传结果: ${res.statusCode} ${options.url}`);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const parsedData = JSON.parse(res.data);
        return parsedData;
      } catch (e) {
        logDebug(`解析上传响应数据失败: ${e.message}`);
        return { success: false, message: '响应数据解析失败' };
      }
    } else {
      throw new Error('上传失败');
    }
  }).catch(error => {
    logDebug(`上传异常: ${error.message}`);
    throw error;
  });
};

// API接口
const api = {
  // 用户相关接口
  user: {
    // 用户注册
    register: (data, files) => {
      logDebug(`注册用户: ${data.username}`);
      
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
      logDebug(`用户登录: ${data.username}`);
      
      return request({
        url: '/api/users/login',
        method: 'POST',
        data
      }).then(res => {
        if (res.success && res.data && res.data.token) {
          logDebug(`登录成功，获取到token: ${res.data.token.substring(0, 10)}...`);
          
          // 立即保存token到storage
          Taro.setStorageSync('token', res.data.token);
        } else {
          logDebug('登录响应中没有token');
        }
        return res;
      });
    },
    
    // 获取用户资料
    getProfile: () => {
      logDebug('获取用户资料');
      
      return request({
        url: '/api/users/profile'
      });
    },
    
    // 更新用户头像
    updateAvatar: (filePath) => {
      logDebug('更新用户头像');
      
      return uploadFile({
        url: '/api/users/avatar',
        method: 'PUT',
        filePath,
        name: 'avatar'
      });
    },
    
    // 更新用户昵称
    updateNickname: (nickname) => {
      logDebug(`更新用户昵称: ${nickname}`);
      
      return request({
        url: '/api/users/nickname',
        method: 'PUT',
        data: { nickname }
      });
    }
  },
  
  // 游记相关接口 - 后续实现
  diary: {
    // 待实现
  }
};

export default api; 