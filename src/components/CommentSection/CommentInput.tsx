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
  likesCount?: number;
  favoritesCount?: number;
  isApproved?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onOpenCommentModal,
  liked,
  collected,
  onLike,
  onCollect,
  onShare,
  likesCount = 0,
  favoritesCount = 0,
  isApproved = true
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
          className={`action-button ${liked ? 'active' : ''} ${!isApproved ? 'disabled' : ''}`}
          onClick={isApproved ? onLike : undefined}
          hoverClass={isApproved ? 'action-button-hover' : ''}
        >
          <Text className='action-icon'>{liked ? '❤️' : '🤍'}</Text>
          <Text
            className='action-text'
            style={liked && isApproved ? { color: theme.primaryColor } : {}}
          >
            {likesCount}
          </Text>
        </View>
        <View
          className={`action-button ${collected ? 'active' : ''} ${!isApproved ? 'disabled' : ''}`}
          onClick={isApproved ? onCollect : undefined}
          hoverClass={isApproved ? 'action-button-hover' : ''}
        >
          <Text className='action-icon'>{collected ? '⭐' : '☆'}</Text>
          <Text
            className='action-text'
            style={collected && isApproved ? { color: theme.primaryColor } : {}}
          >
            {favoritesCount}
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
