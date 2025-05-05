import Taro from '@tarojs/taro';
import ENV_CONFIG from '../config/env';

// 尝试导入本地环境配置（如果存在）
let LOCAL_CONFIG: { BASE_URL?: string } = {};
try {
  // 动态导入本地配置，如果不存在会抛出错误
  const localConfig = require('../config/env.local').default;
  if (localConfig && typeof localConfig === 'object') {
    LOCAL_CONFIG = localConfig;
  }
} catch (e) {
  console.log('没有找到本地环境配置，使用默认配置');
}

// 优先使用本地配置，如果没有则使用环境配置
export const BASE_URL = LOCAL_CONFIG.BASE_URL || ENV_CONFIG.BASE_URL;

// 请求拦截器
function interceptor(chain) {
  const requestParams = chain.requestParams;
  const { url } = requestParams;
  const token = Taro.getStorageSync('token');

  // 添加token到请求头
  if (token) {
    console.log(`请求拦截器: 为请求 ${url} 添加token`);
    requestParams.header = {
      ...requestParams.header,
      Authorization: `Bearer ${token}`
    };
  } else {
    console.log(`请求拦截器: 请求 ${url} 没有token`);
  }

  return chain.proceed(requestParams).then(res => {
    console.log(`响应拦截器: ${url} 返回状态码 ${res.statusCode}`);

    // 处理响应结果
    if (res.statusCode === 401) {
      console.log('响应拦截器: 收到401未授权错误，清除token和用户信息');
      // token失效，需要重新登录
      Taro.removeStorageSync('token');
      Taro.removeStorageSync('userInfo');

      // 如果不是登录页面，则跳转到登录页
      const pages = Taro.getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const isLoginPage = currentPage && currentPage.route && currentPage.route.includes('login');

      if (!isLoginPage) {
        console.log('响应拦截器: 跳转到登录页面');

        // 显示提示并延迟跳转
        Taro.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none',
          duration: 2000
        });

        setTimeout(() => {
          Taro.navigateTo({ url: '/pages/login/index' });
        }, 1500);
      }

      // 返回标准化的401错误
      return {
        ...res,
        data: {
          success: false,
          message: '登录已过期，请重新登录',
          statusCode: 401
        }
      };
    }
    return res;
  });
}

// 注册拦截器
Taro.addInterceptor(interceptor);

// 封装请求方法
export const request = (options) => {
  const url = `${BASE_URL}${options.url}`;
  console.log(`发起请求: ${options.method || 'GET'} ${url}`);
  console.log('请求参数:', JSON.stringify(options.data));

  return Taro.request({
    url,
    data: options.data,
    method: options.method || 'GET',
    header: {
      'Content-Type': options.contentType || 'application/json',
      ...options.header
    }
  }).then(res => {
    const { statusCode, data } = res;
    console.log(`请求完成: ${url} 状态码 ${statusCode}`, '响应数据:', JSON.stringify(data));

    if (statusCode >= 200 && statusCode < 300) {
      // 处理登录响应，保存token
      if (options.url.includes('/login') && data.success && data.data && data.data.token) {
        console.log('登录成功，保存token');
        Taro.setStorageSync('token', data.data.token);

        // 保存用户信息
        if (data.data.user) {
          console.log('保存用户信息');
          Taro.setStorageSync('userInfo', data.data.user);
        }
      }

      return data;
    } else {
      const errorMsg = data.message || '请求失败';
      console.error(`请求错误: ${url} - 状态码 ${statusCode} - ${errorMsg}`, '完整响应:', JSON.stringify(data));
      throw new Error(errorMsg);
    }
  }).catch(error => {
    console.error(`请求异常: ${url}`, error);

    // 如果是网络错误，提供更详细的信息
    if (error.errMsg) {
      console.error('网络错误详情:', error.errMsg);
    }

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
    formData: options.formData || {},
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
      let errorMsg = '上传失败';
      try {
        const errorData = JSON.parse(res.data);
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        // 解析失败，使用默认错误信息
      }
      throw new Error(errorMsg);
    }
  }).catch(error => {
    throw error;
  });
};
