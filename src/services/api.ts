import Taro from '@tarojs/taro';
import { getToken } from '../utils/auth';

// API基础URL
const BASE_URL = 'http://api.example.com'; // 请替换为实际的API地址

// 通用响应接口
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

// 文件上传响应
interface UploadResponse {
  url: string;
}

// 游记创建请求
interface CreateDiaryRequest {
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
}

// 游记详情
export interface DiaryDetail {
  id: string;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 游记列表项
export interface DiaryItem {
  id: string;
  title: string;
  coverImage: string;
  status: 'pending' | 'approved' | 'rejected';
  author: {
    id: string;
    nickname: string;
    avatar: string;
  };
  createdAt: string;
}

// 分页响应
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// 请求配置
function getRequestConfig() {
  const token = getToken();
  return {
    header: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };
}

// 通用请求方法
async function request<T>(url: string, options?: Taro.request.Option): Promise<ApiResponse<T>> {
  try {
    const config = {
      ...getRequestConfig(),
      ...options,
      url: `${BASE_URL}${url}`
    };

    const response = await Taro.request<ApiResponse<T>>(config);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        code: response.data.code
      };
    }

    return {
      success: false,
      message: response.data.message || '请求失败',
      code: response.data.code || response.statusCode
    };
  } catch (error) {
    console.error('请求出错', error);
    return {
      success: false,
      message: '网络错误，请稍后再试'
    };
  }
}

// 文件上传
export async function uploadFile(filePath: string): Promise<ApiResponse<UploadResponse>> {
  try {
    const token = getToken();
    const response = await Taro.uploadFile({
      url: `${BASE_URL}/api/upload`,
      filePath,
      name: 'file',
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      const data = JSON.parse(response.data);
      return {
        success: true,
        data: {
          url: data.url || ''
        }
      };
    }

    return {
      success: false,
      message: '上传失败',
      code: response.statusCode
    };
  } catch (error) {
    console.error('上传文件出错', error);
    return {
      success: false,
      message: '上传失败，请稍后再试'
    };
  }
}

// 创建游记
export async function createDiary(data: CreateDiaryRequest): Promise<ApiResponse> {
  return request('/api/diaries', {
    method: 'POST',
    data
  });
}

// 获取游记列表
export async function getDiaries(
  params?: { page?: number; limit?: number; keyword?: string }
): Promise<ApiResponse<PaginatedResponse<DiaryItem>>> {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  return request(`/api/diaries${query}`);
}

// 获取游记详情
export async function getDiaryDetail(id: string): Promise<ApiResponse<DiaryDetail>> {
  return request(`/api/diaries/${id}`);
}

// 获取当前用户的游记
export async function getUserDiaries(
  status?: 'pending' | 'approved' | 'rejected',
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<DiaryItem>>> {
  const queryParams = { ...params };
  if (status) {
    queryParams['status'] = status;
  }

  const query = Object.keys(queryParams).length > 0
    ? `?${new URLSearchParams(queryParams as any).toString()}`
    : '';

  return request(`/api/diaries/user/me${query}`);
}

// 更新游记
export async function updateDiary(id: string, data: Partial<CreateDiaryRequest>): Promise<ApiResponse> {
  return request(`/api/diaries/${id}`, {
    method: 'PUT',
    data
  });
}

// 删除游记
export async function deleteDiary(id: string): Promise<ApiResponse> {
  return request(`/api/diaries/${id}`, {
    method: 'DELETE'
  });
}

// 导出API
export const api = {
  diary: {
    create: createDiary,
    list: getDiaries,
    detail: getDiaryDetail,
    getUserDiaries,
    update: updateDiary,
    delete: deleteDiary
  },
  upload: uploadFile
};
