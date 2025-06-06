import { View, Text, Input, Image } from '@tarojs/components';
import { useState, useRef, useEffect } from 'react';
import Taro from '@tarojs/taro';
import api from '../../services/api';
import WaterfallFlow from '../../components/WaterfallFlow';
import router from '../../routes';
import './index.scss';

// SVG图标定义
const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

// 生成SVG的data URL
const getSvgDataUrl = (svgContent: string, color: string) => {
  const encodedSvg = encodeURIComponent(svgContent.replace('currentColor', color));
  return `data:image/svg+xml,${encodedSvg}`;
};

// 游记项目类型
interface DiaryItem {
  id: string;
  title: string;
  coverImage: string;
  videoUrl?: string;  // 添加视频URL字段
  authorName: string;
  likeCount: number;
  viewCount: number;
  createdAt: string;
}

function Search() {
  const [keyword, setKeyword] = useState('');
  const [diaryList, setDiaryList] = useState<DiaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    console.log('搜索页面已加载');
  }, []);

  // 清空搜索
  const handleClearSearch = () => {
    console.log('清空搜索');
    setKeyword('');
    setDiaryList([]);
    setSearched(false);
  };

  // 处理搜索
  const handleSearch = async () => {
    if (!keyword.trim()) {
      Taro.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }

    console.log('准备搜索关键词:', keyword);
    try {
      setLoading(true);
      setSearched(true);
      const res = await api.diary.searchDiaries(keyword);
      console.log('搜索结果:', res);

      if (res.success && res.data && res.data.items) {
        // 格式化返回的数据
        const formattedDiaries = res.data.items.map(item => {
          // 判断是否有视频
          const hasVideo = !!item.video;
          
          // 封面图片处理：
          // 1. 如果有视频，直接使用视频作为封面
          // 2. 如果没有视频，则使用第一张图片
          let coverImage = 'https://placeholder.com/300'; // 默认占位图
          
          if (hasVideo) {
            // 使用视频本身的URL作为封面
            coverImage = item.video;
          } else if (item.images && item.images.length > 0) {
            // 没有视频，使用第一张图片
            coverImage = item.images[0];
          }

          return {
            id: item._id,
            title: item.title || '无标题',
            coverImage: coverImage,
            videoUrl: item.video || undefined,  // 添加视频URL
            authorName: item.author?.nickname || '未知用户',
            likeCount: item.likes || 0,
            viewCount: item.views || 0,
            createdAt: item.createdAt || ''
          };
        });

        setDiaryList(formattedDiaries);
        console.log('格式化后的搜索结果:', formattedDiaries);
      } else {
        setDiaryList([]);
        throw new Error(res.message || '搜索失败');
      }
    } catch (error) {
      console.error('搜索失败', error);
      Taro.showToast({
        title: '搜索失败，请重试',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理输入变化 - 使用防抖
  const handleInputChange = (e) => {
    const value = e.detail.value;
    setKeyword(value);

    // 防抖处理，避免频繁请求
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        handleSearch();
      }, 500);
    }
  };

  // 点击游记项目，跳转到详情页
  const handleDiaryItemClick = (id: string) => {
    router.navigateToDiaryDetail(id);
  };

  // 渲染搜索结果
  const renderSearchResult = () => {
    if (loading) {
      return (
        <View className='loading-container'>搜索中...</View>
      );
    }

    if (diaryList.length === 0 && searched) {
      return (
        <View className='empty-container'>
          <Text className='empty-icon'>🔍</Text>
          <Text className='empty-text'>未找到相关游记</Text>
        </View>
      );
    }

    if (!searched) {
      return (
        <View className='empty-container'>
          <Text className='empty-icon'>🔍</Text>
          <Text className='empty-text'>输入关键词搜索游记</Text>
        </View>
      );
    }

    return (
      <WaterfallFlow
        items={diaryList}
        onItemClick={handleDiaryItemClick}
      />
    );
  };

  return (
    <View className='search-page'>
      <View className='search-header'>
        <Image
          className='search-icon'
          src={require('../../assets/icons/search.svg')}
          style={{ width: '32px', height: '32px' }}
        />
        <Input
          className='search-input'
          value={keyword}
          placeholder='搜索游记、作者、内容'
          onInput={handleInputChange}
          confirmType='search'
          onConfirm={handleSearch}
        />
        {keyword && (
          <Image 
            className='clear-icon'
            src={getSvgDataUrl(CLOSE_ICON, '#999999')}
            style={{ width: '32px', height: '32px' }}
            onClick={handleClearSearch}
          />
        )}
      </View>

      <View className='search-result'>
        {renderSearchResult()}
      </View>
    </View>
  );
}

export default Search; 