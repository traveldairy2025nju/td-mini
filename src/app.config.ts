export default {
  pages: [
    "pages/index/index",
    "pages/login/index",
    "pages/register/index",
    "pages/my/index",
    "pages/edit-nickname/index",
    "pages/settings/index"
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "旅行日记",
    navigationBarTextStyle: "black",
  },
  tabBar: {
    color: "#999",
    selectedColor: "#1296db",
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
  }
};
