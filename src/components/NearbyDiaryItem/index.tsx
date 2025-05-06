import { View, Text, Image } from '@tarojs/components';
import './index.scss';

interface DiaryProps {
  id: string;
  title: string;
  coverImage: string;
  authorName: string;
  authorAvatar?: string;
  likeCount: number;
  distance?: number;
  distanceText?: string;
  location?: {
    name?: string;
    address?: string;
  };
  onClick?: (id: string) => void;
}

const NearbyDiaryItem: React.FC<DiaryProps> = ({
  id,
  title,
  coverImage,
  authorName,
  authorAvatar,
  likeCount,
  distance,
  distanceText,
  location,
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <View className='nearby-diary-item' onClick={handleClick}>
      <Image className='diary-cover' src={coverImage} mode='aspectFill' />
      <View className='diary-info'>
        <Text className='diary-title'>{title}</Text>

        {location && location.name && (
          <View className='diary-location'>
            <Text className='location-icon'>📍</Text>
            <Text className='location-name'>{location.name}</Text>
          </View>
        )}

        {distanceText && (
          <View className='diary-distance'>
            <Text className='distance-text'>距离: {distanceText}</Text>
          </View>
        )}

        <View className='diary-author'>
          <Image className='author-avatar' src={authorAvatar || 'https://api.dicebear.com/6.x/initials/svg?seed=TD'} mode='aspectFill' />
          <Text className='author-name'>{authorName}</Text>
          <View className='like-count'>
            <Text className='like-icon'>❤️</Text>
            <Text className='like-number'>{likeCount}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default NearbyDiaryItem;
