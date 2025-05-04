import { request } from './request';
import uploadApi from './uploadApi';

// 游记相关接口
const diaryApi = {
  // 获取已批准的游记列表
  getAll: (params = {}) => {
    return request({
      url: '/api/diaries',
      method: 'GET',
      data: params
    });
  },

  // 获取单个游记详情
  getDetail: (id) => {
    return request({
      url: `/api/diaries/${id}`,
      method: 'GET'
    });
  },

  // 创建游记
  create: async (data) => {
    // data包含：title, content, images 数组，可选 videoUrl
    return request({
      url: '/api/diaries',
      method: 'POST',
      data
    });
  },

  // 更新游记
  update: (id, data) => {
    return request({
      url: `/api/diaries/${id}`,
      method: 'PUT',
      data
    });
  },

  // 删除游记
  delete: (id) => {
    return request({
      url: `/api/diaries/${id}`,
      method: 'DELETE'
    });
  },

  // 获取当前用户的游记
  getUserDiaries: (params = {}) => {
    return request({
      url: '/api/diaries/user/me',
      method: 'GET',
      data: params
    });
  },

  // 上传图片并处理到游记创建/更新中
  uploadImage: async (filePath) => {
    try {
      const uploadRes = await uploadApi.uploadFile(filePath);
      if (!uploadRes.success || !uploadRes.data || !uploadRes.data.url) {
        throw new Error('图片上传失败');
      }
      return uploadRes.data.url;
    } catch (error) {
      console.error('图片上传错误:', error);
      throw error;
    }
  },

  // 上传视频并返回URL
  uploadVideo: async (filePath) => {
    try {
      const uploadRes = await uploadApi.uploadFile(filePath);
      if (!uploadRes.success || !uploadRes.data || !uploadRes.data.url) {
        throw new Error('视频上传失败');
      }
      return uploadRes.data.url;
    } catch (error) {
      console.error('视频上传错误:', error);
      throw error;
    }
  }
};

export default diaryApi;
