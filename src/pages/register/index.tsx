import { View, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import FormInput from '../../components/FormInput'
import UserApi from '../../services/userApi'
import Validator from '../../utils/validator'
import './index.scss'

const RegisterPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })

  // 表单验证
  const validate = () => {
    const newErrors = {
      username: '',
      password: '',
      confirmPassword: ''
    }

    if (!username) {
      newErrors.username = '请输入用户名'
    } else if (!Validator.isValidUsername(username)) {
      newErrors.username = '用户名格式不正确'
    }

    if (!password) {
      newErrors.password = '请输入密码'
    } else if (!Validator.isValidPassword(password)) {
      newErrors.password = '密码长度应在6-20位之间'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return !newErrors.username && !newErrors.password && !newErrors.confirmPassword
  }

  // 处理注册
  const handleRegister = async () => {
    if (!validate()) return

    try {
      Taro.showLoading({ title: '注册中...' })
      const res = await UserApi.register({ username, password })
      
      if (res.success) {
        Taro.showToast({
          title: '注册成功',
          icon: 'success'
        })
        
        // 跳转到登录页
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (error) {
      Taro.showToast({
        title: '注册失败，请重试',
        icon: 'none'
      })
    } finally {
      Taro.hideLoading()
    }
  }

  // 返回登录页
  const goToLogin = () => {
    Taro.navigateBack()
  }

  return (
    <View className='register'>
      <View className='register__header'>
        <View className='register__title'>创建账号</View>
        <View className='register__subtitle'>注册一个旅行日记账号</View>
      </View>

      <View className='register__form'>
        <FormInput
          label='用户名'
          value={username}
          placeholder='请输入用户名'
          error={errors.username}
          onChange={setUsername}
        />

        <FormInput
          label='密码'
          type='password'
          value={password}
          placeholder='请输入密码'
          error={errors.password}
          onChange={setPassword}
        />

        <FormInput
          label='确认密码'
          type='password'
          value={confirmPassword}
          placeholder='请再次输入密码'
          error={errors.confirmPassword}
          onChange={setConfirmPassword}
        />

        <Button className='register__submit' onClick={handleRegister}>
          注册
        </Button>

        <View className='register__login' onClick={goToLogin}>
          已有账号？返回登录
        </View>
      </View>
    </View>
  )
}

export default RegisterPage 