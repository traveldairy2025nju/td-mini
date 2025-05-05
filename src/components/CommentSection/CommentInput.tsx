import { View, Text } from '@tarojs/components';
import { useState } from 'react';
import { Comment } from './interfaces';
import './CommentInput.scss';

interface CommentInputProps {
  onOpenCommentModal: () => void;
  liked: boolean;
  collected: boolean;
  onLike: () => void;
  onCollect: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onOpenCommentModal,
  liked,
  collected,
  onLike,
  onCollect
}) => {
  return (
    <View className='fixed-footer'>
      <View className='comment-input-area' onClick={onOpenCommentModal}>
        <Text className='comment-placeholder'>写下你的评论...</Text>
      </View>
      <View className='action-buttons'>
        <View
          className={`action-button ${liked ? 'active' : ''}`}
          onClick={onLike}
          hoverClass='action-button-hover'
        >
          <Text className='action-icon'>{liked ? '❤️' : '🤍'}</Text>
          <Text className='action-text'>{liked ? '已赞' : '点赞'}</Text>
        </View>
        <View
          className={`action-button ${collected ? 'active' : ''}`}
          onClick={onCollect}
          hoverClass='action-button-hover'
        >
          <Text className='action-icon'>{collected ? '⭐' : '☆'}</Text>
          <Text className='action-text'>{collected ? '已收藏' : '收藏'}</Text>
        </View>
      </View>
    </View>
  );
};

export default CommentInput;
