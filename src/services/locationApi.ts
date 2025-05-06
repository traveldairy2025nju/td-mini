import Taro from '@tarojs/taro';

// 腾讯位置服务key
const LOCATION_KEY = 'FWQBZ-JPCCL-FZEPX-ET3FE-34RJV-5JBTE';

/**
 * 获取当前位置信息（经纬度）
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    Taro.getLocation({
      type: 'gcj02',
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        console.error('获取位置失败:', err);
        reject(err);
      }
    });
  });
};

/**
 * 逆地址解析：根据经纬度获取地址信息
 * @param latitude 纬度
 * @param longitude 经度
 */
export const reverseGeocoding = async (latitude: number, longitude: number) => {
  try {
    const url = `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=${LOCATION_KEY}&get_poi=0`;

    const response = await Taro.request({
      url,
      method: 'GET'
    });

    if (response.statusCode === 200 && response.data.status === 0) {
      const addressData = response.data.result;
      return {
        success: true,
        address: addressData.address,
        formatted_address: addressData.formatted_addresses?.recommend || addressData.address,
        location: {
          latitude,
          longitude
        },
        addressComponent: addressData.address_component
      };
    } else {
      console.error('逆地址解析失败:', response);
      return {
        success: false,
        message: response.data.message || '逆地址解析失败'
      };
    }
  } catch (error) {
    console.error('请求逆地址解析服务失败:', error);
    return {
      success: false,
      message: '请求位置服务失败'
    };
  }
};

/**
 * 选择位置
 */
export const chooseLocation = () => {
  return new Promise((resolve, reject) => {
    Taro.chooseLocation({
      success: (res) => {
        resolve({
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        // 用户取消选择不算错误
        if (err.errMsg.indexOf('cancel') > -1) {
          resolve(null);
        } else {
          console.error('选择位置失败:', err);
          reject(err);
        }
      }
    });
  });
};

export default {
  getCurrentLocation,
  reverseGeocoding,
  chooseLocation
};
