import { View, Text, Image, Input } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import api from '../../services/api';
import { Comment, CommentAction, CommentSectionProps } from './interfaces';
import './index.scss';

// 默认头像
const DEFAULT_AVATAR = 'https://api.dicebear.com/6.x/initials/svg?seed=TD';

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
  
  // 评论弹窗相关状态
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
  const [activeComment, setActiveComment] = useState<Comment | null>(null);

  useEffect(() => {
    if (diaryId) {
      fetchComments(diaryId);
    }
  }, [diaryId]);

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
    
    // 如果没有用户ID，尝试再次获取
    if (!currentUserId) {
      console.log('尝试重新获取用户信息');
      try {
        const currentUser = await api.user.getCurrentUser();
        if (currentUser) {
          const userId = currentUser._id || currentUser.id || currentUser.userId;
          if (userId) {
            console.log('获取到用户ID:', userId);
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
    if (!diaryId) return;
    
    console.log('提交评论，当前用户ID:', currentUserId);
    
    // 检查登录状态，尝试多种方法
    const token = Taro.getStorageSync('token');
    
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
    </>
  );
};

export default CommentSection; 