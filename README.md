# 旅行日记小程序

基于 Taro 和 React 开发的微信小程序，用于记录和管理旅行日记。用户可以创建旅行日记、查看日记列表并分享旅行记忆。

## 功能特点

- 创建日记：添加包含标题、日期和内容的旅行日记
- 日记列表：以清晰的列表形式查看所有日记
- 本地存储：使用微信小程序存储持久化日记数据
- 响应式界面：基于 Taro 和 Sass 打造现代化、可定制的 UI
- 用户注册和登录
- 创建、编辑和删除游记
- 浏览他人游记
- 点赞和评论功能
- 游记收藏功能
- 个人资料管理

## 技术栈

- 框架：Taro 4.x（基于 React，使用 taro-hooks@2x 模板）
- 语言：TypeScript
- 样式：Sass
- 平台：微信小程序

## 环境要求

- Node.js：16.x 或更高版本
- 微信开发者工具：最新版本
- 微信小程序 AppID（可选）：从[微信公众平台](https://mp.weixin.qq.com/)获取

## 安装与运行

### 1. 克隆项目

```bash
git clone https://github.com/traveldairy2025nju/td-mini.git
cd td-mini
```

### 2. 安装依赖

```bash
npm install
```

如果遇到依赖冲突问题，可以尝试：

```bash
npm install --legacy-peer-deps
```

### 3. 配置本地环境

项目使用环境配置文件管理API地址等敏感信息。你需要创建本地环境配置文件：

```bash
# 复制示例环境配置文件
cp src/config/env.local.example.ts src/config/env.local.ts

# 编辑配置文件，修改为你的本地开发环境
# 例如修改 BASE_URL 为你的本地API服务器地址
```

> 注意：`env.local.ts` 文件包含个人开发环境配置，已添加到 `.gitignore`，不会被提交到代码仓库。

### 4. 启动开发服务器

```bash
npm run dev:weapp
```

此命令会启动 Taro 的开发服务器，并在 `dist` 目录下生成微信小程序代码。

### 5. 在微信开发者工具中预览

#### 5.1 打开微信开发者工具

- 下载并安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

#### 5.2 导入项目

1. 打开微信开发者工具
2. 点击左上角的【+】按钮，选择【导入项目】
3. 项目路径选择本项目的 `dist` 目录（例如：`D:\codes\travel_diary\td-mini\dist`）
4. AppID 选择：
   - 如果有自己的小程序 AppID，请填入
   - 如果没有，可以选择【使用测试号】
5. 点击【导入】完成项目导入

#### 5.3 预览和调试

- 导入成功后，开发者工具会自动编译和预览小程序
- 使用【编译】按钮可以刷新预览
- 使用【调试器】面板可以查看控制台输出和网络请求

#### 5.4 真机调试

1. 点击开发者工具顶部的【预览】按钮
2. 使用微信扫描生成的二维码
3. 在手机上体验小程序

## 项目结构

```
td-mini/
  ├── dist/                 # 编译后的代码（小程序代码）
  ├── src/                  # 源代码
  │   ├── pages/            # 页面组件
  │   ├── components/       # 通用组件
  │   ├── assets/           # 静态资源
  │   ├── config/           # 配置文件
  │   │   ├── env.ts        # 环境配置
  │   │   ├── env.local.example.ts # 本地环境配置示例
  │   │   └── env.local.ts  # 本地环境配置（需手动创建，不提交）
  │   ├── app.tsx           # 应用入口
  │   ├── app.config.ts     # 应用配置
  │   └── index.html        # H5 入口 HTML
  ├── config/               # Taro 配置
  ├── package.json          # 项目依赖
  └── README.md             # 项目说明
```

## 常见问题

### 1. 编译出错

如果遇到编译错误，可以尝试以下解决方法：

```bash
# 清理临时文件
rm -rf .temp dist

# 重新安装依赖
npm install --legacy-peer-deps

# 重新启动开发服务器
npm run dev:weapp
```

### 2. 导入微信开发者工具时提示"项目路径不存在"

- 确保已经运行 `npm run dev:weapp` 并成功生成了 `dist` 目录
- 检查导入时选择的路径是否正确指向 `dist` 目录

### 3. AppID 相关问题

如果需要使用完整功能（如云开发、支付等），需要：

1. 前往[微信公众平台](https://mp.weixin.qq.com/)注册小程序账号
2. 获取 AppID
3. 在 `project.config.json` 中更新 AppID

### 4. API 连接问题

如果无法连接到后端 API：

1. 检查 `src/config/env.local.ts` 中的 `BASE_URL` 是否正确
2. 确保 API 服务器正在运行并且可以访问

## 游记收藏功能实现

游记收藏功能允许用户收藏感兴趣的游记，便于后续查看。主要功能点包括：

1. 游记详情页展示收藏状态和收藏数
2. 用户可以收藏/取消收藏游记
3. "我的"页面可查看已收藏的游记列表

### 相关API

- `getDetailWithStatus`: 获取游记详情，包含点赞和收藏状态
- `favoriteDiary`: 收藏/取消收藏游记
- `getFavorites`: 获取当前用户收藏的游记列表

### 错误处理机制

为了提高用户体验，加入了多层错误处理和回退机制：

1. 当`with-status`接口失败时，回退到`with-like-status`接口
2. 当`with-like-status`接口也失败时，回退到基本的`getDetail`接口
3. 收藏操作失败时，UI会回滚到原状态，并显示友好错误提示

### 数据刷新机制

通过事件通知机制，确保不同页面之间的数据同步：

1. 收藏/取消收藏操作成功后，触发`refreshHomePage`和`refreshMyPage`事件
2. 首页和"我的"页面监听这些事件，及时刷新数据
