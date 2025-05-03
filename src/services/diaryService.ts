// 游记服务，提供获取游记列表等功能

export interface DiaryItem {
  id: string;
  title: string;
  coverImage: string;
  authorName: string;
  likeCount: number;
  viewCount: number;
  createdAt: string;
}

// 模拟的游记数据
const mockDiaries: DiaryItem[] = [
  {
    id: '1',
    title: '春日京都，樱花之旅',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
    authorName: '小明',
    likeCount: 128,
    viewCount: 1024,
    createdAt: '2023-04-15'
  },
  {
    id: '2',
    title: '探索泰国清迈的小众景点',
    coverImage: 'https://images.unsplash.com/photo-1528181304800-259b08848526',
    authorName: '旅行家',
    likeCount: 256,
    viewCount: 2048,
    createdAt: '2023-05-20'
  },
  {
    id: '3',
    title: '三亚阳光沙滩度假记',
    coverImage: 'https://images.unsplash.com/photo-1540202404-a2f29016b523',
    authorName: '沙滩控',
    likeCount: 99,
    viewCount: 1500,
    createdAt: '2023-06-10'
  },
  {
    id: '4',
    title: '丽江古城，邂逅民族风情',
    coverImage: 'https://images.unsplash.com/photo-1527908290723-59c39528f75a',
    authorName: '文艺青年',
    likeCount: 210,
    viewCount: 1800,
    createdAt: '2023-07-05'
  },
  {
    id: '5',
    title: '漫步巴黎左岸咖啡馆',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    authorName: '咖啡爱好者',
    likeCount: 180,
    viewCount: 1600,
    createdAt: '2023-08-15'
  },
  {
    id: '6',
    title: '纽约曼哈顿的摩天大楼',
    coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
    authorName: '都市客',
    likeCount: 150,
    viewCount: 1200,
    createdAt: '2023-09-20'
  }
];

/**
 * 获取游记列表
 * @param page 页码
 * @param pageSize 每页条数
 * @returns 游记列表
 */
export const getDiaryList = (page = 1, pageSize = 10): Promise<DiaryItem[]> => {
  // 模拟网络请求的延迟
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDiaries);
    }, 500);
  });
};

/**
 * 获取游记详情
 * @param id 游记ID
 * @returns 游记详情
 */
export const getDiaryDetail = (id: string): Promise<DiaryItem | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const diary = mockDiaries.find(item => item.id === id);
      resolve(diary || null);
    }, 300);
  });
}; 