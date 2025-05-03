import React from 'react';
import { AtInput } from 'taro-ui';
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

const Input: React.FC<InputProps> = ({
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
  // 处理onChange事件
  const handleChange = (value: string, event): void => {
    if (onChange) {
      onChange(value, event);
    }
    return value;
  };

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
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      className={className}
      customStyle={style}
    />
  );
};

export default Input; 