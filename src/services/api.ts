import userApi from './userApi';
import diaryApi from './diaryApi';
import uploadApi from './uploadApi';
import locationApi from './locationApi';

// 整合所有API
const api = {
  user: userApi,
  diary: diaryApi,
  upload: uploadApi,
  location: locationApi
};

export default api;
