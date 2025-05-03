import { View, Text, Input } from '@tarojs/components';
import { AtIcon } from 'taro-ui';
import './index.scss';

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  type?: 'text' | 'password' | 'number' | 'idcard' | 'digit';
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: string;
  onChange: (name: string, value: string) => void;
}

function InputField({ 
  label, 
  name, 
  value, 
  type = 'text', 
  placeholder = '', 
  required = false, 
  error = '',
  icon,
  onChange 
}: InputFieldProps) {
  const handleChange = (e) => {
    onChange(name, e.detail.value);
  };

  return (
    <View className='input-field'>
      <View className='input-field__label'>
        {required && <Text className='input-field__required'>*</Text>}
        <Text>{label}</Text>
      </View>
      
      <View className={`input-field__input-container ${error ? 'input-field__input-container--error' : ''}`}>
        {icon && <AtIcon value={icon} className='input-field__icon' size='18' />}
        <Input
          className='input-field__input'
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          onInput={handleChange}
        />
      </View>
      
      {error && (
        <View className='input-field__error'>
          <Text>{error}</Text>
        </View>
      )}
    </View>
  );
}

export default InputField; 