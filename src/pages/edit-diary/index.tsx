import { View, Text, Image, ScrollView, Canvas, Video } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter as useTaroRouter } from '@tarojs/taro';
import api from '../../services/api';
import Input from '../../components/taro-ui/Input';
import Button from '../../components/taro-ui/Button';
import Textarea from '../../components/taro-ui/Textarea';
import { getThemeColors } from '../../utils/themeManager';
import { hexToRgba } from '../../utils/colorUtils';
import { useRouter } from '../../hooks';
import './index.scss';

// 表单数据类型
interface FormData {
  title: string;
  content: string;
  images: string[];
  videoUrl: string;
  location?: {
    name?: string;
    address?: string;
    latitude: number;
    longitude: number;
  };
}

// 表单错误类型
interface FormErrors {
  title?: string;
  content?: string;
  images?: string;
  videoUrl?: string;
}

interface LocationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

function EditDiary() {
  const router = useTaroRouter();
  const diaryId = router.params.id;
  const theme = getThemeColors();
  const { navigateBack } = useRouter();

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
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    if (diaryId) {
      fetchDiaryDetail(diaryId);
    } else {
      Taro.showToast({
        title: '游记ID不存在',
        icon: 'none'
      });
      setTimeout(() => {
        navigateBack();
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
          videoUrl: diaryData.video || diaryData.videoUrl || '',
          location: diaryData.location
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
        navigateBack();
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
    if (formData.location?.name) {
      setLocationName(formData.location.name);
    }
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
      delete (newData as any).location;
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
    if (!validateForm() || !diaryId) return;

    try {
      setIsSubmitting(true);

      // 准备提交的数据
      const submitData = {
        ...formData
      };

      // 如果videoUrl为空字符串，则不提交这个字段
      const dataToSubmit = { ...submitData };
      if (!dataToSubmit.videoUrl) {
        delete (dataToSubmit as any).videoUrl;
      }

      // 验证videoUrl格式
      if (dataToSubmit.videoUrl && !dataToSubmit.videoUrl.match(/^https?:\/\/.+\..+/)) {
        Taro.showToast({
          title: '视频URL格式不正确',
          icon: 'none'
        });
        return;
      }

      console.log('更新的游记数据:', dataToSubmit);
      const result = await api.diary.update(diaryId, dataToSubmit);

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
          navigateBack();
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
        加载中...
      </View>
    );
  }

  return (
    <ScrollView className='edit-diary-container' scrollY>
      <View className='form-wrapper'>
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
            />
            {errors.title && <Text className='error-message'>{errors.title}</Text>}
          </View>

          <View className='input-field'>
            <Text className='input-label'>内容</Text>
            <Textarea
              className='content-textarea'
              value={formData.content}
              placeholder='请描述您的旅行经历...'
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
                    onClick={!uploadingImage ? handleChooseImage : undefined}
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
            className={`submit-button ${isSubmitting ? 'disabled' : ''}`}
            onClick={handleSubmit}
            style={{
              backgroundColor: theme.primaryColor,
              boxShadow: `0 2px 8px ${hexToRgba(theme.primaryColor, 0.3)}`
            }}
          >
            <Text className='submit-text'>{isSubmitting ? '保存中...' : '保存修改'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export default EditDiary;
