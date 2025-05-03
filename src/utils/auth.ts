import Taro from '@tarojs/taro';

export interface UserInfo {
  _id: string;
  username: string;
  nickname: string;
  avatar: string;
  role: string;
  token?: string;
}

// 保存用户信息
export const setUserInfo = (userInfo: UserInfo) => {
  if (userInfo.token) {
    Taro.setStorageSync('token', userInfo.token);
  }
  Taro.setStorageSync('userInfo', JSON.stringify(userInfo));
};

// 获取用户信息
export const getUserInfo = (): UserInfo | null => {
  const userInfoStr = Taro.getStorageSync('userInfo');
  return userInfoStr ? JSON.parse(userInfoStr) : null;
};

// 清除用户信息
export const clearUserInfo = () => {
  Taro.removeStorageSync('token');
  Taro.removeStorageSync('userInfo');
};

// 检查用户是否已登录
export const isLoggedIn = (): boolean => {
  return !!Taro.getStorageSync('token');
};

// 检查是否有指定角色
export const hasRole = (role: string): boolean => {
  const userInfo = getUserInfo();
  return userInfo ? userInfo.role === role : false;
};

// 检查是否是管理员
export const isAdmin = (): boolean => {
  return hasRole('admin');
};

// 登出
export const logout = () => {
  clearUserInfo();
  Taro.reLaunch({ url: '/pages/login/index' });
};

// 检查登录状态，如未登录跳转到登录页
export const checkLogin = () => {
  if (!isLoggedIn()) {
    Taro.navigateTo({ url: '/pages/login/index' });
    return false;
  }
  return true;
}; 