import { View } from '@tarojs/components'
import { Component } from 'react'
import './index.scss'
import { HomeProps, HomeState } from './types'

export default class HomePage extends Component<HomeProps, HomeState> {
  constructor(props: HomeProps) {
    super(props)
    this.state = {
      // 初始化状态
    }
  }

  render() {
    return (
      <View className='home-page'>
        <View className='home-content'>
          {/* TODO: 添加页面内容 */}
        </View>
      </View>
    )
  }
} 