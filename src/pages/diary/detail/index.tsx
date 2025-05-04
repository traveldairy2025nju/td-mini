import { View, Text, Image, ScrollView, Video } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import api from '../../../services/api';
import './index.scss';

interface DiaryDetail {
  id: string;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  views: number;
  likes: number;
}

function DiaryDetail() {
  const router = useRouter();
  console.log('详情页 - 完整router对象:', JSON.stringify(router));

  let id: string | undefined;
  if (router && router.params) {
    id = router.params.id;
    console.log('详情页 - 从router获取的ID:', id);
  } else {
    console.error('详情页 - 无法获取router参数');
  }

  const [diary, setDiary] = useState<DiaryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('详情页 - useEffect中的ID:', id);
    if (id) {
      fetchDiaryDetail(id);
    } else {
      console.error('详情页 - ID不存在或无效');
      Taro.showToast({
        title: '游记ID不存在',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        Taro.navigateBack();
      }, 2000);
    }
  }, [id]);

  const fetchDiaryDetail = async (diaryId: string) => {
    try {
      setLoading(true);
      console.log(`详情页 - 开始请求游记详情, ID: ${diaryId}`);

      const res = await api.diary.getDetail(diaryId);
      console.log('详情页 - API响应:', res);

      if (res.success && res.data) {
        const diaryData = res.data;
        setDiary({
          id: diaryData._id,
          title: diaryData.title,
          content: diaryData.content,
          images: diaryData.images || [],
          videoUrl: diaryData.video,
          authorName: diaryData.author?.nickname || '未知用户',
          authorAvatar: diaryData.author?.avatar || 'https://placeholder.com/150',
          createdAt: diaryData.createdAt || '',
          views: diaryData.views || 0,
          likes: diaryData.likes || 0
        });
      } else {
        throw new Error(res.message || '获取游记详情失败');
      }
    } catch (error) {
      console.error('获取游记详情失败', error);
      Taro.showToast({
        title: error instanceof Error ? error.message : '获取游记详情失败',
        icon: 'none'
      });
      setTimeout(() => {
        Taro.navigateBack();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  if (loading) {
    return (
      <View className='loading-container'>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!diary) {
    return (
      <View className='error-container'>
        <Text>游记不存在或已被删除</Text>
      </View>
    );
  }

  return (
    <ScrollView className='diary-detail-container' scrollY>
      <View className='diary-header'>
        <Text className='diary-title'>{diary.title}</Text>
        <View className='author-info'>
          <Image className='author-avatar' src={diary.authorAvatar} mode='aspectFill' />
          <View className='author-meta'>
            <Text className='author-name'>{diary.authorName}</Text>
            <Text className='publish-date'>{formatDate(diary.createdAt)}</Text>
          </View>
        </View>
      </View>

      <View className='diary-content'>
        <Text className='content-text'>{diary.content}</Text>
      </View>

      {diary.images.length > 0 && (
        <View className='image-gallery'>
          {diary.images.map((image, index) => (
            <Image
              key={index}
              className='gallery-image'
              src={image}
              mode='widthFix'
              onClick={() => {
                Taro.previewImage({
                  current: image,
                  urls: diary.images
                });
              }}
            />
          ))}
        </View>
      )}

      {diary.videoUrl && (
        <View className='video-container'>
          <Video
            src={diary.videoUrl}
            className='content-video'
            controls={true}
            showFullscreenBtn={true}
          />
        </View>
      )}

      <View className='diary-stats'>
        <View className='stat-item'>
          <Text className='stat-icon'>👁️</Text>
          <Text className='stat-value'>{diary.views} 浏览</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-icon'>❤️</Text>
          <Text className='stat-value'>{diary.likes} 赞</Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default DiaryDetail;
