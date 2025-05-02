import api from './api'
import { HttpMethod } from './api'
import Taro from '@tarojs/taro'

// 用户相关接口
export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  nickname: string
  avatar?: string
}

export interface UserProfile {
  _id: string
  username: string
  nickname: string
  avatar: string
  role: string
}

class UserApi {
  // 登录
  static async login(params: LoginParams) {
    return api.request({
      url: '/users/login',
      method: HttpMethod.POST,
      data: params
    })
  }

  // 注册
  static async register(params: RegisterParams) {
    // 如果有头像，需要先上传
    let avatar = ''
    if (params.avatar) {
      try {
        const res = await Taro.uploadFile({
          url: '/api/upload', // 替换为实际的上传接口
          filePath: params.avatar,
          name: 'avatar'
        })
        avatar = JSON.parse(res.data).url
      } catch (error) {
        console.error('头像上传失败:', error)
        throw error
      }
    }

    return api.request({
      url: '/users/register',
      method: HttpMethod.POST,
      data: {
        ...params,
        avatar
      }
    })
  }

  // 获取用户信息
  static async getProfile() {
    return api.request<UserProfile>({
      url: '/users/profile',
      method: HttpMethod.GET
    })
  }

  // 更新头像
  static async updateAvatar(filePath: string) {
    return Taro.uploadFile({
      url: '/api/users/avatar',
      filePath,
      name: 'avatar',
      header: {
        'Authorization': `Bearer ${api.getToken()}`
      }
    })
  }

  // 更新昵称
  static async updateNickname(nickname: string) {
    return api.request({
      url: '/users/nickname',
      method: HttpMethod.PUT,
      data: { nickname }
    })
  }
}

export default UserApi 