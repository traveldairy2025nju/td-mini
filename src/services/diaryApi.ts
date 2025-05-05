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

  // 获取游记详情（包含点赞状态）
  getDetailWithLikeStatus: (id) => {
    console.log(`diaryApi.getDetailWithLikeStatus - 请求游记ID: ${id}`);
    return request({
      url: `/api/diaries/${id}/with-like-status`,
      method: 'GET',
      data: { _t: Date.now() }
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
    const params: any = status && status !== 'all' ? { status } : {};

    // 添加时间戳避免缓存
    params._t = Date.now();

    console.log('diaryApi.getUserDiaries - 查询参数:', params);

    return request({
      url: '/api/diaries/user/me',
      method: 'GET',
      data: params
    });
  },

  // 搜索游记
  searchDiaries: (keyword, page = 1, limit = 10) => {
    console.log('diaryApi.searchDiaries - 关键词:', keyword);
    return request({
      url: '/api/diaries/search',
      method: 'GET',
      data: { keyword, page, limit }
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
  },

  // 点赞/取消点赞游记
  likeDiary: (diaryId) => {
    console.log('点赞/取消点赞 - 游记ID:', diaryId);
    return request({
      url: '/api/diaries/like',
      method: 'POST',
      data: { diaryId }
    });
  },

  // 添加评论
  addComment: (diaryId: string, content: string, parentCommentId?: string | null) => {
    const data: { diaryId: string; content: string; parentCommentId?: string } = { diaryId, content };
    if (parentCommentId) {
      data.parentCommentId = parentCommentId;
    }

    return request({
      url: '/api/diaries/comment',
      method: 'POST',
      data
    });
  },

  // 获取游记评论
  getComments: (diaryId, params = {}) => {
    return request({
      url: `/api/diaries/${diaryId}/comments`,
      method: 'GET',
      data: params
    });
  },

  // 获取游记评论（带点赞状态）
  getCommentsWithLikeStatus: (diaryId, page = 1, limit = 10) => {
    return request({
      url: `/api/diaries/${diaryId}/comments-with-like-status`,
      method: 'GET',
      data: {
        page,
        limit,
        _t: Date.now() // 添加时间戳避免缓存
      }
    });
  },

  // 点赞/取消点赞评论
  likeComment: (commentId) => {
    console.log('点赞/取消点赞评论 - 评论ID:', commentId);
    return request({
      url: '/api/diaries/comment/like',
      method: 'POST',
      data: { commentId }
    });
  },

  // 删除评论
  deleteComment: (commentId) => {
    console.log('删除评论 - 评论ID:', commentId);
    return request({
      url: `/api/diaries/comment/${commentId}`,
      method: 'DELETE'
    });
  }
};

export default diaryApi;
