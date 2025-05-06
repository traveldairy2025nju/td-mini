import { Textarea as TaroTextarea } from '@tarojs/components';
import { CSSProperties } from 'react';
import './index.scss';

interface TextareaProps {
  className?: string;
  style?: CSSProperties;
  value: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onInput?: (event: { detail: { value: string } }) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

function Textarea(props: TextareaProps) {
  const {
    className = '',
    style,
    value,
    placeholder,
    maxLength,
    disabled,
    autoFocus,
    onInput,
    onFocus,
    onBlur
  } = props;

  return (
    <TaroTextarea
      className={`td-textarea ${className}`}
      style={style}
      value={value}
      placeholder={placeholder}
      maxlength={maxLength}
      disabled={disabled}
      autoFocus={autoFocus}
      onInput={onInput}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

export default Textarea; 