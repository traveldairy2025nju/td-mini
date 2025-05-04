import { View, Text, Image, ScrollView, Video, Input, Swiper, SwiperItem } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import api from '../../../services/api';
import './index.scss';

interface DiaryDetail {
  id: string;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  views: number;
  likes: number;
}

interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

// 默认占位图
const DEFAULT_IMAGE = 'https://placehold.co/600x400/f5f5f5/cccccc?text=图片加载失败';

function DiaryDetail() {
  const router = useRouter();
  console.log('详情页 - 完整router对象:', JSON.stringify(router));

  let id: string | undefined;
  if (router && router.params) {
    id = router.params.id;
    console.log('详情页 - 从router获取的ID:', id);
  } else {
    console.error('详情页 - 无法获取router参数');
  }

  const [diary, setDiary] = useState<DiaryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [collected, setCollected] = useState(false);
  // 模拟评论数据
  const [comments] = useState<Comment[]>([
    {
      id: '1',
      authorName: '旅行者1号',
      authorAvatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=user1',
      content: '这个地方真的太美了，下次也想去！',
      createdAt: '2023-05-20'
    },
    {
      id: '2',
      authorName: '背包客',
      authorAvatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=user2',
      content: '分享的照片很棒，能介绍一下拍摄的相机吗？',
      createdAt: '2023-05-19'
    }
  ]);
  const [failedImages, setFailedImages] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    console.log('详情页 - useEffect中的ID:', id);
    if (id) {
      fetchDiaryDetail(id);
    } else {
      console.error('详情页 - ID不存在或无效');
      Taro.showToast({
        title: '游记ID不存在',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        Taro.navigateBack();
      }, 2000);
    }
  }, [id]);

  const fetchDiaryDetail = async (diaryId: string) => {
    try {
      setLoading(true);
      console.log(`详情页 - 开始请求游记详情, ID: ${diaryId}`);

      const res = await api.diary.getDetail(diaryId);
      console.log('详情页 - API响应:', res);
      
      if (res.success && res.data) {
        const diaryData = res.data;
        
        // 打印详细的图片数据
        console.log('详情页 - 图片数据:', diaryData.images);
        console.log('详情页 - 视频数据:', diaryData.video);
        
        // 检查图片URL
        if (Array.isArray(diaryData.images)) {
          diaryData.images.forEach((img, index) => {
            console.log(`图片${index+1}:`, img);
            
            // 确保图片URL是有效的
            if (!img || typeof img !== 'string' || !img.startsWith('http')) {
              console.warn(`图片${index+1}的URL可能不正确:`, img);
            }
          });
        } else {
          console.warn('图片数据不是数组:', diaryData.images);
        }
        
        setDiary({
          id: diaryData._id,
          title: diaryData.title,
          content: diaryData.content,
          // 确保images是数组，并过滤掉无效URL
          images: Array.isArray(diaryData.images) 
            ? diaryData.images.filter(img => img && typeof img === 'string') 
            : [],
          videoUrl: diaryData.video,
          authorName: diaryData.author?.nickname || '未知用户',
          authorAvatar: diaryData.author?.avatar || 'https://api.dicebear.com/6.x/initials/svg?seed=TD',
          createdAt: diaryData.createdAt || '',
          views: diaryData.views || 0,
          likes: diaryData.likes || 0
        });
      } else {
        throw new Error(res.message || '获取游记详情失败');
      }
    } catch (error) {
      console.error('获取游记详情失败', error);
      Taro.showToast({
        title: error instanceof Error ? error.message : '获取游记详情失败',
        icon: 'none'
      });
      setTimeout(() => {
        Taro.navigateBack();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  // 处理评论提交（暂未实现）
  const handleCommentSubmit = () => {
    Taro.showToast({
      title: '评论功能暂未实现',
      icon: 'none'
    });
    setCommentText('');
  };

  // 处理点赞（暂未实现）
  const handleLike = () => {
    setLiked(!liked);
    Taro.showToast({
      title: !liked ? '点赞成功' : '取消点赞',
      icon: 'none'
    });
  };

  // 处理收藏（暂未实现）
  const handleCollect = () => {
    setCollected(!collected);
    Taro.showToast({
      title: !collected ? '收藏成功' : '取消收藏',
      icon: 'none'
    });
  };

  // 处理图片加载失败
  const handleImageError = (url: string) => {
    console.error('图片加载失败:', url);
    setFailedImages(prev => ({...prev, [url]: true}));
  };

  // 获取图片实际显示URL
  const getImageUrl = (url: string) => {
    if (failedImages[url]) {
      return DEFAULT_IMAGE;
    }
    return url;
  };

  if (loading) {
    return (
      <View className='loading-container'>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!diary) {
    return (
      <View className='error-container'>
        <Text>游记不存在或已被删除</Text>
      </View>
    );
  }

  // 构建媒体列表（包括图片和视频）
  const mediaList = [
    ...(diary.videoUrl ? [{ type: 'video', url: diary.videoUrl }] : []),
    ...diary.images.map(img => ({ type: 'image', url: img }))
  ];

  console.log('媒体列表:', mediaList); // 添加日志查看媒体列表内容

  return (
    <View className='diary-detail-page'>
      {/* 固定顶栏 */}
      <View className='fixed-header'>
        <View className='author-info'>
          <Image className='author-avatar' src={diary.authorAvatar} mode='aspectFill' />
          <Text className='author-name'>{diary.authorName}</Text>
        </View>
        <Text className='publish-date'>{formatDate(diary.createdAt)}</Text>
      </View>

      {/* 主内容区域 - 可滚动 */}
      <ScrollView className='diary-content-scroll' scrollY>
        {/* 媒体轮播区 */}
        {mediaList.length > 0 && (
          <View className='media-container'>
            <Swiper
              className='media-swiper'
              indicatorColor='#999'
              indicatorActiveColor='#333'
              circular
              indicatorDots
              autoplay={false}
            >
              {mediaList.map((media, index) => (
                <SwiperItem key={index} className='swiper-item'>
                  {media.type === 'image' ? (
                    <View className='image-wrapper'>
                      <Image
                        className='swiper-image'
                        src={failedImages[media.url] ? DEFAULT_IMAGE : media.url}
                        mode='aspectFit'
                        lazyLoad={false}
                        showMenuByLongpress={true}
                        onError={() => handleImageError(media.url)}
                        onClick={() => {
                          console.log('点击图片:', media.url);
                          // 如果原始图片加载失败，不进行预览
                          if (failedImages[media.url]) {
                            Taro.showToast({
                              title: '原始图片无法加载',
                              icon: 'none'
                            });
                            return;
                          }
                          
                          Taro.previewImage({
                            current: media.url,
                            urls: diary.images
                          }).catch(err => {
                            console.error('预览图片失败:', err);
                            Taro.showToast({
                              title: '图片预览失败',
                              icon: 'none'
                            });
                          });
                        }}
                      />
                    </View>
                  ) : (
                    <Video
                      src={media.url}
                      className='swiper-video'
                      controls={true}
                      showFullscreenBtn={true}
                      objectFit='contain'
                    />
                  )}
                </SwiperItem>
              ))}
            </Swiper>
          </View>
        )}

        {/* 文章标题和内容 */}
        <View className='diary-content-block'>
          <Text className='diary-title'>{diary.title}</Text>
          <Text className='content-text'>{diary.content}</Text>
          
          <View className='diary-stats'>
            <View className='stat-item'>
              <Text className='stat-icon'>👁️</Text>
              <Text className='stat-value'>{diary.views} 浏览</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-icon'>❤️</Text>
              <Text className='stat-value'>{diary.likes} 赞</Text>
            </View>
          </View>
        </View>

        {/* 评论区 */}
        <View className='comments-section'>
          <View className='comments-header'>
            <Text className='comments-title'>评论区</Text>
            <Text className='comments-count'>{comments.length}条评论</Text>
          </View>
          
          {comments.length > 0 ? (
            <View className='comments-list'>
              {comments.map(comment => (
                <View key={comment.id} className='comment-item'>
                  <Image className='comment-avatar' src={comment.authorAvatar} mode='aspectFill' />
                  <View className='comment-content'>
                    <View className='comment-header'>
                      <Text className='comment-author'>{comment.authorName}</Text>
                      <Text className='comment-date'>{comment.createdAt}</Text>
                    </View>
                    <Text className='comment-text'>{comment.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className='no-comments'>
              <Text>暂无评论，快来说点什么吧~</Text>
            </View>
          )}
        </View>
        
        {/* 底部间距，确保内容不被底栏遮挡 */}
        <View className='bottom-space'></View>
      </ScrollView>

      {/* 固定底栏 */}
      <View className='fixed-footer'>
        <View className='comment-input-area'>
          <Input
            className='comment-input'
            placeholder='写下你的评论...'
            value={commentText}
            onInput={e => setCommentText(e.detail.value)}
            confirmType='send'
            onConfirm={handleCommentSubmit}
          />
        </View>
        <View className='action-buttons'>
          <View className={`action-button ${liked ? 'active' : ''}`} onClick={handleLike}>
            <Text className='action-icon'>{liked ? '❤️' : '🤍'}</Text>
            <Text className='action-text'>点赞</Text>
          </View>
          <View className={`action-button ${collected ? 'active' : ''}`} onClick={handleCollect}>
            <Text className='action-icon'>{collected ? '⭐' : '☆'}</Text>
            <Text className='action-text'>收藏</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default DiaryDetail;
