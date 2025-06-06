import { getThemeColors } from './utils/themeManager';

// 获取当前主题色
const currentTheme = getThemeColors();

export default {
  pages: [
    "pages/index/index",
    "pages/login/index",
    "pages/register/index",
    "pages/my/index",
    "pages/edit-nickname/index",
    "pages/settings/index",
    "pages/create-diary/index",
    "pages/diary/detail/index",
    "pages/search/index",
    "pages/custom-theme/index",
    "pages/edit-diary/index",
    "pages/theme-selector/index"
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "旅行日记",
    navigationBarTextStyle: "black",
  },
  tabBar: {
    custom: true,
    color: "#999",
    selectedColor: currentTheme.primaryColor,
    backgroundColor: "#fff",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/index/index",
        text: "首页",
        iconPath: "./assets/icons/home.png",
        selectedIconPath: "./assets/icons/home-active.png"
      },
      {
        pagePath: "pages/my/index",
        text: "我的",
        iconPath: "./assets/icons/user.png",
        selectedIconPath: "./assets/icons/user-active.png"
      }
    ]
  },
  // 添加位置相关隐私权限声明
  requiredPrivateInfos: [
    "chooseLocation",
    "getLocation"
  ],
  permission: {
    "scope.userLocation": {
      desc: "您的位置信息将用于添加游记位置标记"
    }
  }
};
