import { request, uploadFile } from './request';

// 游记相关接口
const diaryApi = {
  // 获取用户所有游记
  getAll: () => {
    return request({
      url: '/api/diaries'
    });
  },
  
  // 获取单个游记详情
  getDetail: (id) => {
    return request({
      url: `/api/diaries/${id}`
    });
  },
  
  // 创建游记
  create: (data, files) => {
    if (files && files.cover) {
      return uploadFile({
        url: '/api/diaries',
        method: 'POST',
        filePath: files.cover,
        name: 'cover',
        formData: data
      });
    } else {
      return request({
        url: '/api/diaries',
        method: 'POST',
        data
      });
    }
  },
  
  // 更新游记
  update: (id, data, files) => {
    if (files && files.cover) {
      return uploadFile({
        url: `/api/diaries/${id}`,
        method: 'PUT',
        filePath: files.cover,
        name: 'cover',
        formData: data
      });
    } else {
      return request({
        url: `/api/diaries/${id}`,
        method: 'PUT',
        data
      });
    }
  },
  
  // 删除游记
  delete: (id) => {
    return request({
      url: `/api/diaries/${id}`,
      method: 'DELETE'
    });
  },
  
  // 上传游记照片
  uploadPhoto: (diaryId, filePath, description) => {
    return uploadFile({
      url: `/api/diaries/${diaryId}/photos`,
      filePath,
      name: 'photo',
      formData: { description }
    });
  }
};

export default diaryApi; 