import { View } from '@tarojs/components'
import { Component } from 'react'
import './index.scss'

interface AuditProps {}

interface AuditState {}

export default class Audit extends Component<AuditProps, AuditState> {
  constructor(props: AuditProps) {
    super(props)
    this.state = {
      // 初始化状态
    }
  }

  render() {
    return (
      <View className='audit'>
        <View className='audit-content'>
          {/* TODO: 添加审核管理内容 */}
        </View>
      </View>
    )
  }
} 