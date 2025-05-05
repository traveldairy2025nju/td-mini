import { Component } from 'react';
import type { PropsWithChildren } from 'react';
import { applyTheme } from './utils/themeManager';
import './app.scss';

// 初始化主题
applyTheme();

class App extends Component<PropsWithChildren> {
  componentDidMount() {}

  componentDidShow() {}

  componentDidHide() {}

  // 全局分享配置
  onShareAppMessage() {
    return {
      title: '旅行日记',
      path: '/pages/index/index'
    };
  }

  // this.props.children 是将要会渲染的页面
  render() {
    return this.props.children;
  }
}

export default App;
