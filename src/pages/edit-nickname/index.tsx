import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { AtInput } from 'taro-ui';
import useUserStore from '../../store/user';
import { useRouter } from '../../hooks';
import { getThemeColors, ThemeColors } from '../../utils/themeManager';
import './index.scss';

function EditNickname() {
  const { userInfo, updateNickname, isLoading } = useUserStore();
  const [nickname, setNickname] = useState(userInfo?.nickname || '');
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<ThemeColors>(getThemeColors());
  const { navigateBack } = useRouter();

  // 添加主题变化监听
  useEffect(() => {
    const themeChangeHandler = (newTheme: ThemeColors) => {
      setTheme(newTheme);
    };
    Taro.eventCenter.on('themeChange', themeChangeHandler);

    return () => {
      Taro.eventCenter.off('themeChange', themeChangeHandler);
    };
  }, []);

  // 处理昵称变化
  const handleChange = (value) => {
    setNickname(value);
    setError('');
    return value;
  };

  // 提交修改
  const handleSubmit = async () => {
    if (!nickname.trim()) {
      setError('昵称不能为空');
      return;
    }

    try {
      Taro.showLoading({ title: '更新中...' });
      const success = await updateNickname(nickname.trim());
      
      if (success) {
        Taro.showToast({
          title: '昵称更新成功',
          icon: 'success',
          duration: 2000
        });
        
        // 返回上一页
        setTimeout(() => {
          navigateBack();
        }, 2000);
      } else {
        setError('更新昵称失败');
      }
    } catch (error) {
      setError('更新昵称失败');
    } finally {
      Taro.hideLoading();
    }
  };

  return (
    <View className='edit-nickname-container'>
      <View className='edit-nickname-header'>
        <Text className='edit-nickname-title'>修改昵称</Text>
      </View>
      
      <View className='edit-nickname-form'>
        <AtInput
          name='nickname'
          title='昵称'
          type='text'
          placeholder='请输入新昵称'
          value={nickname}
          onChange={handleChange}
          error={!!error}
        />
        
        {error && (
          <View className='edit-nickname-error'>
            <Text>{error}</Text>
          </View>
        )}
        
        <View
          className='submit-button'
          onClick={!isLoading ? handleSubmit : undefined}
          style={{
            backgroundColor: theme.primaryColor,
            boxShadow: `0 8px 16px ${theme.primaryColor}4d`
          }}
        >
          {isLoading ? '保存中...' : '保存'}
        </View>
      </View>
    </View>
  );
}

export default EditNickname; 