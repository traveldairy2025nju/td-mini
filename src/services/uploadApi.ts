import { uploadFile } from './request';

// 文件上传相关接口
const uploadApi = {
  // 通用文件上传接口
  uploadFile: (filePath) => {
    return uploadFile({
      url: '/api/upload',
      filePath,
      name: 'file'
    });
  }
};

export default uploadApi;
