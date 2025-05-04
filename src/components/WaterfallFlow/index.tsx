import { View, Image, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import './index.scss';

interface DiaryItem {
  id: string;
  title: string;
  coverImage: string;
  authorName: string;
  likeCount: number;
  viewCount: number;
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
    console.log('WaterfallFlow - 收到游记列表:', diaryList);
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
    console.log('WaterfallFlow - 点击游记项:', item);
    // 确保ID存在且有效
    if (item && item.id) {
      console.log('WaterfallFlow - 传递ID:', item.id);
      onItemClick(item.id);
    } else {
      console.error('WaterfallFlow - 游记ID无效:', item);
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

  const renderDiaryItem = (item: DiaryItem) => {
    const statusInfo = getStatusLabel(item.status);

    return (
      <View
        className='diary-item'
        key={item.id}
        onClick={() => handleItemClick(item)}
      >
        <Image className='diary-cover' src={item.coverImage} mode='aspectFill' />
        {showStatus && item.status && (
          <View className={`status-label ${statusInfo.className}`}>
            {statusInfo.text}
          </View>
        )}
        <View className='diary-info'>
          <Text className='diary-title'>{item.title}</Text>
          <View className='diary-meta'>
            <Text className='diary-author'>{item.authorName}</Text>
            <View className='diary-stats'>
              <Text className='diary-likes'>{item.likeCount} 赞</Text>
              <Text className='diary-views'>{item.viewCount} 浏览</Text>
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
