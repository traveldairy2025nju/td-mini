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
  children?: Comment[];
  replies?: Comment[];
  likeCount?: number; // 评论点赞数
  isLiked?: boolean; // 当前用户是否已点赞
}

// 评论操作类型
export type CommentAction = 'reply' | 'delete' | 'copy' | 'like';

// 评论组件Props
export interface CommentSectionProps {
  diaryId: string;
  currentUserId: string | null;
  userInfo: any;
  formatDate: (dateString: string) => string;
}
