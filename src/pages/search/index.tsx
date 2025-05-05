import { View, Text, Input } from '@tarojs/components';
import { useState, useRef, useEffect } from 'react';
import Taro from '@tarojs/taro';
import api from '../../services/api';
import WaterfallFlow from '../../components/WaterfallFlow';
import './index.scss';

// 游记项目类型
interface DiaryItem {
  id: string;
  title: string;
  coverImage: string;
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
        const formattedDiaries = res.data.items.map(item => ({
          id: item._id,
          title: item.title || '无标题',
          coverImage: item.images?.[0] || 'https://placeholder.com/300',
          authorName: item.author?.nickname || '未知用户',
          likeCount: item.likes || 0,
          viewCount: item.views || 0,
          createdAt: item.createdAt || ''
        }));

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
    Taro.navigateTo({ url: `/pages/diary/detail/index?id=${id}` });
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
        diaryList={diaryList}
        onItemClick={handleDiaryItemClick}
      />
    );
  };

  return (
    <View className='search-page'>
      <View className='search-header'>
        <Text className='search-icon'>🔍</Text>
        <Input
          className='search-input'
          value={keyword}
          placeholder='搜索游记、作者、内容'
          onInput={handleInputChange}
          confirmType='search'
          onConfirm={handleSearch}
        />
        {keyword && (
          <Text 
            className='clear-icon'
            onClick={handleClearSearch}
          >✖️</Text>
        )}
      </View>

      <View className='search-result'>
        {renderSearchResult()}
      </View>
    </View>
  );
}

export default Search; 