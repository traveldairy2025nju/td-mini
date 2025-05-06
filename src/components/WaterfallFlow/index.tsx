import { View, Image, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import './index.scss';

interface DiaryItem {
  id: string;
  title: string;
  coverImage: string;
  videoUrl?: string; // 添加视频URL字段
  authorName: string;
  authorAvatar?: string; // 添加作者头像字段
  likeCount: number;
  createdAt: string;
  status?: 'pending' | 'approved' | 'rejected'; // 添加状态字段
}

interface WaterfallFlowProps {
  diaryList: DiaryItem[];
  onItemClick: (id: string) => void;
  showStatus?: boolean; // 是否显示状态标签
}

const WaterfallFlow: React.FC<WaterfallFlowProps> = ({ diaryList, onItemClick, showStatus = false }) => {
  // 将数据分成左右两列
  const [leftColumn, setLeftColumn] = useState<DiaryItem[]>([]);
  const [rightColumn, setRightColumn] = useState<DiaryItem[]>([]);

  useEffect(() => {
    const left: DiaryItem[] = [];
    const right: DiaryItem[] = [];

    // 简单的左右分列
    diaryList.forEach((item, index) => {
      if (index % 2 === 0) {
        left.push(item);
      } else {
        right.push(item);
      }
    });

    setLeftColumn(left);
    setRightColumn(right);
  }, [diaryList]);

  const handleItemClick = (item: DiaryItem) => {
    // 确保ID存在且有效
    if (item && item.id) {
      onItemClick(item.id);
    }
  };

  // 获取状态标签的文本和样式
  const getStatusLabel = (status?: string) => {
    switch(status) {
      case 'pending':
        return { text: '审核中', className: 'status-pending' };
      case 'approved':
        return { text: '已通过', className: 'status-approved' };
      case 'rejected':
        return { text: '已拒绝', className: 'status-rejected' };
      default:
        return { text: '', className: '' };
    }
  };

  // 默认头像
  const defaultAvatar = 'https://api.dicebear.com/6.x/initials/svg?seed=TD';

  const renderDiaryItem = (item: DiaryItem) => {
    const statusInfo = getStatusLabel(item.status);
    // 生成随机高度让瀑布流更自然
    const imageHeight = Math.floor(Math.random() * 80) + 200; // 200-280px之间的随机高度

    // 判断是否有视频
    const hasVideo = !!item.videoUrl;

    return (
      <View
        className='diary-item'
        key={item.id}
        onClick={() => handleItemClick(item)}
      >
        {/* 封面图片区域 */}
        <View className='diary-cover-container'>
          <Image
            className='diary-cover'
            src={item.coverImage}
            mode='aspectFill'
            style={{ height: `${imageHeight}px` }}
          />

          {/* 视频标识 */}
          {hasVideo && (
            <View className='video-indicator'>
              <View className='video-icon'>▶</View>
            </View>
          )}

          {/* 状态标签 */}
          {showStatus && item.status && (
            <View className={`status-label ${statusInfo.className}`}>
              {statusInfo.text}
            </View>
          )}
        </View>

        {/* 游记信息区域 */}
        <View className='diary-info'>
          {/* 游记标题 */}
          <Text className='diary-title'>{item.title}</Text>

          {/* 底部信息区域：头像、作者名称和点赞数 */}
          <View className='diary-footer'>
            <View className='author-info'>
              <Image
                className='author-avatar'
                src={item.authorAvatar || defaultAvatar}
                mode='aspectFill'
              />
              <Text className='author-name'>{item.authorName}</Text>
            </View>

            {/* 点赞数 */}
            <View className='like-info'>
              <Text className='like-icon'>❤️</Text>
              <Text className='like-count'>{item.likeCount}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className='waterfall-container'>
      <View className='waterfall-column left-column'>
        {leftColumn.map(renderDiaryItem)}
      </View>
      <View className='waterfall-column right-column'>
        {rightColumn.map(renderDiaryItem)}
      </View>
    </View>
  );
};

export default WaterfallFlow;
