import { View, Text, Textarea, ScrollView, Image, Video } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import Button from '../../components/taro-ui/Button';
import Input from '../../components/taro-ui/Input';
import api from '../../services/api';
import './index.scss';

interface FormData {
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
}

interface FormErrors {
  title?: string;
  content?: string;
  images?: string;
}

function CreateDiary() {
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

  // 处理表单变化
  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // 清除对应的错误信息
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 选择图片
  const handleChooseImage = async () => {
    if (formData.images.length >= 9) {
      Taro.showToast({
        title: '最多上传9张图片',
        icon: 'none'
      });
      return;
    }

    try {
      const res = await Taro.chooseImage({
        count: 9 - formData.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setUploadingImage(true);

        const uploadPromises = res.tempFilePaths.map(async (path) => {
          return await uploadImage(path);
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        const validUrls = uploadedUrls.filter(url => url) as string[];

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...validUrls]
        }));

        if (errors.images) {
          setErrors(prev => ({ ...prev, images: '' }));
        }
      }
    } catch (error) {
      console.error('选择图片失败', error);
    } finally {
      setUploadingImage(false);
    }
  };

  // 选择视频
  const handleChooseVideo = async () => {
    try {
      const res = await Taro.chooseVideo({
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        camera: 'back'
      });

      if (res.tempFilePath) {
        setUploadingVideo(true);

        const videoUrl = await uploadVideo(res.tempFilePath);
        if (videoUrl) {
          setFormData(prev => ({
            ...prev,
            videoUrl
          }));
        }
      }
    } catch (error) {
      console.error('选择视频失败', error);
    } finally {
      setUploadingVideo(false);
    }
  };

  // 上传图片
  const uploadImage = async (filePath: string) => {
    try {
      const result = await api.upload.uploadFile(filePath);
      if (result.success && result.data.url) {
        return result.data.url;
      }
      throw new Error('上传失败');
    } catch (error) {
      console.error('上传图片失败', error);
      Taro.showToast({
        title: '上传图片失败',
        icon: 'none'
      });
      return null;
    }
  };

  // 上传视频
  const uploadVideo = async (filePath: string) => {
    try {
      const result = await api.upload.uploadFile(filePath);
      if (result.success && result.data.url) {
        return result.data.url;
      }
      throw new Error('上传失败');
    } catch (error) {
      console.error('上传视频失败', error);
      Taro.showToast({
        title: '上传视频失败',
        icon: 'none'
      });
      return null;
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
    if (!validateForm()) return;

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

      const result = await api.diary.create(submitData);

      if (result.success) {
        Taro.showToast({
          title: '提交成功，等待审核',
          icon: 'success',
          duration: 2000
        });

        setTimeout(() => {
          Taro.navigateBack();
        }, 2000);
      } else {
        throw new Error(result.message || '创建失败');
      }
    } catch (error) {
      console.error('创建游记失败', error);
      Taro.showToast({
        title: '创建游记失败',
        icon: 'none'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className='create-diary-container' scrollY>
      <View className='form-title'>创建旅行日记</View>

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

        <View className='input-field'>
          <Text className='input-label'>图片</Text>
          <View className='image-upload-area'>
            <View className='image-list'>
              {formData.images.map((image, index) => (
                <View key={index} className='image-item'>
                  <Image className='uploaded-image' src={image} mode='aspectFill' />
                  <View className='image-delete' onClick={() => handleRemoveImage(index)}>×</View>
                </View>
              ))}

              {formData.images.length < 9 && (
                <View
                  className={`image-add ${uploadingImage ? 'disabled' : ''}`}
                  onClick={uploadingImage ? undefined : handleChooseImage}
                >
                  {uploadingImage ? '上传中...' : '+'}
                </View>
              )}
            </View>

            {errors.images && <Text className='error-message'>{errors.images}</Text>}
          </View>
          <Text className='input-tip'>最多上传9张图片</Text>
        </View>

        <View className='input-field'>
          <Text className='input-label'>视频（可选）</Text>
          {formData.videoUrl ? (
            <View className='video-container'>
              <Video src={formData.videoUrl} className='uploaded-video' />
              <View className='video-delete' onClick={handleRemoveVideo}>×</View>
            </View>
          ) : (
            <Button
              type='secondary'
              className='video-upload-btn'
              onClick={handleChooseVideo}
              loading={uploadingVideo}
              disabled={uploadingVideo}
            >
              {uploadingVideo ? '上传中...' : '添加视频'}
            </Button>
          )}
          <Text className='input-tip'>视频最长60秒</Text>
        </View>
      </View>

      <View className='form-actions'>
        <Button
          type='primary'
          className='submit-button'
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || uploadingImage || uploadingVideo}
        >
          {isSubmitting ? '提交中...' : '提交游记'}
        </Button>
      </View>
    </ScrollView>
  );
}

export default CreateDiary;

