import { View, Text, Image, ScrollView, Video, Swiper, SwiperItem, Button } from '@tarojs/components';
import { useEffect, useState, useRef } from 'react';
import Taro, { useRouter, useShareAppMessage } from '@tarojs/taro';
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
  favorites?: number; // 收藏数
  isFavorited?: boolean; // 当前用户是否已收藏
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

  // 配置分享功能
  useShareAppMessage(() => {
    if (diary) {
      // 构建分享标题和路径
      const shareTitle = `${diary.title} - 旅行日记`;
      const sharePath = `/pages/diary/detail/index?id=${id}`;

      // 获取第一张图片作为分享图片（如果有）
      let imageUrl = '';
      if (diary.images && diary.images.length > 0) {
        imageUrl = diary.images[0];
      }

      console.log('分享游记:', shareTitle, sharePath, imageUrl);

      return {
        title: shareTitle,
        path: sharePath,
        imageUrl: imageUrl, // 分享图片
      };
    }
    // 默认分享内容
    return {
      title: '精彩旅行日记',
      path: '/pages/index/index'
    };
  });

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

      // 首先尝试使用with-status接口获取带点赞和收藏状态的详情
      let res;
      let usedFallback = false;

      try {
        // 使用with-status接口获取游记详情（包括点赞和收藏状态）
        res = await api.diary.getDetailWithStatus(diaryId);
        console.log('详情页 - API响应(with-status):', res);
      } catch (error) {
        console.warn('详情页 - with-status接口请求失败，回退到with-like-status:', error);
        usedFallback = true;

        // 如果with-status接口失败，回退到with-like-status接口
        try {
          res = await api.diary.getDetailWithLikeStatus(diaryId);
          console.log('详情页 - API响应(with-like-status):', res);
        } catch (likeError) {
          console.error('详情页 - with-like-status接口也失败，回退到基本详情接口:', likeError);

          // 如果with-like-status也失败，继续回退到基本详情接口
          res = await api.diary.getDetail(diaryId);
          console.log('详情页 - API响应(基本详情):', res);
        }
      }

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
          isLiked: diaryData.isLiked || false,
          favorites: diaryData.favoriteCount || 0,
          isFavorited: diaryData.isFavorited || false
        });

        // 根据API返回的点赞和收藏状态更新UI
        setLiked(diaryData.isLiked || false);
        setCollected(diaryData.isFavorited || false);

        // 如果使用了回退接口，且没有收藏相关信息，则告知用户
        if (usedFallback) {
          console.log('使用了回退接口，收藏功能可能不完整');
        }
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

  // 处理收藏
  const handleCollect = async () => {
    if (!id) {
      console.error('收藏操作 - ID为空');
      return;
    }

    // 确保ID格式正确
    const diaryId = id.trim();
    if (!diaryId) {
      console.error('收藏操作 - 处理后ID为空');
      return;
    }

    console.log('收藏操作 - 开始处理收藏, 原始ID:', id);
    console.log('收藏操作 - 处理后ID:', diaryId);
    console.log('收藏操作 - ID类型:', typeof diaryId);
    console.log('收藏操作 - ID长度:', diaryId.length);

    try {
      // 检查登录状态
      const token = Taro.getStorageSync('token');
      if (!token) {
        console.log('收藏操作 - 用户未登录');
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

      const originalCollectedState = collected;
      console.log('收藏操作 - 当前收藏状态:', collected, '即将切换为:', !collected);

      // 乐观更新UI
      setCollected(!collected);

      // 如果有收藏数，也更新收藏数
      if (diary && typeof diary.favorites === 'number') {
        const newFavorites = !collected ? diary.favorites + 1 : Math.max(0, diary.favorites - 1);
        setDiary({...diary, favorites: newFavorites, isFavorited: !collected});
      }

      // 发送请求，使用处理后的ID
      console.log(`发送收藏请求，游记ID: ${diaryId}, 当前收藏状态: ${collected}, 即将切换为: ${!collected}`);
      const res = await api.diary.favoriteDiary(diaryId);
      console.log('收藏操作响应:', res);

      if (!res.success) {
        // 如果API调用失败，回滚UI
        setCollected(originalCollectedState);
        if (diary) {
          setDiary({...diary, isFavorited: originalCollectedState});
        }
        throw new Error(res.message || '操作失败');
      }

      // 成功响应，根据API返回更新UI
      if (res.data && typeof res.data.favorited === 'boolean') {
        // API返回了确切的收藏状态，使用它
        setCollected(res.data.favorited);

        // 如果API返回的状态与UI状态不同，更新UI
        if (diary && res.data.favorited !== !originalCollectedState) {
          const updatedFavorites = res.data.favorited
            ? (diary.favorites || 0) + 1
            : Math.max(0, (diary.favorites || 0) - 1);
          setDiary({...diary, favorites: updatedFavorites, isFavorited: res.data.favorited});
        }
      }

      // 成功提示
      Taro.showToast({
        title: res.message || (originalCollectedState ? '取消收藏成功' : '收藏成功'),
        icon: 'none'
      });

      // 触发刷新首页和我的页面，更新收藏状态
      Taro.eventCenter.trigger('refreshHomePage');
      Taro.eventCenter.trigger('refreshMyPage');

    } catch (error) {
      console.error('收藏操作失败', error);

      // 严重错误回滚UI
      setCollected(collected);

      Taro.showToast({
        title: error instanceof Error ? error.message : '操作失败',
        icon: 'none'
      });
    }
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
            <View className='stat-item'>
              <Text className='stat-icon'>⭐</Text>
              <Text className='stat-value'>{diary.favorites || 0} 收藏</Text>
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
