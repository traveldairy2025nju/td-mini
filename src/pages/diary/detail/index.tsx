import { View, Text, Image, ScrollView, Video, Input, Swiper, SwiperItem } from '@tarojs/components';
import { useEffect, useState, useRef } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import api from '../../../services/api';
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
  views: number;
  likes: number;
  liked?: boolean; // 当前用户是否点赞
}

interface Comment {
  id?: string;
  _id?: string;
  content: string;
  createdAt: string;
  diary?: string;
  parentComment?: string | null;
  user?: {
    _id: string;
    username?: string;
    nickname: string;
    avatar: string;
  };
}

// 评论操作类型
type CommentAction = 'reply' | 'delete' | 'copy';

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [totalComments, setTotalComments] = useState(0);
  const [failedImages, setFailedImages] = useState<{[key: string]: boolean}>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // 评论弹窗相关状态
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [activeComment, setActiveComment] = useState<Comment | null>(null);
  
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
      fetchComments(id);
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
          views: diaryData.views || 0,
          likes: diaryData.likes || 0,
          liked: diaryData.liked || false
        });
        
        // 根据API返回的点赞状态更新liked状态
        setLiked(diaryData.liked || false);
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

  const fetchComments = async (diaryId: string, pageNum = 1, refresh = false) => {
    try {
      setCommentsLoading(true);
      
      const params = { page: pageNum, limit };
      const res = await api.diary.getComments(diaryId, params);
      
      console.log('获取评论响应:', res);
      
      if (res.success && res.data) {
        // 确保评论数据是数组，从items字段中获取
        const commentsList = Array.isArray(res.data.items) ? res.data.items : [];
        const total = res.data.total || 0;
        
        console.log('评论列表:', commentsList, '总数:', total);
        
        // 如果是刷新，直接替换评论列表
        if (refresh) {
          setComments(commentsList);
        } else {
          // 否则追加评论
          setComments(prev => [...prev, ...commentsList]);
        }
        
        setTotalComments(total);
        setHasMore(commentsList.length === limit); // 如果返回的评论数量小于limit，说明没有更多了
        setPage(pageNum);
      } else {
        // 不抛出错误，而是设置空数据
        console.warn('获取评论接口返回失败:', res.message);
        if (refresh || pageNum === 1) {
          setComments([]);
          setTotalComments(0);
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('获取评论失败', error);
      
      // 出错时，如果是刷新或第一页，设置空数据
      if (refresh || pageNum === 1) {
        setComments([]);
        setTotalComments(0);
        setHasMore(false);
      }
      
      Taro.showToast({
        title: error instanceof Error ? error.message : '获取评论失败',
        icon: 'none'
      });
    } finally {
      setCommentsLoading(false);
    }
  };

  // 加载更多评论
  const loadMoreComments = () => {
    if (!id || !hasMore || commentsLoading) return;
    fetchComments(id, page + 1);
  };

  // 刷新评论列表
  const refreshComments = () => {
    if (!id) return;
    fetchComments(id, 1, true);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  // 打开评论弹窗
  const openCommentModal = async (comment?: Comment) => {
    console.log('打开评论弹窗，当前用户ID:', currentUserId);
    console.log('用户信息引用:', userInfoRef.current);
    
    // 检查登录状态并提供更多信息
    const token = Taro.getStorageSync('token');
    console.log('当前token状态:', token ? '已存在' : '不存在');
    
    // 如果没有用户ID，尝试再次获取
    if (!currentUserId) {
      console.log('尝试重新获取用户信息');
      try {
        const currentUser = await api.user.getCurrentUser();
        if (currentUser) {
          const userId = currentUser._id || currentUser.id || currentUser.userId;
          if (userId) {
            console.log('获取到用户ID:', userId);
            setCurrentUserId(userId);
            userInfoRef.current = currentUser;
            
            // 继续打开弹窗
            setReplyToComment(comment || null);
            setCommentText('');
            setCommentModalVisible(true);
            return;
          }
        }
      } catch (error) {
        console.error('重新获取用户信息失败:', error);
      }
      
      // 如果仍然没有获取到用户ID，但有token，仍然允许操作
      if (token) {
        console.log('有token但无用户ID，仍然允许操作');
        setReplyToComment(comment || null);
        setCommentText('');
        setCommentModalVisible(true);
        return;
      }
      
      // 此时确定用户未登录
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
    
    // 用户已登录，直接打开弹窗
    setReplyToComment(comment || null);
    setCommentText(''); // 清空评论文本
    setCommentModalVisible(true);
  };

  // 关闭评论弹窗
  const closeCommentModal = () => {
    setCommentModalVisible(false);
    setReplyToComment(null);
    setCommentText('');
  };

  // 提交评论
  const submitComment = async () => {
    if (!id) return;
    
    console.log('提交评论，当前用户ID:', currentUserId);
    console.log('用户信息引用:', userInfoRef.current);
    
    // 检查登录状态，尝试多种方法
    const token = Taro.getStorageSync('token');
    
    // 如果没有用户ID，但有token，尝试获取用户信息
    if (!currentUserId && token) {
      try {
        console.log('提交前尝试获取用户信息');
        const currentUser = await api.user.getCurrentUser();
        if (currentUser) {
          const userId = currentUser._id || currentUser.id || currentUser.userId;
          if (userId) {
            console.log('获取到用户ID:', userId);
            setCurrentUserId(userId);
            userInfoRef.current = currentUser;
            // 继续提交流程
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    }
    
    // 验证评论内容
    if (!commentText.trim()) {
      Taro.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }
    
    try {
      // 显示加载状态
      Taro.showLoading({
        title: '发布中...',
        mask: true
      });
      
      // 获取父评论ID（如果是回复）
      const parentCommentId = replyToComment ? (replyToComment._id || replyToComment.id || '') : undefined;
      
      // 发送API请求
      const res = await api.diary.addComment(id, commentText.trim(), parentCommentId);
      console.log('评论提交响应:', res);
      
      // 隐藏加载状态
      Taro.hideLoading();
      
      if (res.success && res.data) {
        Taro.showToast({
          title: '评论成功',
          icon: 'success'
        });
        
        // 清空评论框并关闭弹窗
        setCommentText('');
        closeCommentModal();
        
        // 尝试直接将新评论添加到评论列表的开头
        try {
          const newComment = res.data;
          if (newComment && (newComment._id || newComment.id)) {
            setComments(prev => [newComment, ...prev]);
            setTotalComments(prev => prev + 1);
          } else {
            // 如果无法直接添加新评论，则刷新评论列表
            refreshComments();
          }
        } catch (e) {
          console.error('处理新评论失败，刷新列表', e);
          refreshComments();
        }
      } else {
        if (res.statusCode === 401) {
          Taro.showToast({
            title: '请先登录后再评论',
            icon: 'none',
            duration: 2000
          });
          setTimeout(() => {
            closeCommentModal();
            Taro.navigateTo({
              url: '/pages/login/index'
            });
          }, 1500);
        } else {
          throw new Error(res.message || '评论失败');
        }
      }
    } catch (error) {
      console.error('评论失败', error);
      Taro.hideLoading();
      
      // 如果是未授权错误，引导用户登录
      if (error.message && (error.message.includes('授权') || error.message.includes('登录'))) {
        Taro.showToast({
          title: '请先登录后再评论',
          icon: 'none',
          duration: 2000
        });
        setTimeout(() => {
          closeCommentModal();
          Taro.navigateTo({
            url: '/pages/login/index'
          });
        }, 1500);
      } else {
        Taro.showToast({
          title: error instanceof Error ? error.message : '评论失败',
          icon: 'none'
        });
      }
    }
  };

  // 长按评论显示操作菜单
  const handleLongPressComment = (comment: Comment) => {
    console.log('长按评论:', comment);
    setActiveComment(comment);
    
    // 准备操作菜单选项
    const actions: CommentAction[] = ['reply', 'copy'];
    
    // 只有评论作者或管理员才能删除评论
    const isCommentAuthor = currentUserId && comment.user && currentUserId === comment.user._id;
    const isAdmin = userInfoRef.current && userInfoRef.current.role === 'admin';
    
    if (isCommentAuthor || isAdmin) {
      actions.push('delete');
    }
    
    // 显示操作菜单
    Taro.showActionSheet({
      itemList: actions.map(action => {
        switch(action) {
          case 'reply': return '回复';
          case 'delete': return '删除';
          case 'copy': return '复制内容';
          default: return '';
        }
      }),
      success: (res) => {
        const selectedAction = actions[res.tapIndex];
        handleCommentAction(selectedAction, comment);
      }
    });
  };

  // 处理评论操作
  const handleCommentAction = (action: CommentAction, comment: Comment) => {
    switch(action) {
      case 'reply':
        openCommentModal(comment);
        break;
      case 'delete':
        handleDeleteComment(comment._id || comment.id);
        break;
      case 'copy':
        Taro.setClipboardData({
          data: comment.content,
          success: () => {
            Taro.showToast({
              title: '内容已复制',
              icon: 'success'
            });
          }
        });
        break;
    }
  };

  // 点击评论触发回复
  const handleClickComment = (comment: Comment) => {
    openCommentModal(comment);
  };

  // 处理删除评论
  const handleDeleteComment = async (commentId: string | undefined) => {
    if (!commentId) {
      Taro.showToast({
        title: '评论ID无效',
        icon: 'none'
      });
      return;
    }
    
    try {
      await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这条评论吗？'
      }).then(async (res) => {
        if (res.confirm) {
          const apiRes = await api.diary.deleteComment(commentId);
          if (apiRes.success) {
            Taro.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            // 从评论列表中移除
            setComments(prev => prev.filter(comment => (comment.id !== commentId && comment._id !== commentId)));
            setTotalComments(prev => prev - 1);
          } else {
            throw new Error(apiRes.message || '删除失败');
          }
        }
      });
    } catch (error) {
      console.error('删除评论失败', error);
      Taro.showToast({
        title: error instanceof Error ? error.message : '删除评论失败',
        icon: 'none'
      });
    }
  };

  // 处理点赞
  const handleLike = async () => {
    if (!id) return;
    
    try {
      // 乐观更新UI
      setLiked(!liked);
      if (diary) {
        const newLikes = liked ? diary.likes - 1 : diary.likes + 1;
        setDiary({...diary, likes: newLikes});
      }
      
      // 发送请求
      const res = await api.diary.likeDiary(id);
      
      if (!res.success) {
        // 如果失败，回滚UI
        setLiked(liked);
        if (diary) {
          setDiary({...diary});
        }
        throw new Error(res.message || '操作失败');
      }
      
      // 成功提示
      Taro.showToast({
        title: !liked ? '点赞成功' : '取消点赞',
        icon: 'none'
      });
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
      <ScrollView className='diary-content-scroll' scrollY onScrollToLower={loadMoreComments}>
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
            <Text className='comments-count'>{totalComments}条评论</Text>
          </View>
          
          {comments.length > 0 ? (
            <View className='comments-list'>
              {comments.map(comment => {
                console.log('渲染评论:', comment);
                // 从user字段获取作者信息
                const author = comment.user || {
                  _id: '',
                  nickname: '未知用户',
                  avatar: 'https://api.dicebear.com/6.x/initials/svg?seed=TD'
                };
                const commentId = comment._id || comment.id;
                
                return (
                  <View 
                    key={commentId} 
                    className='comment-item'
                    onClick={() => handleClickComment(comment)}
                    onLongPress={() => handleLongPressComment(comment)}
                  >
                    <Image 
                      className='comment-avatar' 
                      src={author.avatar} 
                      mode='aspectFill' 
                    />
                    <View className='comment-content'>
                      <View className='comment-header'>
                        <Text className='comment-author'>{author.nickname}</Text>
                        <Text className='comment-date'>{formatDate(comment.createdAt)}</Text>
                      </View>
                      <Text className='comment-text'>{comment.content}</Text>
                      
                      {/* 如果是回复别人的评论，显示原评论信息 */}
                      {comment.parentComment && (
                        <View className='reply-info'>
                          <Text className='reply-text'>回复评论</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
              
              {/* 加载更多按钮 */}
              {hasMore && (
                <View className='load-more' onClick={loadMoreComments}>
                  {commentsLoading ? '加载中...' : '加载更多'}
                </View>
              )}
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
        <View className='comment-input-area' onClick={() => openCommentModal()}>
          <Text className='comment-placeholder'>写下你的评论...</Text>
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

      {/* 评论弹窗 */}
      {commentModalVisible && (
        <View className='comment-modal'>
          <View className='comment-modal-mask' onClick={closeCommentModal}></View>
          <View className='comment-modal-content'>
            <View className='comment-modal-header'>
              <Text className='comment-modal-title'>
                {replyToComment ? `回复 ${replyToComment.user?.nickname || '用户'}` : '发表评论'}
              </Text>
              <Text className='comment-modal-close' onClick={closeCommentModal}>关闭</Text>
            </View>
            <View className='comment-modal-body'>
              <Input
                className='comment-modal-input'
                value={commentText}
                onInput={e => setCommentText(e.detail.value)}
                placeholder='写下你的评论...'
                focus
                confirmType='send'
                onConfirm={submitComment}
              />
            </View>
            <View className='comment-modal-footer'>
              <View className='comment-modal-btn' onClick={closeCommentModal}>取消</View>
              <View className='comment-modal-btn primary' onClick={submitComment}>发布</View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default DiaryDetail;
