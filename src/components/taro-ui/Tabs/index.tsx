import React, { useState } from 'react';
import { AtTabs, AtTabsPane } from 'taro-ui';
import './index.scss';

export interface TabItem {
  title: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabList: TabItem[];
  current?: number;
  height?: number;
  swipeable?: boolean;
  animated?: boolean;
  tabDirection?: 'horizontal' | 'vertical';
  scroll?: boolean;
  onChange?: (index: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

const Tabs: React.FC<TabsProps> = ({
  tabList,
  current = 0,
  height,
  swipeable = true,
  animated = true,
  tabDirection = 'horizontal',
  scroll = false, 
  onChange,
  className,
  style
}) => {
  const [currentTab, setCurrentTab] = useState<number>(current);
  
  // 处理tab切换
  const handleClick = (index: number): void => {
    setCurrentTab(index);
    if (onChange) {
      onChange(index);
    }
  };
  
  // 将tabList转换为AtTabs所需的格式
  const taroTabList = tabList.map(item => ({ title: item.title }));
  
  return (
    <AtTabs
      current={currentTab}
      tabList={taroTabList}
      height={`${height}px`}
      swipeable={swipeable}
      animated={animated}
      tabDirection={tabDirection}
      scroll={scroll}
      onClick={handleClick}
      className={className}
      customStyle={style}
    >
      {tabList.map((item, index) => (
        <AtTabsPane current={currentTab} index={index} key={index}>
          {item.content}
        </AtTabsPane>
      ))}
    </AtTabs>
  );
};

export default Tabs; 