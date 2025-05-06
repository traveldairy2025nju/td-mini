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
  const [isMyDiary, setIsMyDiary] = useState(false); // 是否是当前用户的游记

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
    // 获取当前用户信息和游记详情
    const loadData = async () => {
      try {
        console.log('检查登录状态');
        // 获取登录状态
        const loginStatus = await api.user.checkLoginStatus();
        console.log('登录状态检查结果:', loginStatus);
        
        // 用户ID
        let userId: string | null = null;
        
        if (loginStatus.isLoggedIn && loginStatus.user) {
          const user = loginStatus.user;
          console.log('已登录用户详情:', JSON.stringify(user));
          
          // 获取用户ID，提供多种可能的字段名
          userId = user._id || user.id || user.userId;
          
          // 如果所有常规ID字段都不存在，尝试从嵌套对象中获取
          if (!userId && typeof user === 'object') {
            // 输出所有字段以便调试
            console.log('用户对象所有字段:', Object.keys(user));
            
            // 尝试在对象的所有一级属性中查找id字段
            for (const key in user) {
              if (
                (key.toLowerCase().includes('id') || key === '_id') && 
                typeof user[key] === 'string' &&
                user[key].length > 0
              ) {
                userId = user[key];
                console.log(`从字段 ${key} 找到用户ID:`, userId);
                break;
              }
            }
          }
          
          if (userId) {
            console.log('设置当前用户ID:', userId);
            setCurrentUserId(userId);
            userInfoRef.current = user;
          } else {
            console.warn('用户信息中没有找到ID字段, 尝试直接获取用户信息');
            // 尝试直接获取用户信息
            try {
              const userData = await api.user.getCurrentUser();
              if (userData) {
                console.log('直接获取的用户详情:', JSON.stringify(userData));
                const directUserId = userData._id || userData.id || userData.userId;
                if (directUserId) {
                  console.log('通过直接API获取到用户ID:', directUserId);
                  userId = directUserId;
                  setCurrentUserId(directUserId);
                  userInfoRef.current = userData;
                }
              }
            } catch (userErr) {
              console.error('直接获取用户信息失败:', userErr);
            }
          }
        } else {
          console.log('用户未登录或登录已过期');
        }
        
        // 获取游记详情
        if (id) {
          try {
            setLoading(true);
            console.log(`详情页 - 开始请求游记详情, ID: ${id}`);
            
            // 尝试获取游记详情
            const res = await api.diary.getDetailWithStatus(id);
            console.log('详情页 - API响应(with-status):', res);
            
            if (res.success && res.data) {
              const diaryData = res.data;
              
              // 判断是否是当前用户的游记
              const diaryAuthorId = diaryData.author?._id || diaryData.author?.id;
              // 确保显示全部有用信息便于调试
              console.log('游记作者数据:', JSON.stringify(diaryData.author));
              console.log('当前用户ID:', userId);
              console.log('游记作者ID:', diaryAuthorId);
              
              const isOwner = !!userId && userId === diaryAuthorId;
              setIsMyDiary(isOwner);
              console.log('是否是当前用户的游记:', isOwner);
              
              // 设置游记数据
              setDiary({
                id: diaryData._id,
                _id: diaryData._id,
                title: diaryData.title,
                content: diaryData.content,
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
              
              // 更新状态
              setLiked(diaryData.isLiked || false);
              setCollected(diaryData.isFavorited || false);
            } else {
              throw new Error(res.message || '获取游记详情失败');
            }
          } catch (error) {
            console.error('获取游记详情失败', error);
            // 尝试备用接口
            try {
              const res = await api.diary.getDetail(id);
              if (res.success && res.data) {
                const diaryData = res.data;
                
                // 判断是否是当前用户的游记
                const diaryAuthorId = diaryData.author?._id || diaryData.author?.id;
                const isOwner = !!userId && userId === diaryAuthorId;
                setIsMyDiary(isOwner);
                console.log('备用接口 - 是否是当前用户的游记:', isOwner);
                
                // 设置游记数据
                setDiary({
                  id: diaryData._id,
                  _id: diaryData._id,
                  title: diaryData.title,
                  content: diaryData.content,
                  images: Array.isArray(diaryData.images)
                    ? diaryData.images.filter(img => img && typeof img === 'string')
                    : [],
                  videoUrl: diaryData.video,
                  authorName: diaryData.author?.nickname || '未知用户',
                  authorAvatar: diaryData.author?.avatar || 'https://api.dicebear.com/6.x/initials/svg?seed=TD',
                  createdAt: diaryData.createdAt || '',
                  likes: diaryData.likeCount || 0,
                  isLiked: false,
                  favorites: 0,
                  isFavorited: false
                });
              } else {
                throw new Error(res.message || '获取游记详情失败');
              }
            } catch (backupError) {
              console.error('备用接口也失败', backupError);
              Taro.showToast({
                title: '获取游记详情失败',
                icon: 'none'
              });
              setTimeout(() => {
                Taro.navigateBack();
              }, 2000);
            }
          } finally {
            setLoading(false);
          }
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
      } catch (error) {
        console.error('加载数据失败', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, Taro.getCurrentInstance().router?.params.refresh]);

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
      if (id) {
        const res = await api.diary.getDetailWithStatus(id);
        if (res.success && res.data) {
          setLiked(res.data.isLiked || false);
          if (diary) {
            setDiary({
              ...diary,
              likes: res.data.likeCount || 0,
              isLiked: res.data.isLiked || false
            });
          }
        }
      }
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

  // 处理游记操作菜单
  const handleDiaryOptions = () => {
    if (!id) return;
    
    Taro.showActionSheet({
      itemList: ['编辑游记', '删除游记'],
      success: (res) => {
        switch(res.tapIndex) {
          case 0: // 编辑游记
            handleEditDiary();
            break;
          case 1: // 删除游记
            handleDeleteDiary();
            break;
        }
      }
    });
  };

  // 处理编辑游记
  const handleEditDiary = () => {
    if (!id) return;
    Taro.navigateTo({
      url: `/pages/edit-diary/index?id=${id}`
    });
  };

  // 处理删除游记
  const handleDeleteDiary = () => {
    if (!id) return;
    
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这篇游记吗？此操作不可恢复。',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            Taro.showLoading({ title: '删除中...' });
            const response = await api.diary.delete(id);
            
            if (response.success) {
              Taro.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 2000
              });
              
              // 触发刷新事件
              Taro.eventCenter.trigger('refreshHomePage');
              Taro.eventCenter.trigger('refreshMyPage');
              
              // 延迟返回
              setTimeout(() => {
                Taro.navigateBack();
              }, 1500);
            } else {
              throw new Error(response.message || '删除失败');
            }
          } catch (error) {
            console.error('删除游记失败', error);
            Taro.showToast({
              title: error instanceof Error ? error.message : '删除失败',
              icon: 'none'
            });
          } finally {
            Taro.hideLoading();
          }
        }
      }
    });
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
        <View className='header-right'>
          {isMyDiary && (
            <Text className='options-icon' onClick={handleDiaryOptions}>⋮</Text>
          )}
        </View>
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
            <Text className='publish-date-stat'>{formatDate(diary.createdAt)}</Text>
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
