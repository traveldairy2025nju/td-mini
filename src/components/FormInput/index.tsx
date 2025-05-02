import { View, Input } from '@tarojs/components'
import { FC } from 'react'
import './index.scss'

interface FormInputProps {
  label: string
  type?: 'text' | 'password' | 'number'
  value: string
  placeholder?: string
  error?: string
  onChange: (value: string) => void
  onBlur?: () => void
}

const FormInput: FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  placeholder,
  error,
  onChange,
  onBlur
}) => {
  return (
    <View className='form-input'>
      <View className='form-input__label'>{label}</View>
      <Input
        className={`form-input__input ${error ? 'form-input__input--error' : ''}`}
        type={type}
        value={value}
        placeholder={placeholder}
        onInput={e => onChange(e.detail.value)}
        onBlur={onBlur}
      />
      {error && <View className='form-input__error'>{error}</View>}
    </View>
  )
}

export default FormInput 