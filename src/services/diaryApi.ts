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
    console.log(`diaryApi.getDetail - 请求游记ID: ${id}`);
    return request({
      url: `/api/diaries/${id}`,
      method: 'GET'
    });
  },

  // 创建游记
  create: async (data) => {
    // data包含：title, content, images 数组，可选 videoUrl

    // 如果客户端使用videoUrl字段，但服务器使用video字段，需要转换
    const apiData = { ...data };
    if (apiData.videoUrl !== undefined) {
      apiData.video = apiData.videoUrl;
      delete apiData.videoUrl;
    }

    console.log('diaryApi.create - 提交的数据:', apiData);

    return request({
      url: '/api/diaries',
      method: 'POST',
      data: apiData
    });
  },

  // 更新游记
  update: (id, data) => {
    // 如果客户端使用videoUrl字段，但服务器使用video字段，需要转换
    const apiData = { ...data };
    if (apiData.videoUrl !== undefined) {
      apiData.video = apiData.videoUrl;
      delete apiData.videoUrl;
    }

    return request({
      url: `/api/diaries/${id}`,
      method: 'PUT',
      data: apiData
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
  getUserDiaries: (status?: 'all' | 'pending' | 'approved' | 'rejected') => {
    console.log('diaryApi.getUserDiaries - 状态过滤:', status);

    // 构建查询参数
    const params = status && status !== 'all' ? { status } : {};

    console.log('diaryApi.getUserDiaries - 查询参数:', params);

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
