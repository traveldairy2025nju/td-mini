import { View, Text, Image, Input } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import api from '../../services/api';
import { Comment, CommentAction, CommentSectionProps } from './interfaces';
import './index.scss';
import CommentInput from './CommentInput';
import { ThemeColors, getThemeColors } from '../../utils/themeManager';
import router from '../../routes';

// 默认头像
const DEFAULT_AVATAR = 'https://api.dicebear.com/6.x/initials/svg?seed=TD';

// 辅助函数: 颜色转rgba
const hexToRgba = (hex: string, alpha: number): string => {
  // 移除#号
  hex = hex.replace('#', '');
  
  // 转为RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const CommentSection: React.FC<CommentSectionProps> = ({
  diaryId,
  currentUserId,
  userInfo,
  formatDate
}) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [totalComments, setTotalComments] = useState(0);
  const [theme, setTheme] = useState<ThemeColors>(getThemeColors());

  // 评论弹窗相关状态
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
  const [activeComment, setActiveComment] = useState<Comment | null>(null);

  useEffect(() => {
    if (diaryId) {
      fetchComments(diaryId);
    }
    
    // 监听主题变化事件
    const themeChangeHandler = (newTheme: ThemeColors) => {
      setTheme(newTheme);
    };
    Taro.eventCenter.on('themeChange', themeChangeHandler);
    
    // 清理函数
    return () => {
      Taro.eventCenter.off('themeChange', themeChangeHandler);
    };
  }, [diaryId]);

  // 添加事件监听器以响应外部评论弹窗请求
  useEffect(() => {
    // 监听打开评论弹窗的事件
    const openCommentHandler = (data?: { diaryId?: string }) => {
      console.log('接收到打开评论弹窗事件', data);
      setCommentModalVisible(true);
    };

    // 监听刷新评论的事件
    const refreshCommentsHandler = () => {
      console.log('接收到刷新评论事件');
      refreshComments();
    };

    // 注册事件监听
    Taro.eventCenter.on('openCommentModal', openCommentHandler);
    Taro.eventCenter.on('refreshComments', refreshCommentsHandler);

    // 清理函数
    return () => {
      Taro.eventCenter.off('openCommentModal', openCommentHandler);
      Taro.eventCenter.off('refreshComments', refreshCommentsHandler);
    };
  }, [diaryId]); // 依赖于日记ID

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
    if (!diaryId || !hasMore || commentsLoading) return;
    fetchComments(diaryId, page + 1);
  };

  // 刷新评论列表
  const refreshComments = () => {
    if (!diaryId) return;
    fetchComments(diaryId, 1, true);
  };

  // 打开评论弹窗
  const openCommentModal = async (comment?: Comment) => {
    console.log('打开评论弹窗，当前用户ID:', currentUserId);

    // 检查登录状态并提供更多信息
    const token = Taro.getStorageSync('token');
    console.log('当前token状态:', token ? '已存在' : '不存在');

    // 直接判断token是否存在，如果存在就允许评论
    if (token) {
      console.log('检测到token存在，允许评论');
      setReplyToComment(comment || null);
      setCommentText('');
      setCommentModalVisible(true);
      return;
    }

    // 如果没有token，则需要登录
    console.log('未检测到token，用户需要登录');
    Taro.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 2000
    });

    // 延迟跳转到登录页
    setTimeout(() => {
      router.navigateToLogin();
    }, 1500);
  };

  // 关闭评论弹窗
  const closeCommentModal = () => {
    setCommentModalVisible(false);
    setReplyToComment(null);
    setCommentText('');
  };

  // 提交评论
  const submitComment = async () => {
    if (!diaryId) return;

    console.log('提交评论，当前用户ID:', currentUserId);

    // 检查登录状态，使用token判断
    const token = Taro.getStorageSync('token');
    if (!token) {
      console.log('未检测到token，用户需要登录');
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
      return;
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
      const res = await api.diary.addComment(diaryId, commentText.trim(), parentCommentId);
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

        // 刷新评论列表以获取最新数据
        refreshComments();
      } else {
        if (res.statusCode === 401) {
          // token可能过期，需要重新登录
          Taro.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          });

          // 清除过期token
          Taro.removeStorageSync('token');

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
        // 清除可能过期的token
        Taro.removeStorageSync('token');

        Taro.showToast({
          title: '请重新登录后再评论',
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

    // 检查登录状态
    const token = Taro.getStorageSync('token');
    if (!token) {
      console.log('用户未登录，无法操作评论');
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 准备操作菜单选项
    const actions: CommentAction[] = ['reply', 'copy'];

    // 只有评论作者或管理员才能删除评论
    const commentUserId = comment.user?._id || '';
    const isCommentAuthor = currentUserId && commentUserId && currentUserId === commentUserId;
    const isAdmin = userInfo && userInfo.role === 'admin';

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
    // 如果点击的是回复评论，则视为对主评论的回复
    if (comment.parentComment) {
      // 查找主评论
      const mainComment = comments.find(c =>
        c._id === comment.parentComment || c.id === comment.parentComment
      );

      if (mainComment) {
        console.log('点击回复评论，转为回复主评论:', mainComment);
        openCommentModal(mainComment);
      } else {
        // 找不到主评论，直接回复这条评论
        openCommentModal(comment);
      }
    } else {
      // 直接回复主评论
      openCommentModal(comment);
    }
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

            // 删除成功后刷新评论列表
            refreshComments();
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

  // 渲染回复评论
  const renderReplies = (parentComment: Comment, replies: Comment[]) => {
    if (!replies || replies.length === 0) return null;

    return (
      <View className='reply-comments'>
        {replies.map(reply => {
          const replyAuthor = reply.user || {
            _id: '',
            nickname: '未知用户',
            avatar: DEFAULT_AVATAR
          };
          const replyId = reply._id || reply.id;

          return (
            <View
              key={replyId}
              className='reply-item'
              onClick={() => handleClickComment(reply)}
              onLongPress={() => handleLongPressComment(reply)}
            >
              <Image
                className='reply-avatar'
                src={replyAuthor.avatar}
                mode='aspectFill'
              />
              <View className='reply-content'>
                <View className='reply-header'>
                  <Text className='reply-author'>{replyAuthor.nickname}</Text>
                  <Text className='reply-date'>{formatDate(reply.createdAt)}</Text>
                </View>
                <Text className='reply-text'>
                  回复 <Text style={{ color: theme.primaryColor }}>{parentComment.user?.nickname || '用户'}</Text>：{reply.content}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <>
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
                avatar: DEFAULT_AVATAR
              };
              const commentId = comment._id || comment.id;
              const hasReplies = (comment.replies && comment.replies.length > 0);

              return (
                <View key={commentId} className='comment-thread'>
                  <View
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

                      {!hasReplies && comment.parentComment && (
                        <View className='reply-info'>
                          <Text className='reply-text'>回复评论</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* 渲染回复评论 */}
                  {hasReplies && renderReplies(comment, comment.replies || [])}
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

      {/* 评论弹窗 */}
      {commentModalVisible && (
        <View className='comment-modal'>
          <View className='comment-modal-mask' onClick={closeCommentModal}></View>
          <View className='comment-modal-content'>
            <View className='comment-modal-header'>
              <Text className='comment-modal-title'>
                {replyToComment ? `回复 ${replyToComment.user?.nickname || '用户'}` : '发表评论'}
              </Text>
            </View>
            <View className='comment-modal-body'>
              <Input
                className='comment-modal-input'
                type='text'
                placeholder='写下你的评论...'
                value={commentText}
                onInput={e => setCommentText(e.detail.value)}
                style={{ borderColor: commentText ? theme.primaryColor : '#eaeaea' }}
              />
            </View>
            <View className='comment-modal-footer'>
              <View 
                className='comment-modal-btn cancel'
                onClick={closeCommentModal}
              >
                取消
              </View>
              <View 
                className='comment-modal-btn primary'
                onClick={submitComment}
                style={{
                  backgroundColor: theme.primaryColor,
                  boxShadow: `0 2px 8px ${hexToRgba(theme.primaryColor, 0.3)}`
                }}
              >
                发布
              </View>
            </View>
          </View>
        </View>
      )}
    </>
  );
};

export default CommentSection;
export { CommentInput };
