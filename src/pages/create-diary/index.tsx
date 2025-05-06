import { View, Text, ScrollView, Image, Video } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import Button from '../../components/taro-ui/Button';
import Input from '../../components/taro-ui/Input';
import Textarea from '../../components/taro-ui/Textarea';
import api from '../../services/api';
import { getThemeColors } from '../../utils/themeManager';
import { hexToRgba } from '../../utils/colorUtils';
import './index.scss';

interface FormData {
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  location?: {
    name?: string;
    address?: string;
    latitude: number;
    longitude: number;
  };
}

interface FormErrors {
  title?: string;
  content?: string;
  images?: string;
}

interface LocationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

function CreateDiary() {
  const theme = getThemeColors();
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
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationName, setLocationName] = useState('');

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
      console.log('开始选择视频');
      const res = await Taro.chooseVideo({
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        camera: 'back'
      });

      console.log('视频选择结果:', {
        tempFilePath: res.tempFilePath,
        duration: res.duration,
        size: res.size,
        width: res.width,
        height: res.height
      });

      if (res.tempFilePath) {
        setUploadingVideo(true);

        // 检查视频大小，过大的视频可能上传失败或占用过多带宽
        if (res.size > 50 * 1024 * 1024) { // 50MB
          Taro.showToast({
            title: '视频过大，请选择较小的视频',
            icon: 'none'
          });
          setUploadingVideo(false);
          return;
        }

        const videoUrl = await uploadVideo(res.tempFilePath);
        if (videoUrl) {
          console.log('视频URL已设置到表单中:', videoUrl);
          setFormData(prev => ({
            ...prev,
            videoUrl
          }));
        } else {
          console.error('未能获取到有效的视频URL');
        }
      } else {
        console.log('未选择视频或选择已取消');
      }
    } catch (error) {
      console.error('选择视频失败', error);
      Taro.showToast({
        title: error.errMsg || '选择视频失败',
        icon: 'none'
      });
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
      console.log('开始上传视频, 文件路径:', filePath);
      const result = await api.upload.uploadFile(filePath);
      console.log('视频上传响应:', JSON.stringify(result));

      if (result.success && result.data.url) {
        console.log('视频上传成功, URL:', result.data.url);
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

  // 选择位置
  const handleChooseLocation = async () => {
    try {
      setIsSelectingLocation(true);

      // 调用位置选择API
      const locationData = await api.location.chooseLocation() as LocationData | null;

      if (locationData) {
        console.log('选择的位置信息:', locationData);

        setFormData(prev => ({
          ...prev,
          location: {
            name: locationData.name,
            address: locationData.address,
            latitude: locationData.latitude,
            longitude: locationData.longitude
          }
        }));
      }
    } catch (error) {
      console.error('选择位置失败', error);
      // 如果是API权限错误，提示用户手动输入
      if (error.errMsg && error.errMsg.includes('api need to be declared')) {
        Taro.showModal({
          title: '位置选择不可用',
          content: '因权限限制，无法使用位置选择功能。您可以尝试手动输入位置。',
          confirmText: '手动输入',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              handleManualLocationInput();
            }
          }
        });
      } else {
        Taro.showToast({
          title: '选择位置失败，请尝试手动输入',
          icon: 'none'
        });
        // 延迟一下再显示手动输入界面
        setTimeout(() => {
          handleManualLocationInput();
        }, 1500);
      }
    } finally {
      setIsSelectingLocation(false);
    }
  };

  // 手动输入位置
  const handleManualLocationInput = () => {
    setShowLocationInput(true);
  };

  // 保存手动输入的位置
  const handleSaveLocation = () => {
    if (locationName.trim()) {
      setFormData(prev => ({
        ...prev,
        location: {
          name: locationName,
          address: '',
          latitude: 0,
          longitude: 0
        }
      }));
      setShowLocationInput(false);
    } else {
      Taro.showToast({
        title: '请输入位置名称',
        icon: 'none'
      });
    }
  };

  // 移除位置
  const handleRemoveLocation = () => {
    setFormData(prev => {
      const newData = { ...prev };
      delete newData.location;
      return newData;
    });
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

      console.log('提交的游记数据:', submitData); // 添加日志，确认videoUrl字段已正确包含

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
      <View className='form-wrapper'>
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

          <View className='input-field'>
            <Text className='input-label'>位置（可选）</Text>
            {formData.location ? (
              <View className='location-container'>
                <View className='location-info'>
                  <Text className='location-name'>{formData.location.name}</Text>
                  <Text className='location-address'>{formData.location.address}</Text>
                </View>
                <View className='location-delete' onClick={handleRemoveLocation}>×</View>
              </View>
            ) : showLocationInput ? (
              <View className='manual-location-input'>
                <Input
                  name='locationName'
                  type='text'
                  value={locationName}
                  placeholder='请输入位置名称，如：北京故宫'
                  onChange={(value) => setLocationName(value)}
                />
                <View className='location-buttons'>
                  <Button
                    type='default'
                    className='location-btn-cancel'
                    onClick={() => setShowLocationInput(false)}
                  >
                    取消
                  </Button>
                  <Button
                    type='primary'
                    className='location-btn-save'
                    onClick={handleSaveLocation}
                  >
                    确定
                  </Button>
                </View>
              </View>
            ) : (
              <View className='location-buttons'>
                <Button
                  type='secondary'
                  className='location-btn'
                  onClick={handleChooseLocation}
                  loading={isSelectingLocation}
                  disabled={isSelectingLocation}
                >
                  {isSelectingLocation ? '选择中...' : '选择位置'}
                </Button>
                <Button
                  type='default'
                  className='location-btn-manual'
                  onClick={handleManualLocationInput}
                >
                  手动输入
                </Button>
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
            <Text className='submit-text'>{isSubmitting ? '提交中...' : '提交游记'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export default CreateDiary;

