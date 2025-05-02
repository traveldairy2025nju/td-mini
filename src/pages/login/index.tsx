import { View, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import FormInput from '../../components/FormInput'
import UserApi from '../../services/userApi'
import Validator from '../../utils/validator'
import api from '../../services/api'
import './index.scss'

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({
    username: '',
    password: ''
  })

  // 表单验证
  const validate = () => {
    const newErrors = {
      username: '',
      password: ''
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

    setErrors(newErrors)
    return !newErrors.username && !newErrors.password
  }

  // 处理登录
  const handleLogin = async () => {
    if (!validate()) return

    try {
      Taro.showLoading({ title: '登录中...' })
      const res = await UserApi.login({ username, password })
      
      if (res.success && res.data?.token) {
        api.setToken(res.data.token)
        
        // 获取用户信息
        const userInfo = await UserApi.getProfile()
        if (userInfo.success) {
          // 存储用户信息
          Taro.setStorageSync('userInfo', userInfo.data)
          
          Taro.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          // 跳转到首页
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/home/index' })
          }, 1500)
        }
      }
    } catch (error) {
      Taro.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      Taro.hideLoading()
    }
  }

  // 跳转到注册页
  const goToRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  return (
    <View className='login'>
      <View className='login__header'>
        <View className='login__title'>欢迎回来</View>
        <View className='login__subtitle'>登录你的旅行日记账号</View>
      </View>

      <View className='login__form'>
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

        <Button className='login__submit' onClick={handleLogin}>
          登录
        </Button>

        <View className='login__register' onClick={goToRegister}>
          还没有账号？立即注册
        </View>
      </View>
    </View>
  )
}

export default LoginPage 