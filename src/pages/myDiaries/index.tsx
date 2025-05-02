import { View } from '@tarojs/components'
import { Component } from 'react'
import './index.scss'

interface MyDiariesProps {}

interface MyDiariesState {}

export default class MyDiaries extends Component<MyDiariesProps, MyDiariesState> {
  constructor(props: MyDiariesProps) {
    super(props)
    this.state = {
      // 初始化状态
    }
  }

  render() {
    return (
      <View className='my-diaries'>
        <View className='my-diaries-content'>
          {/* TODO: 添加页面内容 */}
        </View>
      </View>
    )
  }
} 