import { View, Text, Image } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import useUserStore from '../../store/user';
import { checkLogin } from '../../utils/auth';
import api from '../../services/api';
import WaterfallFlow from '../../components/WaterfallFlow';
import Button from '../../components/taro-ui/Button';
import './index.scss';

// 游记项目类型
interface DiaryItem {
  id: string;
  title: string;
  coverImage: string;
  authorName: string;
  likeCount: number;
  createdAt: string;
  status?: 'pending' | 'approved' | 'rejected';
}

function My() {
  // 从zustand中获取状态和方法
  const {
    userInfo,
    isLogin,
    isLoading,
    updateProfile
  } = useUserStore();

  // 活动标签状态
  const [activeTab, setActiveTab] = useState<'diaries' | 'favorites'>('diaries');
  // 游记列表
  const [diaries, setDiaries] = useState<DiaryItem[]>([]);
  // 收藏游记列表
  const [favorites, setFavorites] = useState<DiaryItem[]>([]);
  // 游记加载状态
  const [loadingDiaries, setLoadingDiaries] = useState(false);
  // 收藏加载状态
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  // 游记状态过滤
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // 页面显示时通知TabBar更新
  useDidShow(() => {
    // 触发TabBar更新事件
    Taro.eventCenter.trigger('tabIndexChange', 1);

    // 页面每次显示时重新获取数据
    if (checkLogin()) {
      fetchMyDiaries();
      if (activeTab === 'favorites') {
        fetchFavorites();
      }
    }
  });

  // 添加事件监听器
  useEffect(() => {
    // 监听刷新我的页面事件
    const refreshHandler = () => {
      if (checkLogin()) {
        if (activeTab === 'favorites') {
          fetchFavorites();
        } else {
          fetchMyDiaries();
        }
      }
    };

    // 注册事件
    Taro.eventCenter.on('refreshMyPage', refreshHandler);

    // 清理函数
    return () => {
      Taro.eventCenter.off('refreshMyPage', refreshHandler);
    };
  }, [activeTab]);

  useEffect(() => {
    // 检查登录状态
    if (checkLogin()) {
      updateProfile();
      fetchMyDiaries();
    }
  }, []);

  // 添加监听activeTab变化，切换到收藏标签时自动加载收藏列表
  useEffect(() => {
    if (activeTab === 'favorites' && checkLogin()) {
      fetchFavorites();
    }
  }, [activeTab]);

  // 更新头像
  const handleUpdateAvatar = () => {
    if (checkLogin()) {
      Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0];

          try {
            Taro.showLoading({ title: '上传中...' });
            await useUserStore.getState().updateAvatar(tempFilePath);

            Taro.showToast({
              title: '头像更新成功',
              icon: 'success',
              duration: 2000
            });
          } catch (error) {
            Taro.showToast({
              title: '上传头像失败',
              icon: 'none',
              duration: 2000
            });
          } finally {
            Taro.hideLoading();
          }
        }
      });
    }
  };

  // 前往设置页面
  const goToSettings = () => {
    if (checkLogin()) {
      Taro.navigateTo({ url: '/pages/settings/index' });
    }
  };

  // 处理状态过滤变化
  const handleStatusFilterChange = (status: 'all' | 'pending' | 'approved' | 'rejected') => {
    setStatusFilter(status);
    // 直接传递新状态给fetchMyDiaries，而不是依赖状态更新后再调用
    fetchMyDiaries(status);
  };

  // 获取我的游记列表
  const fetchMyDiaries = async (statusToFilter?: 'all' | 'pending' | 'approved' | 'rejected') => {
    if (!checkLogin()) return;

    try {
      setLoadingDiaries(true);
      // 使用传入的状态参数或当前状态
      const currentStatus = statusToFilter || statusFilter;
      // 添加时间戳参数避免缓存
      const res = await api.diary.getUserDiaries(currentStatus);

      if (res.success && res.data) {
        // 转换API返回的数据为组件需要的格式
        const formattedDiaries = res.data.items.map(item => {
          return {
            id: item._id,
            title: item.title || '无标题',
            coverImage: item.images?.[0] || 'https://placeholder.com/300',
            authorName: userInfo?.nickname || '我',
            likeCount: item.likeCount || 0,
            createdAt: item.createdAt || '',
            status: item.status
          };
        });
        setDiaries(formattedDiaries);
      }
    } catch (error) {
      Taro.showToast({
        title: '获取游记失败',
        icon: 'none'
      });
    } finally {
      setLoadingDiaries(false);
    }
  };

  // 获取我的收藏列表
  const fetchFavorites = async () => {
    // 检查登录状态，确保token存在
    const token = Taro.getStorageSync('token');
    if (!token) {
      setFavorites([]);
      setLoadingFavorites(false);
      return;
    }

    try {
      setLoadingFavorites(true);
      // 调用API，设置较大的limit值确保能获取更多数据
      const res = await api.diary.getFavorites(1, 20);

      if (res.success && res.data) {
        // 先检查data.list，如果不存在再尝试data.items
        const itemsArray = res.data.list || res.data.items || [];

        // 转换API返回的数据为组件需要的格式
        const formattedFavorites = itemsArray.map((item) => {
          // 确保有有效的封面图
          let coverImage = '';
          if (item.images && Array.isArray(item.images) && item.images.length > 0) {
            coverImage = item.images[0];
          }

          return {
            id: item._id,
            title: item.title || '无标题',
            coverImage: coverImage || 'https://placeholder.com/300',
            authorName: item.author?.nickname || '未知用户',
            likeCount: item.likeCount || 0,
            createdAt: item.createdAt || '',
            status: item.status
          };
        });

        setFavorites(formattedFavorites);
      } else {
        setFavorites([]);
        // 显示错误提示
        if (res.message) {
          Taro.showToast({
            title: res.message,
            icon: 'none',
            duration: 2000
          });
        }
      }
    } catch (error) {
      setFavorites([]);
      const errorMessage = error instanceof Error ? error.message : '网络异常，请稍后再试';
      Taro.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 2000
      });
    } finally {
      setLoadingFavorites(false);
    }
  };

  // 点击游记进入详情
  const handleDiaryClick = (id: string) => {
    if (!id) {
      Taro.showToast({
        title: '游记ID无效',
        icon: 'none'
      });
      return;
    }
    Taro.navigateTo({ url: `/pages/diary/detail/index?id=${id}` });
  };

  // 渲染未登录状态
  const renderNotLoggedIn = () => (
    <View className='my-not-login'>
      <Text className='my-login-tip'>您还未登录</Text>
      <Button
        type='primary'
        className='my-login-button'
        onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}
      >
        去登录
      </Button>
    </View>
  );

  // 渲染个人信息部分
  const renderProfileSection = () => (
    <View className='my-profile-section'>
      <View className='my-header'>
        <View className='my-avatar-wrapper' onClick={handleUpdateAvatar}>
          <Image
            className='my-avatar'
            src={userInfo?.avatar || 'https://placeholder.com/150'}
            mode='aspectFill'
          />
          <View className='my-avatar-edit'>
            <Text className='my-avatar-edit-text'>编辑</Text>
          </View>
        </View>
        <View className='my-info'>
          <Text className='my-nickname'>{userInfo?.nickname || '游客'}</Text>
          <Text className='my-username'>@{userInfo?.username || ''}</Text>
        </View>
        <View className='settings-icon' onClick={goToSettings}>
          <Text className='iconfont icon-settings'></Text>
        </View>
      </View>
    </View>
  );

  // 渲染状态过滤器
  const renderStatusFilter = () => (
    <View className='status-filter'>
      <Text
        className={`status-filter-item ${statusFilter === 'all' ? 'active' : ''}`}
        onClick={() => handleStatusFilterChange('all')}
      >
        全部
      </Text>
      <Text
        className={`status-filter-item ${statusFilter === 'pending' ? 'active' : ''}`}
        onClick={() => handleStatusFilterChange('pending')}
      >
        待审核
      </Text>
      <Text
        className={`status-filter-item ${statusFilter === 'approved' ? 'active' : ''}`}
        onClick={() => handleStatusFilterChange('approved')}
      >
        已通过
      </Text>
      <Text
        className={`status-filter-item ${statusFilter === 'rejected' ? 'active' : ''}`}
        onClick={() => handleStatusFilterChange('rejected')}
      >
        已拒绝
      </Text>
    </View>
  );

  // 渲染我的游记/收藏Tabbar
  const renderContentTabs = () => (
    <View className='content-tabs'>
      <View
        className={`tab-item ${activeTab === 'diaries' ? 'active' : ''}`}
        onClick={() => setActiveTab('diaries')}
      >
        <Text>我的游记</Text>
        {activeTab === 'diaries' && <View className='tab-line'></View>}
      </View>
      <View
        className={`tab-item ${activeTab === 'favorites' ? 'active' : ''}`}
        onClick={() => setActiveTab('favorites')}
      >
        <Text>我的收藏</Text>
        {activeTab === 'favorites' && <View className='tab-line'></View>}
      </View>
    </View>
  );

  // 渲染游记列表
  const renderDiaryList = () => (
    <View className='diary-list'>
      {loadingDiaries ? (
        <View className='loading-container'>加载中...</View>
      ) : diaries.length > 0 ? (
        <WaterfallFlow
          diaryList={diaries}
          onItemClick={handleDiaryClick}
          showStatus={true}
        />
      ) : (
        <View className='empty-container'>
          <Text className='empty-text'>暂无游记，快去创建一篇吧！</Text>
          <Button
            type='primary'
            className='create-diary-btn'
            onClick={() => Taro.navigateTo({ url: '/pages/create-diary/index' })}
          >
            创建游记
          </Button>
        </View>
      )}
    </View>
  );

  // 渲染收藏列表
  const renderFavoritesList = () => (
    <View className='favorites-list'>
      {loadingFavorites ? (
        <View className='loading-container'>加载中...</View>
      ) : favorites.length > 0 ? (
        <WaterfallFlow
          diaryList={favorites}
          onItemClick={handleDiaryClick}
          showStatus={false}
        />
      ) : (
        <View className='empty-container'>
          <Text className='empty-text'>暂无收藏游记，快去浏览发现更多精彩内容吧！</Text>
          <Button
            type='primary'
            className='create-diary-btn'
            onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
          >
            探索游记
          </Button>
        </View>
      )}
    </View>
  );

  return (
    <View className='my-container'>
      {/* 未登录状态 */}
      {!isLoading && !isLogin && renderNotLoggedIn()}

      {/* 已登录状态 */}
      {isLogin && (
        <>
          {/* 个人信息部分 */}
          {renderProfileSection()}

          {/* 内容区域 */}
          <View className='my-content'>
            {/* 切换标签 */}
            {renderContentTabs()}

            {/* 游记内容区域 */}
            {activeTab === 'diaries' && (
              <View className='tab-content'>
                {/* 状态过滤器 */}
                {renderStatusFilter()}

                {/* 游记列表 */}
                {renderDiaryList()}
              </View>
            )}

            {/* 收藏内容区域 */}
            {activeTab === 'favorites' && (
              <View className='tab-content'>
                {renderFavoritesList()}
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

export default My;
