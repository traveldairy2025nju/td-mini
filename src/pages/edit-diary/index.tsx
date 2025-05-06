import { View, Text, Image, ScrollView, Canvas, Video } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import api from '../../services/api';
import Input from '../../components/taro-ui/Input';
import Button from '../../components/taro-ui/Button';
import Textarea from '../../components/taro-ui/Textarea';
import { getThemeColors } from '../../utils/themeManager';
import { hexToRgba } from '../../utils/colorUtils';
import './index.scss';

// 表单数据类型
interface FormData {
  title: string;
  content: string;
  images: string[];
  videoUrl: string;
}

// 表单错误类型
interface FormErrors {
  title?: string;
  content?: string;
  images?: string;
  videoUrl?: string;
}

function EditDiary() {
  const theme = getThemeColors();
  const router = useRouter();
  const diaryId = router?.params?.id;

  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    images: [],
    videoUrl: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (diaryId) {
      fetchDiaryDetail(diaryId);
    } else {
      Taro.showToast({
        title: '游记ID不存在',
        icon: 'none'
      });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    }
  }, [diaryId]);

  // 获取游记详情
  const fetchDiaryDetail = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.diary.getDetail(id);
      
      if (res.success && res.data) {
        const diaryData = res.data;
        setFormData({
          title: diaryData.title || '',
          content: diaryData.content || '',
          images: Array.isArray(diaryData.images) ? diaryData.images : [],
          videoUrl: diaryData.video || diaryData.videoUrl || ''
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
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  // 处理表单字段变化
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应的错误信息
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 选择图片
  const handleChooseImage = async () => {
    try {
      // 计算还能选择的图片数量
      const remainingSlots = 9 - formData.images.length;
      if (remainingSlots <= 0) {
        Taro.showToast({
          title: '最多只能上传9张图片',
          icon: 'none'
        });
        return;
      }

      const res = await Taro.chooseImage({
        count: remainingSlots,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setUploadingImage(true);
        setErrors(prev => ({ ...prev, images: undefined }));

        // 上传多张图片
        const uploadPromises = res.tempFilePaths.map(path => api.diary.uploadImage(path));
        const uploadedUrls = await Promise.all(uploadPromises);
        const validUrls = uploadedUrls.filter(url => !!url); // 过滤无效的URL

        if (validUrls.length > 0) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...validUrls]
          }));
        }

        setUploadingImage(false);
      }
    } catch (error) {
      console.error('选择或上传图片失败', error);
      setUploadingImage(false);
    }
  };

  // 选择视频
  const handleChooseVideo = async () => {
    try {
      if (formData.videoUrl) {
        Taro.showToast({
          title: '只能上传一个视频',
          icon: 'none'
        });
        return;
      }

      const res = await Taro.chooseVideo({
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        camera: 'back'
      });

      if (res.tempFilePath) {
        setUploadingVideo(true);
        setErrors(prev => ({ ...prev, videoUrl: undefined }));

        const uploadedUrl = await api.diary.uploadVideo(res.tempFilePath);
        if (uploadedUrl) {
          setFormData(prev => ({
            ...prev,
            videoUrl: uploadedUrl
          }));
        }
        
        setUploadingVideo(false);
      }
    } catch (error) {
      console.error('选择或上传视频失败', error);
      setUploadingVideo(false);
    }
  };

  // 移除图片
  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // 移除视频
  const handleRemoveVideo = () => {
    setFormData(prev => ({
      ...prev,
      videoUrl: ''
    }));
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入游记标题';
    }

    if (!formData.content.trim()) {
      newErrors.content = '请输入游记内容';
    }

    if (formData.images.length === 0) {
      newErrors.images = '请至少上传一张图片';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm() || !diaryId) return;

    try {
      setIsSubmitting(true);

      // 准备提交的数据
      const submitData = {
        ...formData
      };

      // 如果videoUrl为空字符串，则不提交这个字段
      if (!submitData.videoUrl) {
        delete submitData.videoUrl;
      }

      // 验证videoUrl格式
      if (submitData.videoUrl && !submitData.videoUrl.match(/^https?:\/\/.+\..+/)) {
        Taro.showToast({
          title: '视频URL格式不正确',
          icon: 'none'
        });
        return;
      }

      console.log('更新的游记数据:', submitData);

      const result = await api.diary.update(diaryId, submitData);

      if (result.success) {
        Taro.showToast({
          title: '更新成功',
          icon: 'success',
          duration: 2000
        });

        // 刷新首页和我的页面，更新游记列表
        Taro.eventCenter.trigger('refreshHomePage');
        Taro.eventCenter.trigger('refreshMyPage');

        setTimeout(() => {
          // 返回到详情页，并传递刷新参数
          Taro.navigateBack({
            delta: 1,
            success: () => {
              const pages = Taro.getCurrentPages();
              const prevPage = pages[pages.length - 1];
              if (prevPage && prevPage.route && prevPage.route.includes('detail')) {
                // 设置刷新标志
                if (prevPage.$component && prevPage.$component.props && prevPage.$component.props.router &&
                    prevPage.$component.props.router.params) {
                  prevPage.$component.props.router.params.refresh = Date.now().toString();
                }
              }
            }
          });
        }, 1500);
      } else {
        throw new Error(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新游记失败', error);
      Taro.showToast({
        title: error instanceof Error ? error.message : '更新游记失败',
        icon: 'none'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className='loading-container'>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView className='edit-diary-container' scrollY>
      {/* 隐藏的Canvas用于处理图标 */}
      <Canvas canvasId={`iconCanvas_${Date.now()}`} style={{ position: 'absolute', left: '-9999px', width: '100px', height: '100px' }} />
      
      <View className='form-title'>编辑旅行日记</View>

      <View className='form-section'>
        <View className='input-field'>
          <Text className='input-label'>标题</Text>
          <Input
            name='title'
            type='text'
            value={formData.title}
            placeholder='请输入游记标题'
            onChange={(value) => handleChange('title', value)}
            error={!!errors.title}
          />
          {errors.title && <Text className='error-message'>{errors.title}</Text>}
        </View>

        <View className='input-field'>
          <Text className='input-label'>内容</Text>
          <Textarea
            className='content-textarea'
            value={formData.content}
            placeholder='请详细描述您的旅行经历...'
            onInput={(e) => handleChange('content', e.detail.value)}
          />
          {errors.content && <Text className='error-message'>{errors.content}</Text>}
        </View>

        <View className='media-upload-section'>
          <Text className='input-label'>上传图片</Text>
          <View className='image-preview-container'>
            {formData.images.map((url, index) => (
              <View key={`img-${index}`} className='image-preview-wrapper'>
                <Image 
                  className='image-preview' 
                  src={url} 
                  mode='aspectFill' 
                />
                <View 
                  className='image-remove-btn' 
                  onClick={() => handleRemoveImage(index)}
                >×</View>
              </View>
            ))}
            
            {formData.images.length < 9 && (
              <View 
                className='add-image-btn' 
                onClick={handleChooseImage}
              >
                {uploadingImage ? 
                  <Text className='uploading-text'>上传中...</Text> : 
                  <Text className='add-icon'>+</Text>
                }
              </View>
            )}
          </View>
          {errors.images && <Text className='error-message'>{errors.images}</Text>}
        </View>

        <View className='media-upload-section'>
          <Text className='input-label'>上传视频</Text>
          {formData.videoUrl ? (
            <View className='video-preview-wrapper'>
              <Video
                className='video-preview'
                src={formData.videoUrl}
                controls={true}
                showFullscreenBtn={true}
                showPlayBtn={true}
                objectFit='contain'
              />
              <View 
                className='video-remove-btn' 
                onClick={handleRemoveVideo}
              >×</View>
            </View>
          ) : (
            <View 
              className='add-video-btn' 
              onClick={handleChooseVideo}
            >
              {uploadingVideo ? 
                <Text className='uploading-text'>上传中...</Text> : 
                <>
                  <Text className='add-icon'>+</Text>
                  <Text className='add-video-text'>添加视频</Text>
                </>
              }
            </View>
          )}
        </View>
      </View>

      <View className='form-actions'>
        <View
          className={`submit-button ${isSubmitting || uploadingImage || uploadingVideo ? 'disabled' : ''}`}
          onClick={handleSubmit}
          style={{
            backgroundColor: theme.primaryColor,
            boxShadow: `0 2px 8px ${hexToRgba(theme.primaryColor, 0.3)}`
          }}
        >
          <Text className='submit-text'>{isSubmitting ? '提交中...' : '保存修改'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default EditDiary; 