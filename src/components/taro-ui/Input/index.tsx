import React from 'react';
import { AtInput } from 'taro-ui';
import Taro from '@tarojs/taro';
import { View, Input as TaroInput, Text } from '@tarojs/components';
import './index.scss';

interface InputProps {
  name: string;
  title?: string;
  type?: 'text' | 'number' | 'password' | 'phone' | 'idcard' | 'digit';
  placeholder?: string;
  value: string;
  error?: boolean;
  clear?: boolean;
  border?: boolean;
  disabled?: boolean;
  required?: boolean;
  onChange?: (value: string, event: any) => void;
  onFocus?: (event: any) => void;
  onBlur?: (event: any) => void;
  className?: string;
  style?: React.CSSProperties;
}

const InputComponent: React.FC<InputProps> = ({
  name,
  title,
  type = 'text',
  placeholder,
  value,
  error = false,
  clear = false,
  border = true,
  disabled = false,
  required = false,
  onChange,
  onFocus,
  onBlur,
  className,
  style
}) => {
  // 检查是否是微信小程序环境
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP;

  // 处理输入框变化
  const handleChange = (e: any): any => {
    const newValue = e.detail.value;
    if (onChange) {
      onChange(newValue, e);
    }
    return newValue;
  };

  // 在微信小程序环境下使用原生组件以确保兼容性
  if (isWeapp) {
    const containerClass = `custom-input ${error ? 'custom-input--error' : ''} ${className || ''}`;

    // 根据type类型设置password属性
    const isPassword = type === 'password';

    // 转换输入框类型为微信小程序支持的类型
    let inputType = type;
    if (type === 'password') {
      inputType = 'text';
    } else if (type === 'phone') {
      inputType = 'number';
    }

    return (
      <View className={containerClass} style={style}>
        {title && <Text className='custom-input__title'>{title}</Text>}
        <TaroInput
          name={name}
          type={inputType as any}
          password={isPassword}
          className='custom-input__input'
          value={value}
          placeholder={placeholder}
          placeholderClass='custom-input__placeholder'
          onInput={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
        />
        {clear && value && (
          <View className='custom-input__clear' onClick={() => onChange && onChange('', {} as any)}>×</View>
        )}
      </View>
    );
  }

  // 非微信环境则使用AtInput
  return (
    <AtInput
      name={name}
      title={title}
      type={type}
      placeholder={placeholder}
      value={value}
      error={error}
      clear={clear}
      border={border}
      disabled={disabled}
      required={required}
      onChange={(newValue: string, event: any) => {
        if (onChange) {
          onChange(newValue, event);
        }
        return newValue;
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      className={className}
      customStyle={{
        ...style,
        color: '#333',
        zIndex: 10,
      }}
    />
  );
};

export default InputComponent;
