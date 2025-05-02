import { View } from '@tarojs/components'
import { Component } from 'react'
import './index.scss'

interface CreateDiaryProps {}

interface CreateDiaryState {}

export default class CreateDiary extends Component<CreateDiaryProps, CreateDiaryState> {
  constructor(props: CreateDiaryProps) {
    super(props)
    this.state = {
      // 初始化状态
    }
  }

  render() {
    return (
      <View className='create-diary'>
        <View className='create-diary-content'>
          {/* TODO: 添加创建日记表单 */}
        </View>
      </View>
    )
  }
} 