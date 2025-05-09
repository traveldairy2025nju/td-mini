// 钩子函数入口文件
// 统一导出所有钩子函数，方便在组件中使用

import { useAuth } from './useAuth';
import { useTheme } from './useTheme';
import { useLocation } from './useLocation';
import { useDiary } from './useDiary';
import { useNearbyDiaries } from './useNearbyDiaries';
import { useRouter } from './useRouter';

export {
  useAuth,
  useTheme,
  useLocation,
  useDiary,
  useNearbyDiaries,
  useRouter
};

export * from './useAuth';
export * from './useTheme';
export * from './useLocation';
export * from './useDiary';
export * from './useNearbyDiaries';
export * from './useRouter';

// 导出类型
export type { DiaryItem } from './useDiary'; 