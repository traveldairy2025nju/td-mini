import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { ThemeColors, getThemeColors } from '../../utils/themeManager';
import { Comment } from './interfaces';
import './CommentInput.scss';

interface CommentInputProps {
  onOpenCommentModal: () => void;
  liked: boolean;
  collected: boolean;
  onLike: () => void;
  onCollect: () => void;
  onShare?: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onOpenCommentModal,
  liked,
  collected,
  onLike,
  onCollect,
  onShare
}) => {
  const [theme, setTheme] = useState<ThemeColors>(getThemeColors());

  useEffect(() => {
    // 监听主题变化事件
    const themeChangeHandler = (newTheme: ThemeColors) => {
      setTheme(newTheme);
    };
    Taro.eventCenter.on('themeChange', themeChangeHandler);
    
    // 清理函数
    return () => {
      Taro.eventCenter.off('themeChange', themeChangeHandler);
    };
  }, []);

  return (
    <View className='fixed-footer'>
      <View 
        className='comment-input-area' 
        onClick={onOpenCommentModal}
        style={{ boxShadow: `0 0 0 1px ${theme.primaryColor}22` }}
      >
        <Text className='comment-placeholder'>写下你的评论...</Text>
      </View>
      <View className='action-buttons'>
        <View
          className={`action-button ${liked ? 'active' : ''}`}
          onClick={onLike}
          hoverClass='action-button-hover'
        >
          <Text className='action-icon'>{liked ? '❤️' : '🤍'}</Text>
          <Text 
            className='action-text'
            style={liked ? { color: theme.primaryColor } : {}}
          >
            {liked ? '已赞' : '点赞'}
          </Text>
        </View>
        <View
          className={`action-button ${collected ? 'active' : ''}`}
          onClick={onCollect}
          hoverClass='action-button-hover'
        >
          <Text className='action-icon'>{collected ? '⭐' : '☆'}</Text>
          <Text 
            className='action-text'
            style={collected ? { color: theme.primaryColor } : {}}
          >
            {collected ? '已收藏' : '收藏'}
          </Text>
        </View>
        {onShare && (
          <View
            className='action-button'
            onClick={onShare}
            hoverClass='action-button-hover'
          >
            <Text className='action-icon'>📤</Text>
            <Text className='action-text'>分享</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CommentInput;
