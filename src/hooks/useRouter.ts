import { useCallback } from 'react';
import { useRouter as useTaroRouter } from '@tarojs/taro';
import router, { ROUTES, TAB_ROUTES, RouteParams } from '../routes';

/**
 * 路由钩子接口
 */
interface UseRouterResult {
  // 路由参数
  params: Record<string, string>;
  path: string;
  
  // 导航方法
  navigateTo: (url: string, params?: RouteParams) => Promise<TaroGeneral.CallbackResult>;
  switchTab: (url: string) => Promise<TaroGeneral.CallbackResult>;
  redirectTo: (url: string, params?: RouteParams) => Promise<TaroGeneral.CallbackResult>;
  reLaunch: (url: string, params?: RouteParams) => Promise<TaroGeneral.CallbackResult>;
  navigateBack: (delta?: number) => Promise<TaroGeneral.CallbackResult>;
  
  // 便捷导航方法
  toDiaryDetail: (id: string) => Promise<TaroGeneral.CallbackResult>;
  toEditDiary: (id: string) => Promise<TaroGeneral.CallbackResult>;
  toCreateDiary: () => Promise<TaroGeneral.CallbackResult>;
  toLogin: () => Promise<TaroGeneral.CallbackResult>;
  toHome: () => Promise<TaroGeneral.CallbackResult>;
  toMy: () => Promise<TaroGeneral.CallbackResult>;
  
  // 工具方法
  isTabBarPage: (url: string) => boolean;
  
  // 路由常量
  ROUTES: typeof ROUTES;
  TAB_ROUTES: typeof TAB_ROUTES;
}

/**
 * 路由管理Hook
 * 
 * 提供路由参数访问和导航方法
 */
export function useRouter(): UseRouterResult {
  // 获取Taro路由参数
  const taroRouter = useTaroRouter();
  const params = taroRouter?.params || {};
  const path = taroRouter?.path || '';
  
  // 简化后的导航方法
  const navigateTo = useCallback(router.navigateTo, []);
  const switchTab = useCallback(router.switchTab, []);
  const redirectTo = useCallback(router.redirectTo, []);
  const reLaunch = useCallback(router.reLaunch, []);
  const navigateBack = useCallback(router.navigateBack, []);
  
  // 页面特定导航方法
  const toDiaryDetail = useCallback(router.navigateToDiaryDetail, []);
  const toEditDiary = useCallback(router.navigateToEditDiary, []);
  const toCreateDiary = useCallback(router.navigateToCreateDiary, []);
  const toLogin = useCallback(router.navigateToLogin, []);
  const toHome = useCallback(router.switchToHome, []);
  const toMy = useCallback(router.switchToMy, []);
  
  // 判断是否TabBar页面
  const isTabBarPage = useCallback(router.isTabBarPage, []);
  
  return {
    // 路由参数
    params,
    path,
    
    // 导航方法
    navigateTo,
    switchTab,
    redirectTo,
    reLaunch,
    navigateBack,
    
    // 便捷导航方法
    toDiaryDetail,
    toEditDiary,
    toCreateDiary,
    toLogin,
    toHome,
    toMy,
    
    // 工具方法
    isTabBarPage,
    
    // 路由常量
    ROUTES,
    TAB_ROUTES
  };
} 