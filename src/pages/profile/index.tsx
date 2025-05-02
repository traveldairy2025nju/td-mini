import { View } from '@tarojs/components'
import { Component } from 'react'
import './index.scss'

interface ProfileProps {}

interface ProfileState {}

export default class Profile extends Component<ProfileProps, ProfileState> {
  constructor(props: ProfileProps) {
    super(props)
    this.state = {
      // 初始化状态
    }
  }

  render() {
    return (
      <View className='profile'>
        <View className='profile-content'>
          {/* TODO: 添加个人中心内容 */}
        </View>
      </View>
    )
  }
} 