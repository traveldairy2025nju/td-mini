import Taro from '@tarojs/taro';

export const BASE_URL = 'http://localhost:3000';  // 开发环境使用本地API，生产环境需要修改

// 请求拦截器
function interceptor(chain) {
  const requestParams = chain.requestParams;
  const { url } = requestParams;
  const token = Taro.getStorageSync('token');
  
  // 添加token到请求头
  if (token) {
    requestParams.header = {
      ...requestParams.header,
      Authorization: `Bearer ${token}`
    };
  }

  return chain.proceed(requestParams).then(res => {
    // 处理响应结果
    if (res.statusCode === 401) {
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
export const request = (options) => {
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
    
    if (statusCode >= 200 && statusCode < 300) {
      return data;
    } else {
      const errorMsg = data.message || '请求失败';
      throw new Error(errorMsg);
    }
  }).catch(error => {
    throw error;
  });
};

// 封装上传方法
export const uploadFile = (options) => {
  const token = Taro.getStorageSync('token');
  const header = token ? { Authorization: `Bearer ${token}` } : {};
  
  return Taro.uploadFile({
    url: `${BASE_URL}${options.url}`,
    filePath: options.filePath,
    name: options.name,
    formData: options.formData,
    header
  }).then(res => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const parsedData = JSON.parse(res.data);
        return parsedData;
      } catch (e) {
        return { success: false, message: '响应数据解析失败' };
      }
    } else {
      throw new Error('上传失败');
    }
  }).catch(error => {
    throw error;
  });
}; 