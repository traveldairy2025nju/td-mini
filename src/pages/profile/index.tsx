import { View } from '@tarojs/components'
import { Component } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface UserInfo {
  id: string
  username: string
  nickname?: string
  avatar?: string
  role: 'user' | 'admin'
  createdAt: string
}

interface ProfileState {
  userInfo: UserInfo | null
  loading: boolean
}

export default class Profile extends Component<{}, ProfileState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      userInfo: null,
      loading: true
    }
  }

  componentDidMount() {
    this.loadUserInfo()
  }

  // 加载用户信息
  loadUserInfo = () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo')
      if (userInfo) {
        this.setState({
          userInfo,
          loading: false
        })
      } else {
        // 如果本地没有用户信息，跳转到登录页
        Taro.navigateTo({ url: '/pages/login/index' })
      }
    } catch (error) {
      Taro.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      })
    }
  }

  // 处理退出登录
  handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息和token
          Taro.removeStorageSync('userInfo')
          Taro.removeStorageSync('token')
          // 跳转到登录页
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      }
    })
  }

  render() {
    const { userInfo, loading } = this.state

    if (loading) {
      return (
        <View className='profile-loading'>
          <View className='loading'>加载中...</View>
        </View>
      )
    }

    return (
      <View className='profile'>
        {/* 用户基本信息卡片 */}
        <View className='profile-card'>
          <View className='avatar'>
            <View className='avatar-image' style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#eee',
              backgroundImage: `url(${userInfo?.avatar || '/assets/images/default-avatar.png'})`,
              backgroundSize: 'cover'
            }} />
          </View>
          <View className='info'>
            <View className='nickname'>{userInfo?.nickname || userInfo?.username}</View>
            <View className='role'>{userInfo?.role === 'admin' ? '管理员' : '普通用户'}</View>
          </View>
        </View>

        {/* 功能列表 */}
        <View className='profile-list'>
          <View className='list-item' onClick={() => Taro.navigateTo({ url: '/pages/profile/edit/index' })}>
            <View className='title'>个人资料</View>
            <View className='arrow'>{'>'}</View>
          </View>
          <View className='list-item' onClick={() => Taro.navigateTo({ url: '/pages/profile/favorites/index' })}>
            <View className='title'>我的收藏</View>
            <View className='arrow'>{'>'}</View>
          </View>
          <View className='list-item' onClick={() => Taro.navigateTo({ url: '/pages/about/index' })}>
            <View className='title'>关于我们</View>
            <View className='arrow'>{'>'}</View>
          </View>
        </View>

        {/* 退出登录按钮 */}
        <View className='logout-btn' onClick={this.handleLogout}>
          退出登录
        </View>
      </View>
    )
  }
} 