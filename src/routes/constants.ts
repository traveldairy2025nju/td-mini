/**
 * 路由常量定义
 * 集中管理所有页面路径，避免硬编码
 */

// 标签页路由（在TabBar中显示的页面）
export const TAB_ROUTES = {
  HOME: '/pages/index/index',
  MY: '/pages/my/index'
};

// 普通页面路由
export const PAGE_ROUTES = {
  // 账户相关
  LOGIN: '/pages/login/index',
  REGISTER: '/pages/register/index',
  EDIT_NICKNAME: '/pages/edit-nickname/index',
  SETTINGS: '/pages/settings/index',
  
  // 日记相关
  CREATE_DIARY: '/pages/create-diary/index',
  DIARY_DETAIL: '/pages/diary/detail/index',
  EDIT_DIARY: '/pages/edit-diary/index',
  
  // 其他
  SEARCH: '/pages/search/index',
  CUSTOM_THEME: '/pages/custom-theme/index',
  THEME_SELECTOR: '/pages/theme-selector/index'
};

// 合并所有路由常量，便于导出
export const ROUTES = {
  ...TAB_ROUTES,
  ...PAGE_ROUTES
};

// 默认导出所有路由
export default ROUTES; 