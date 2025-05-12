import { View, Image, Text, Video } from '@tarojs/components';
import { useEffect, useState, CSSProperties, useRef, useCallback } from 'react';
import { getOptimizedImageUrl, getPlaceholderImage } from '../../utils/imageOptimizer';
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
  location?: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  distance?: number;
  distanceText?: string;
}

interface WaterfallFlowProps {
  items: DiaryItem[];
  diaryList?: DiaryItem[]; // 保留兼容旧代码
  onItemClick: (id: string) => void;
  showStatus?: boolean; // 是否显示状态标签
  columnGap?: number;
  style?: CSSProperties;
  locationBadge?: boolean;
}

const WaterfallFlow: React.FC<WaterfallFlowProps> = ({ 
  items, 
  diaryList, 
  onItemClick, 
  showStatus = false,
  columnGap = 10,
  style = {},
  locationBadge = false
}) => {
  // 兼容两种属性名
  const diaryItems = items || diaryList || [];
  
  // 将数据分成左右两列
  const [leftColumn, setLeftColumn] = useState<DiaryItem[]>([]);
  const [rightColumn, setRightColumn] = useState<DiaryItem[]>([]);
  
  // 记录已加载的图片
  const loadedImages = useRef<Set<string>>(new Set());

  // 优化图片URL，添加宽度参数
  const optimizeImageUrl = useCallback((url: string): string => {
    return getOptimizedImageUrl(url, 360); // 设置适合手机屏幕的宽度
  }, []);

  // 优化作者头像URL
  const optimizeAvatarUrl = useCallback((url: string): string => {
    return getOptimizedImageUrl(url, 60, 90); // 头像尺寸较小，质量可以稍高
  }, []);

  // 获取占位图
  const getImagePlaceholder = useCallback((width: number, height: number): string => {
    return getPlaceholderImage(width, height);
  }, []);

  useEffect(() => {
    const left: DiaryItem[] = [];
    const right: DiaryItem[] = [];

    // 使用更智能的分列方式，避免一列过高
    let leftHeight = 0;
    let rightHeight = 0;

    diaryItems.forEach((item) => {
      // 估算高度: 随机基础高度 + 标题预估高度
      const titleLength = item.title ? item.title.length : 0;
      const estimatedHeight = Math.floor(Math.random() * 80) + 200 + (titleLength * 0.5);
      
      // 将新项目添加到高度较小的列
      if (leftHeight <= rightHeight) {
        left.push(item);
        leftHeight += estimatedHeight;
      } else {
        right.push(item);
        rightHeight += estimatedHeight;
      }
    });

    setLeftColumn(left);
    setRightColumn(right);
  }, [diaryItems]);

  const handleItemClick = useCallback((item: DiaryItem) => {
    // 确保ID存在且有效
    if (item && item.id) {
      onItemClick(item.id);
    }
  }, [onItemClick]);

  // 图片加载完成的处理函数
  const handleImageLoad = useCallback((url: string) => {
    loadedImages.current.add(url);
  }, []);

  // 获取状态标签的文本和样式
  const getStatusLabel = useCallback((status?: string) => {
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
  }, []);

  // 默认头像
  const defaultAvatar = 'https://api.dicebear.com/6.x/initials/svg?seed=TD';

  const renderDiaryItem = useCallback((item: DiaryItem) => {
    const statusInfo = getStatusLabel(item.status);
    // 生成随机高度让瀑布流更自然
    const imageHeight = Math.floor(Math.random() * 80) + 200; // 200-280px之间的随机高度

    // 判断是否有视频（确保空字符串不被视为有效视频）
    const hasVideo = !!(item.videoUrl && item.videoUrl.trim() !== '');
    
    // 是否视频直接作为封面
    const isVideoCover = hasVideo && item.coverImage === item.videoUrl;
    
    // 优化图片URL
    const optimizedCoverImage = !isVideoCover ? optimizeImageUrl(item.coverImage) : '';
    const optimizedAvatar = item.authorAvatar ? optimizeAvatarUrl(item.authorAvatar) : defaultAvatar;

    return (
      <View
        className='diary-item'
        key={item.id}
        onClick={() => handleItemClick(item)}
      >
        {/* 封面区域 */}
        <View className='diary-cover-container'>
          {isVideoCover ? (
            // 使用视频作为封面
            <>
              <Video
                className='diary-cover'
                src={item.videoUrl!}
                controls={false}
                autoplay={false}
                loop={true}
                muted={true}
                showPlayBtn={false}
                enableProgressGesture={false}
                style={{ height: `${imageHeight}px` }}
                objectFit='cover'
                initialTime={0.1} // 避免显示视频第一帧
              />
              {/* 视频封面悬停时显示的播放按钮 */}
              <View className='video-play-button'>
                <View className='video-play-icon'>▶</View>
              </View>
            </>
          ) : (
            // 使用图片作为封面
            <Image
              className='diary-cover'
              src={optimizedCoverImage}
              mode='aspectFill'
              style={{ height: `${imageHeight}px` }}
              lazyLoad={true}
              onLoad={() => handleImageLoad(item.coverImage)}
            />
          )}

          {/* 视频标识 - 只在使用图片作为封面且有视频时显示 */}
          {hasVideo && !isVideoCover && (
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
          
          {/* 距离标签 */}
          {locationBadge && item.distanceText && (
            <View className='location-badge'>
              <Text className='location-text'>{item.distanceText}</Text>
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
                src={optimizedAvatar}
                mode='aspectFill'
                lazyLoad={true}
                onLoad={() => handleImageLoad(item.authorAvatar || defaultAvatar)}
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
  }, [
    getStatusLabel, 
    handleImageLoad, 
    handleItemClick, 
    locationBadge, 
    optimizeAvatarUrl, 
    optimizeImageUrl, 
    showStatus,
    getImagePlaceholder,
    defaultAvatar
  ]);

  return (
    <View className='waterfall-container' style={style}>
      <View 
        className='waterfall-column left-column'
        style={{ marginRight: `${columnGap / 2}px` }}
      >
        {leftColumn.map(renderDiaryItem)}
      </View>
      <View 
        className='waterfall-column right-column'
        style={{ marginLeft: `${columnGap / 2}px` }}
      >
        {rightColumn.map(renderDiaryItem)}
      </View>
    </View>
  );
};

export default WaterfallFlow;
