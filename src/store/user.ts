import { create } from 'zustand';
import api from '../services';
import { UserInfo, setUserInfo as setUserInfoUtil, clearUserInfo } from '../utils/auth';

type UserState = {
  userInfo: UserInfo | null;
  isLogin: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 登录方法
  login: (username: string, password: string) => Promise<boolean>;
  
  // 注册方法
  register: (data: any, files?: any) => Promise<boolean>;
  
  // 更新用户信息
  updateProfile: () => Promise<void>;
  
  // 更新头像
  updateAvatar: (filePath: string) => Promise<boolean>;
  
  // 更新昵称
  updateNickname: (nickname: string) => Promise<boolean>;
  
  // 退出登录
  logout: () => void;
  
  // 设置用户信息
  setUserInfo: (userInfo: UserInfo) => void;
};

// 创建用户状态管理
const useUserStore = create<UserState>((set, get) => ({
  userInfo: null,
  isLogin: false,
  isLoading: false,
  error: null,
  
  // 登录方法
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.user.login({ username, password });
      
      if (res.success) {
        // 获取用户信息
        const profileRes = await api.user.getUserProfile();
        if (profileRes.success) {
          const userInfo = {
            ...profileRes.data,
            token: res.data.token
          };
          
          // 保存用户信息
          setUserInfoUtil(userInfo);
          set({ userInfo, isLogin: true, isLoading: false });
          return true;
        }
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : '登录失败' 
      });
      return false;
    }
  },
  
  // 注册方法
  register: async (data, files) => {
    set({ isLoading: true, error: null });
    try {
      // 调用注册API，传入用户数据和头像文件路径（如果有）
      const avatarFilePath = files?.avatar;
      const res = await api.user.register(data, avatarFilePath);
      
      if (res.success) {
        // 保存用户信息
        const userInfo = res.data.user || res.data;
        setUserInfoUtil(userInfo);
        set({ userInfo, isLogin: true, isLoading: false });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : '注册失败' 
      });
      return false;
    }
  },
  
  // 更新用户信息
  updateProfile: async () => {
    try {
      const res = await api.user.getUserProfile();
      if (res.success) {
        const userInfo = {
          ...res.data,
          token: get().userInfo?.token
        };
        
        // 更新用户信息
        setUserInfoUtil(userInfo);
        set({ userInfo, isLogin: true });
      }
    } catch (error) {
      // 错误处理
    }
  },
  
  // 更新头像
  updateAvatar: async (filePath) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.user.updateAvatar(filePath);
      
      if (res.success) {
        // 更新状态
        const userInfo = get().userInfo;
        if (userInfo) {
          // 确保从响应中获取新头像URL
          const avatar = res.data && res.data.avatar ? res.data.avatar : userInfo.avatar;
          const updatedUserInfo = {
            ...userInfo,
            avatar
          };
          setUserInfoUtil(updatedUserInfo);
          set({ userInfo: updatedUserInfo, isLoading: false });
        }
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('头像更新错误:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : '更新头像失败' 
      });
      return false;
    }
  },
  
  // 更新昵称
  updateNickname: async (nickname) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.user.updateNickname(nickname);
      
      if (res.success) {
        // 更新状态
        const userInfo = get().userInfo;
        if (userInfo) {
          const updatedUserInfo = {
            ...userInfo,
            nickname
          };
          setUserInfoUtil(updatedUserInfo);
          set({ userInfo: updatedUserInfo, isLoading: false });
        }
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : '更新昵称失败' 
      });
      return false;
    }
  },
  
  // 退出登录
  logout: () => {
    clearUserInfo();
    set({ userInfo: null, isLogin: false });
  },
  
  // 设置用户信息
  setUserInfo: (userInfo) => {
    setUserInfoUtil(userInfo);
    set({ userInfo, isLogin: true });
  }
}));

export default useUserStore; 