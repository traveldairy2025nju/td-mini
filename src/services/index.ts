import userApi from './userApi';
import diaryApi from './diaryApi';

// 整合所有API
const api = {
  user: userApi,
  diary: diaryApi
};

export default api;
