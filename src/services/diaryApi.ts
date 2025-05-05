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

  // 获取游记详情（包含点赞和收藏状态）
  getDetailWithStatus: (id) => {
    console.log(`diaryApi.getDetailWithStatus - 请求游记ID: ${id}`);
    return request({
      url: `/api/diaries/${id}/with-status`,
      method: 'GET',
      data: { _t: Date.now() } // 添加时间戳避免缓存
    });
  },

  // 创建游记
  create: async (data) => {
    // data包含：title, content, images 数组，可选 videoUrl
    console.log('diaryApi.create - 原始数据:', JSON.stringify(data));

    // 如果客户端使用videoUrl字段，但服务器使用video字段，需要转换
    const apiData = { ...data };
    if (apiData.videoUrl !== undefined) {
      console.log('diaryApi.create - 发现videoUrl字段:', apiData.videoUrl);
      apiData.video = apiData.videoUrl;
      delete apiData.videoUrl;
      console.log('diaryApi.create - 转换为video字段:', apiData.video);
    }

    console.log('diaryApi.create - 提交的数据:', JSON.stringify(apiData));

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

  // 收藏/取消收藏游记
  favoriteDiary: (diaryId) => {
    // 确保diaryId格式正确，移除可能的空格和非法字符
    const cleanDiaryId = diaryId ? String(diaryId).trim() : '';

    console.log('收藏/取消收藏 - 原始游记ID:', diaryId);
    console.log('收藏/取消收藏 - 处理后游记ID:', cleanDiaryId);
    console.log('收藏/取消收藏 - 游记ID类型:', typeof cleanDiaryId);
    console.log('收藏/取消收藏 - 游记ID长度:', cleanDiaryId.length);
    console.log('收藏/取消收藏 - 完整请求数据:', { diaryId: cleanDiaryId });

    return request({
      url: '/api/diaries/favorite',
      method: 'POST',
      data: { diaryId: cleanDiaryId }
    });
  },

  // 获取当前用户收藏的游记列表
  getFavorites: (page = 1, limit = 10) => {
    // 确保页码为大于等于1的整数
    const validPage = Math.max(1, Math.floor(Number(page) || 1));
    const validLimit = Math.max(1, Math.floor(Number(limit) || 10));

    // 构建请求参数
    const params: any = {
      page: validPage,
      limit: validLimit,
      _t: Date.now() // 添加时间戳避免缓存
    };

    console.log('获取收藏游记列表 - 页码:', validPage, '每页数量:', validLimit);
    console.log('获取收藏游记列表 - 完整请求参数:', params);

    return request({
      url: '/api/diaries/user/favorites',
      method: 'GET',
      data: params
    }).then(response => {
      // 详细记录响应结构以便调试
      console.log('收藏游记API响应:', {
        success: response.success,
        结构: response.data ? Object.keys(response.data) : '无数据',
        数据类型: response.data ? typeof response.data : '无数据',
        总数: response.data?.total || '未知',
        当前页: response.data?.page || '未知',
        items是否存在: response.data?.items ? '是' : '否',
        list是否存在: response.data?.list ? '是' : '否',
      });

      // 检测API响应里items和list字段，适配返回格式
      if (response.success) {
        if (response.data?.items && !response.data?.list) {
          console.log('检测到items数据，自动转换为list格式');
          response.data.list = response.data.items;
        } else if (!response.data?.list && !response.data?.items) {
          console.warn('警告：收藏游记API响应中既无items也无list字段');
        }
      }

      return response;
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
