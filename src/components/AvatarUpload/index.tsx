import { View, Image } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { AtIcon } from 'taro-ui';
import './index.scss';

interface AvatarUploadProps {
  value?: string;
  onChange: (filePath: string) => void;
}

function AvatarUpload({ value, onChange }: AvatarUploadProps) {
  const [avatar, setAvatar] = useState<string>(value || '');
  
  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        setAvatar(tempFilePath);
        onChange(tempFilePath);
      }
    });
  };
  
  return (
    <View className='avatar-upload' onClick={handleChooseImage}>
      {avatar ? (
        <Image 
          className='avatar-upload__image' 
          src={avatar} 
          mode='aspectFill'
        />
      ) : (
        <View className='avatar-upload__placeholder'>
          <AtIcon value='camera' size='24' color='#999' />
          <View className='avatar-upload__text'>点击上传头像</View>
        </View>
      )}
    </View>
  );
}

export default AvatarUpload; 