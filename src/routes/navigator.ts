import Taro from '@tarojs/taro';
import { ROUTES, TAB_ROUTES } from './constants';

/**
 * 路由参数接口
 */
export interface RouteParams {
  [key: string]: string | number;
}

/**
 * 构建带参数的URL
 * @param url 基础URL
 * @param params 参数对象
 * @returns 完整URL字符串
 */
export const buildUrl = (url: string, params?: RouteParams): string => {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }
  
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
    
  return `${url}?${queryString}`;
};

/**
 * 检查是否为TabBar页面
 * @param url 页面URL
 * @returns 是否为TabBar页面
 */
export const isTabBarPage = (url: string): boolean => {
  return Object.values(TAB_ROUTES).some(route => url === route || url.startsWith(`${route}?`));
};

/**
 * 普通页面导航
 * @param url 目标URL或ROUTES中的路由常量
 * @param params 可选参数对象
 */
export const navigateTo = (url: string, params?: RouteParams): Promise<TaroGeneral.CallbackResult> => {
  const fullUrl = buildUrl(url, params);
  return Taro.navigateTo({ url: fullUrl });
};

/**
 * TabBar页面切换
 * @param url 目标URL或TAB_ROUTES中的路由常量
 */
export const switchTab = (url: string): Promise<TaroGeneral.CallbackResult> => {
  if (!isTabBarPage(url)) {
    console.warn(`警告: "${url}" 不是TabBar页面，但尝试使用switchTab导航。将使用navigateTo代替。`);
    return navigateTo(url);
  }
  return Taro.switchTab({ url });
};

/**
 * 重定向到页面（关闭当前页面）
 * @param url 目标URL或ROUTES中的路由常量
 * @param params 可选参数对象
 */
export const redirectTo = (url: string, params?: RouteParams): Promise<TaroGeneral.CallbackResult> => {
  // TabBar页面不能使用redirectTo，需要使用switchTab
  if (isTabBarPage(url)) {
    console.warn(`警告: "${url}" 是TabBar页面，不能使用redirectTo。将使用switchTab代替。`);
    return switchTab(url);
  }
  
  const fullUrl = buildUrl(url, params);
  return Taro.redirectTo({ url: fullUrl });
};

/**
 * 重启应用并打开页面
 * @param url 目标URL或ROUTES中的路由常量
 * @param params 可选参数对象
 */
export const reLaunch = (url: string, params?: RouteParams): Promise<TaroGeneral.CallbackResult> => {
  const fullUrl = buildUrl(url, params);
  return Taro.reLaunch({ url: fullUrl });
};

/**
 * 页面返回
 * @param delta 返回的页面数
 */
export const navigateBack = (delta: number = 1): Promise<TaroGeneral.CallbackResult> => {
  return Taro.navigateBack({ delta });
};

/**
 * 导航到日记详情页
 * @param id 日记ID
 */
export const navigateToDiaryDetail = (id: string): Promise<TaroGeneral.CallbackResult> => {
  return navigateTo(ROUTES.DIARY_DETAIL, { id });
};

/**
 * 导航到编辑日记页
 * @param id 日记ID
 */
export const navigateToEditDiary = (id: string): Promise<TaroGeneral.CallbackResult> => {
  return navigateTo(ROUTES.EDIT_DIARY, { id });
};

/**
 * 导航到创建日记页
 */
export const navigateToCreateDiary = (): Promise<TaroGeneral.CallbackResult> => {
  return navigateTo(ROUTES.CREATE_DIARY);
};

/**
 * 导航到登录页
 */
export const navigateToLogin = (): Promise<TaroGeneral.CallbackResult> => {
  return navigateTo(ROUTES.LOGIN);
};

/**
 * 导航到首页
 */
export const switchToHome = (): Promise<TaroGeneral.CallbackResult> => {
  return switchTab(TAB_ROUTES.HOME);
};

/**
 * 导航到个人中心
 */
export const switchToMy = (): Promise<TaroGeneral.CallbackResult> => {
  return switchTab(TAB_ROUTES.MY);
};

// 导出所有导航函数
export const router = {
  navigateTo,
  switchTab,
  redirectTo,
  reLaunch,
  navigateBack,
  navigateToDiaryDetail,
  navigateToEditDiary,
  navigateToCreateDiary,
  navigateToLogin,
  switchToHome,
  switchToMy
};

export default router; 