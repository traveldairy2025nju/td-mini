// 表单验证工具类
export default class Validator {
  // 验证用户名
  static isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_]{4,20}$/.test(username)
  }

  // 验证密码
  static isValidPassword(password: string): boolean {
    return password.length >= 6 && password.length <= 20
  }

  // 验证昵称
  static isValidNickname(nickname: string): boolean {
    return nickname.length >= 2 && nickname.length <= 20
  }

  // 验证手机号
  static isValidPhone(phone: string): boolean {
    return /^1[3-9]\d{9}$/.test(phone)
  }

  // 验证邮箱
  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // 验证图片格式
  static isValidImageFormat(fileName: string): boolean {
    return /\.(jpg|jpeg|png|gif)$/i.test(fileName)
  }

  // 验证视频格式
  static isValidVideoFormat(fileName: string): boolean {
    return /\.(mp4|mov|avi|wmv)$/i.test(fileName)
  }

  // 验证文件大小（MB）
  static isValidFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize * 1024 * 1024
  }
} 