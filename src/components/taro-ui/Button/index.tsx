import React from 'react';
import { AtButton } from 'taro-ui';
import { ButtonProps } from '@tarojs/components/types/Button';
import { CommonEvent } from '@tarojs/components/types/common';
import './index.scss';

interface TaroButtonProps {
  type?: 'primary' | 'secondary' | 'default';
  size?: 'normal' | 'small' | 'large';
  circle?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: (event: CommonEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const Button: React.FC<TaroButtonProps> = ({
  type = 'default',
  size = 'normal',
  circle = false,
  loading = false,
  disabled = false,
  onClick,
  className,
  style,
  children
}) => {
  // 转换为AtButton所需的类型
  let buttonType: "primary" | "secondary" | undefined = undefined;
  if (type === 'primary') buttonType = 'primary';
  if (type === 'secondary') buttonType = 'secondary';

  // 转换为AtButton所需的大小
  let buttonSize: "normal" | "small" = "normal";
  if (size === 'small') buttonSize = 'small';

  // 处理自定义样式，确保背景色和边框色可以被正确应用
  const mergedStyle = {
    ...style,
    '--button-primary-color': style?.backgroundColor,
  } as React.CSSProperties;

  return (
    <AtButton
      type={buttonType}
      size={buttonSize}
      circle={circle}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      className={`${className || ''} ${style?.backgroundColor ? 'custom-primary' : ''}`}
      customStyle={mergedStyle}
    >
      {children}
    </AtButton>
  );
};

export default Button; 