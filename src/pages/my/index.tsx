import { View, Text, Image, Button } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import useUserStore from '../../store/user';
import { checkLogin } from '../../utils/auth';
import api from '../../services/api';
import WaterfallFlow from '../../components/WaterfallFlow';
import { getThemeColors, ThemeColors } from '../../utils/themeManager';
import { lightenColor } from '../../utils/colorUtils';
import router, { ROUTES } from '../../routes';
import './index.scss';

// SVG图标定义
const SETTINGS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

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
  videoUrl: string;
  authorName: string;
  authorAvatar?: string;
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

  // 添加当前主题状态
  const [theme, setTheme] = useState<ThemeColors>(getThemeColors());

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

    // 监听主题变化事件
    const themeChangeHandler = (newTheme: ThemeColors) => {
      setTheme(newTheme);
    };
    Taro.eventCenter.on('themeChange', themeChangeHandler);

    // 清理函数
    return () => {
      Taro.eventCenter.off('refreshMyPage', refreshHandler);
      Taro.eventCenter.off('themeChange', themeChangeHandler);
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
            
            // 更新成功后，重新获取最新的用户资料
            await updateProfile();

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
      router.navigateTo(ROUTES.SETTINGS);
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
            videoUrl: item.video || undefined, // 避免使用空字符串，使用undefined代替
            authorName: userInfo?.nickname || '我',
            authorAvatar: userInfo?.avatar || 'https://api.dicebear.com/6.x/initials/svg?seed=TD',
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

  // 获取收藏的游记列表
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
            id: item._id || item.id,
            title: item.title || '无标题',
            coverImage: coverImage,
            videoUrl: item.video || undefined, // 避免使用空字符串，使用undefined代替
            authorName: item.author?.nickname || '未知用户',
            authorAvatar: item.author?.avatar || 'https://api.dicebear.com/6.x/initials/svg?seed=TD',
            likeCount: item.likeCount || 0,
            createdAt: item.createdAt || ''
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
    router.navigateToDiaryDetail(id);
  };

  // 渲染未登录状态
  const renderNotLoggedIn = () => (
    <View className='my-not-login'>
      <Text className='my-login-tip'>您还未登录</Text>
      <Button
        type='primary'
        className='my-login-button'
        onClick={() => router.navigateToLogin()}
        style={{ backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }}
      >
        去登录
      </Button>
    </View>
  );

  // 渲染个人信息部分
  const renderProfileSection = () => (
    <View className='my-profile-section'>
      <View
        className='my-header'
        style={{
          background: `linear-gradient(135deg, ${lightenColor(theme.primaryColor, 0.6)} 0%, ${theme.primaryColor} 100%)`,
          boxShadow: `0 4px 12px ${theme.primaryColor}4d`
        }}
      >
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
          <Image
            src={require('../../assets/icons/settings.svg')}
            style={{ width: '32px', height: '32px' }}
          />
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
        style={statusFilter === 'all' ? { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor } : {}}
      >
        全部
      </Text>
      <Text
        className={`status-filter-item ${statusFilter === 'pending' ? 'active' : ''}`}
        onClick={() => handleStatusFilterChange('pending')}
        style={statusFilter === 'pending' ? { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor } : {}}
      >
        待审核
      </Text>
      <Text
        className={`status-filter-item ${statusFilter === 'approved' ? 'active' : ''}`}
        onClick={() => handleStatusFilterChange('approved')}
        style={statusFilter === 'approved' ? { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor } : {}}
      >
        已通过
      </Text>
      <Text
        className={`status-filter-item ${statusFilter === 'rejected' ? 'active' : ''}`}
        onClick={() => handleStatusFilterChange('rejected')}
        style={statusFilter === 'rejected' ? { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor } : {}}
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
        <Text style={activeTab === 'diaries' ? { color: theme.primaryColor } : {}}>我的游记</Text>
        {activeTab === 'diaries' && <View className='tab-line' style={{ backgroundColor: theme.primaryColor }}></View>}
      </View>
      <View
        className={`tab-item ${activeTab === 'favorites' ? 'active' : ''}`}
        onClick={() => setActiveTab('favorites')}
      >
        <Text style={activeTab === 'favorites' ? { color: theme.primaryColor } : {}}>我的收藏</Text>
        {activeTab === 'favorites' && <View className='tab-line' style={{ backgroundColor: theme.primaryColor }}></View>}
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
          items={diaries}
          onItemClick={handleDiaryClick}
          showStatus={true}
        />
      ) : (
        <View className='empty-container'>
          <Text className='empty-text'>暂无游记，快去创建一篇吧！</Text>
          <Button
            type='primary'
            className='create-diary-btn'
            onClick={() => router.navigateToCreateDiary()}
            style={{ backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }}
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
          items={favorites}
          onItemClick={handleDiaryClick}
          showStatus={false}
        />
      ) : (
        <View className='empty-container'>
          <Text className='empty-text'>暂无收藏游记，快去浏览发现更多精彩内容吧！</Text>
          <Button
            type='primary'
            className='create-diary-btn'
            onClick={() => router.switchToHome()}
            style={{ backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }}
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
