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
}

interface WaterfallFlowProps {
  diaryList: DiaryItem[];
  onItemClick: (id: string) => void;
}

const WaterfallFlow: React.FC<WaterfallFlowProps> = ({ diaryList, onItemClick }) => {
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

  const renderDiaryItem = (item: DiaryItem) => {
    return (
      <View
        className='diary-item'
        key={item.id}
        onClick={() => onItemClick(item.id)}
      >
        <Image className='diary-cover' src={item.coverImage} mode='aspectFill' />
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
