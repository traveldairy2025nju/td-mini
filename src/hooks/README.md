# 旅行日记应用 Hooks

本目录包含应用中使用的自定义hooks，用于抽象和重用组件逻辑。

## 主要hooks

### useAuth

处理认证相关的逻辑，包括登录、登出和权限检查。

```tsx
import { useAuth } from '../hooks';

function MyComponent() {
  const { 
    isLoggedIn,   // 是否已登录
    userInfo,     // 用户信息
    hasRole,      // 检查角色权限的函数
    isAdmin,      // 是否是管理员
    login,        // 登录函数
    logout,       // 登出函数
    checkLogin,   // 检查登录状态，未登录会跳转到登录页
    isLoading,    // 登录加载状态
    error         // 登录错误信息
  } = useAuth();
  
  // 使用示例
  if (!isLoggedIn) {
    return <LoginButton onClick={() => checkLogin()} />;
  }
  
  return <UserProfile user={userInfo} />;
}
```

### useTheme

处理主题相关的逻辑，提供主题颜色和颜色处理函数。

```tsx
import { useTheme } from '../hooks';

function MyComponent() {
  const { 
    theme,         // 当前主题颜色
    setTheme,      // 设置主题
    lightenColor,  // 颜色浅化函数
    hexToRgba      // hex颜色转rgba函数
  } = useTheme();
  
  // 使用示例
  return (
    <View 
      style={{
        backgroundColor: theme.primaryColor,
        borderColor: lightenColor(theme.primaryColor, 0.3),
        boxShadow: `0 4px 8px ${hexToRgba(theme.primaryColor, 0.5)}`
      }}
    >
      内容
    </View>
  );
}
```

### useLocation

处理位置相关的逻辑，提供获取位置和位置状态管理。

```tsx
import { useLocation } from '../hooks';

function MyComponent() {
  const { 
    location,       // 当前位置
    loading,        // 加载状态
    error,          // 错误信息
    getLocation,    // 获取位置函数
    hasLocation     // 是否已获取位置
  } = useLocation();
  
  // 使用示例
  useEffect(() => {
    if (!hasLocation) {
      getLocation();
    }
  }, []);
  
  if (loading) {
    return <Loading />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  return (
    <Map 
      latitude={location?.latitude} 
      longitude={location?.longitude}
    />
  );
}
```

### useDiary

处理日记列表相关的逻辑，提供获取、刷新和分页功能。

```tsx
import { useDiary } from '../hooks';

function MyComponent() {
  const { 
    diaries,       // 日记列表
    loading,       // 加载状态
    error,         // 错误信息
    fetchDiaries,  // 获取日记函数
    page,          // 当前页码
    totalPages,    // 总页数
    hasMore,       // 是否有更多页
    loadMore,      // 加载更多函数
    refresh        // 刷新函数
  } = useDiary();
  
  // 使用示例
  return (
    <View>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <DiaryList 
          items={diaries} 
          onLoadMore={hasMore ? loadMore : undefined}
          onRefresh={refresh}
        />
      )}
    </View>
  );
}
```

### useNearbyDiaries

处理附近日记相关的逻辑，结合位置信息获取附近的日记。

```tsx
import { useNearbyDiaries } from '../hooks';

function MyComponent() {
  const { 
    nearbyDiaries,         // 附近日记列表
    loading,               // 加载状态
    error,                 // 错误信息
    locationRequested,     // 是否已请求位置
    fetchNearbyDiaries,    // 获取附近日记函数
    refreshNearbyDiaries,  // 静默刷新函数
    page,                  // 当前页码
    totalPages,            // 总页数
    hasMore,               // 是否有更多页
    loadMore               // 加载更多函数
  } = useNearbyDiaries();
  
  // 使用示例
  return (
    <View>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <NearbyDiaryList 
          items={nearbyDiaries} 
          onLoadMore={hasMore ? loadMore : undefined}
          onRefresh={refreshNearbyDiaries}
        />
      )}
    </View>
  );
}
``` 