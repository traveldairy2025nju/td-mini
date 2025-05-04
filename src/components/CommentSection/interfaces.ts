export interface Comment {
  id?: string;
  _id?: string;
  content: string;
  createdAt: string;
  diary?: string;
  parentComment?: string | null;
  user?: {
    _id: string;
    username?: string;
    nickname: string;
    avatar: string;
  };
}

// 评论操作类型
export type CommentAction = 'reply' | 'delete' | 'copy';

// 评论组件Props
export interface CommentSectionProps {
  diaryId: string;
  currentUserId: string | null;
  userInfo: any;
  formatDate: (dateString: string) => string;
} 