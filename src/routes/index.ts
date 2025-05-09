/**
 * 路由管理模块入口
 */
import router from './navigator';
import { ROUTES, TAB_ROUTES, PAGE_ROUTES } from './constants';

// 导出路由常量
export { ROUTES, TAB_ROUTES, PAGE_ROUTES };

// 导出导航方法
export {
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
  switchToMy,
  buildUrl,
  isTabBarPage
} from './navigator';

// 默认导出路由器
export default router; 