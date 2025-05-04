import userApi from './userApi';
import diaryApi from './diaryApi';
import uploadApi from './uploadApi';

// 整合所有API
const api = {
  user: userApi,
  diary: diaryApi,
  upload: uploadApi
};

export default api;
