import { View, Text, Image, ScrollView, Video, Swiper, SwiperItem } from '@tarojs/components';
import { useEffect, useState, useRef } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import api from '../../../services/api';
import { CommentSection, CommentInput } from '../../../components/CommentSection';
import './index.scss';

interface DiaryDetail {
  id?: string;
  _id?: string;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean; // 当前用户是否点赞
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
  const [liked, setLiked] = useState(false);
  const [collected, setCollected] = useState(false);
  const [failedImages, setFailedImages] = useState<{[key: string]: boolean}>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 记录用户信息
  const userInfoRef = useRef<any>(null);

  useEffect(() => {
    // 获取当前用户信息
    const getUserInfo = async () => {
      try {
        console.log('检查登录状态');
        const loginStatus = await api.user.checkLoginStatus();
        console.log('登录状态检查结果:', loginStatus);

        if (loginStatus.isLoggedIn && loginStatus.user) {
          const user = loginStatus.user;
          console.log('已登录用户:', user);

          // 获取用户ID
          const userId = user._id || user.id || user.userId;
          if (userId) {
            console.log('设置当前用户ID:', userId);
            setCurrentUserId(userId);
            userInfoRef.current = user;
          } else {
            console.warn('用户信息中没有找到ID字段');
          }
        } else {
          console.log('用户未登录或登录已过期');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    };

    // 执行获取用户信息
    getUserInfo();

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
  }, [id, Taro.getCurrentInstance().router?.params.refresh]);

  const fetchDiaryDetail = async (diaryId: string) => {
    try {
      setLoading(true);
      console.log(`详情页 - 开始请求游记详情, ID: ${diaryId}`);

      // 使用with-like-status接口获取带点赞状态的详情
      const res = await api.diary.getDetailWithLikeStatus(diaryId);
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
          _id: diaryData._id,
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
          likes: diaryData.likeCount || 0,
          isLiked: diaryData.isLiked || false
        });

        // 根据API返回的点赞状态更新liked状态
        setLiked(diaryData.isLiked || false);
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

  // 打开评论弹窗
  const openCommentModal = async () => {
    console.log('打开评论弹窗，当前用户ID:', currentUserId);

    // 检查登录状态 - 优先使用token判断
    const token = Taro.getStorageSync('token');

    // 如果没有用户ID但有token，说明可能是登录状态但用户信息未加载
    if (!currentUserId && token) {
      console.log('有token但无用户ID，尝试重新获取用户信息');
      try {
        const userData = await api.user.getCurrentUser();
        if (userData) {
          const userId = userData._id || userData.id || userData.userId;
          if (userId) {
            console.log('成功获取到用户ID:', userId);
            // 更新用户ID
            setCurrentUserId(userId);
            userInfoRef.current = userData;

            // 直接触发评论弹窗
            Taro.eventCenter.trigger('openCommentModal');
            return;
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    }

    // 如果没有用户ID，且没有token，则确实是未登录状态
    if (!currentUserId && !token) {
      console.log('确认用户未登录，跳转到登录页面');
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });

      // 延迟跳转到登录页
      setTimeout(() => {
        Taro.navigateTo({
          url: '/pages/login/index'
        });
      }, 1500);
      return;
    }

    // 直接触发评论弹窗 - 因为此时用户要么有ID要么有token
    Taro.eventCenter.trigger('openCommentModal');

    // 查找要修改的组件引用
    const commentSectionRef = Taro.createSelectorQuery()
      .select('.comments-section');

    commentSectionRef.boundingClientRect((rect: any) => {
      if (rect && rect.top !== undefined) {
        console.log('找到评论区域，滚动到评论区域');
        // 滚动到评论区域
        Taro.pageScrollTo({
          scrollTop: rect.top,
          duration: 300
        });
      }
    }).exec();
  };

  // 处理点赞
  const handleLike = async () => {
    if (!id) return;

    try {
      // 检查登录状态
      const token = Taro.getStorageSync('token');
      if (!token) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 2000
        });

        setTimeout(() => {
          Taro.navigateTo({
            url: '/pages/login/index'
          });
        }, 1500);
        return;
      }

      // 乐观更新UI
      setLiked(!liked);
      if (diary) {
        const newLikes = liked ? Math.max(0, diary.likes - 1) : diary.likes + 1;
        setDiary({...diary, likes: newLikes, isLiked: !liked});
      }

      // 发送请求
      const res = await api.diary.likeDiary(id);

      if (!res.success) {
        // 如果失败，回滚UI
        setLiked(liked);
        if (diary) {
          setDiary({...diary, isLiked: liked});
        }
        throw new Error(res.message || '操作失败');
      }

      // 成功提示
      Taro.showToast({
        title: !liked ? '点赞成功' : '取消点赞',
        icon: 'none'
      });

      // 重新获取最新数据以确保状态一致
      fetchDiaryDetail(id);
    } catch (error) {
      console.error('点赞操作失败', error);
      Taro.showToast({
        title: error instanceof Error ? error.message : '操作失败',
        icon: 'none'
      });
    }
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
              <Text className='stat-icon'>❤️</Text>
              <Text className='stat-value'>{diary.likes} 赞</Text>
            </View>
          </View>
        </View>

        {/* 评论区 */}
        {id && (
          <CommentSection
            diaryId={id}
            currentUserId={currentUserId}
            userInfo={userInfoRef.current}
            formatDate={formatDate}
          />
        )}

        {/* 底部间距，确保内容不被底栏遮挡 */}
        <View className='bottom-space'></View>
      </ScrollView>

      {/* 底部评论输入 */}
      <CommentInput
        onOpenCommentModal={openCommentModal}
        liked={liked}
        collected={collected}
        onLike={handleLike}
        onCollect={handleCollect}
      />
    </View>
  );
}

export default DiaryDetail;
