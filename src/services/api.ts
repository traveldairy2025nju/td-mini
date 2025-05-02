import Taro from '@tarojs/taro'

// API基础URL
const BASE_URL = 'http://localhost:3000/api'

// 请求方法枚举
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

// 请求配置接口
interface RequestConfig {
  url: string
  method: HttpMethod
  data?: any
  header?: Record<string, string>
}

// 统一响应格式
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
}

// API服务类
class ApiService {
  private static instance: ApiService
  private token: string = ''

  private constructor() {}

  // 单例模式获取实例
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  // 设置token
  public setToken(token: string) {
    this.token = token
    // 保存token到本地存储
    Taro.setStorageSync('token', token)
  }

  // 获取token
  public getToken(): string {
    if (!this.token) {
      this.token = Taro.getStorageSync('token') || ''
    }
    return this.token
  }

  // 清除token
  public clearToken() {
    this.token = ''
    Taro.removeStorageSync('token')
  }

  // 请求拦截器
  private interceptRequest(config: RequestConfig): RequestConfig {
    const token = this.getToken()
    if (token) {
      config.header = {
        ...config.header,
        'Authorization': `Bearer ${token}`
      }
    }
    return config
  }

  // 响应拦截器
  private interceptResponse(response: any): any {
    // 处理401未授权的情况
    if (response.statusCode === 401) {
      this.clearToken()
      Taro.navigateTo({ url: '/pages/login/index' })
      return Promise.reject(new Error('未授权，请重新登录'))
    }
    return response.data
  }

  // 统一请求方法
  public async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      const interceptedConfig = this.interceptRequest(config)
      const response = await Taro.request({
        url: `${BASE_URL}${config.url}`,
        method: config.method,
        data: config.data,
        header: interceptedConfig.header
      })
      return this.interceptResponse(response)
    } catch (error) {
      Taro.showToast({
        title: '网络请求失败',
        icon: 'none'
      })
      return Promise.reject(error)
    }
  }
}

export default ApiService.getInstance()
