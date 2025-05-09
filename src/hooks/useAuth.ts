import { useCallback } from 'react';
import Taro from '@tarojs/taro';
import useUserStore from '../store/user';
import { 
  getUserInfo, 
  isLoggedIn as checkLoggedIn,
  hasRole as checkHasRole,
  isAdmin as checkIsAdmin,
  logout as doLogout,
  checkLogin as doCheckLogin,
  UserInfo
} from '../utils/auth';

interface UseAuthResult {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkLogin: () => boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthResult {
  const { 
    userInfo: storeUserInfo, 
    isLogin: storeIsLogin,
    isLoading,
    error,
    login, 
    logout 
  } = useUserStore();

  // 获取本地用户信息
  const userInfo = storeUserInfo || getUserInfo();
  const isLoggedIn = storeIsLogin || checkLoggedIn();

  // 检查是否有指定角色
  const hasRole = useCallback((role: string): boolean => {
    return checkHasRole(role);
  }, []);

  // 检查是否是管理员
  const isAdmin = checkIsAdmin();

  // 检查登录状态，如未登录跳转到登录页
  const checkLogin = useCallback((): boolean => {
    return doCheckLogin();
  }, []);

  return {
    isLoggedIn,
    userInfo,
    hasRole,
    isAdmin,
    login,
    logout: doLogout,
    checkLogin,
    isLoading,
    error
  };
} 