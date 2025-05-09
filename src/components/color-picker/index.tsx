import { View, Text, MovableArea, MovableView } from '@tarojs/components';
import { Component } from 'react';
import Taro from '@tarojs/taro';
import { 
  hsv2rgb, 
  rgb2hsv, 
  rgb2hex, 
  hex2rgb, 
  generatePresetColors 
} from '../../utils/colorUtils';
import './index.scss';

interface ColorPickerProps {
  // 是否显示颜色选择器
  show: boolean;
  // 初始颜色，支持Hex格式
  initColor?: string;
  // 是否显示蒙层
  showMask?: boolean;
  // 点击蒙层是否可关闭
  maskClosable?: boolean;
  // 取色确认回调
  onConfirm?: (color: { hex: string; rgb: { r: number; g: number; b: number } }) => void;
  // 取色取消回调
  onCancel?: () => void;
}

interface ColorPickerState {
  // 色相值 0-1
  hue: number;
  // 饱和度 0-1
  saturation: number;
  // 明度 0-1
  value: number;
  // RGB颜色值
  rgb: { r: number; g: number; b: number };
  // Hex颜色值
  hex: string;
  // 色相滑块位置
  huePosition: number;
  // 调色板圆点X位置
  paletteX: number;
  // 调色板圆点Y位置
  paletteY: number;
  // 调色板宽度
  paletteWidth: number;
  // 调色板高度
  paletteHeight: number;
  // 调色板背景色（由hue决定）
  paletteBackground: string;
  // 预设颜色数组
  presetColors: string[];
}

class ColorPicker extends Component<ColorPickerProps, ColorPickerState> {
  static defaultProps = {
    show: false,
    initColor: '#FF0000',
    showMask: true,
    maskClosable: true
  };

  constructor(props) {
    super(props);

    // 提取初始颜色
    const initHex = props.initColor || '#FF0000';
    const { r, g, b } = hex2rgb(initHex);
    const { h, s, v } = rgb2hsv(r, g, b);

    this.state = {
      hue: h,
      saturation: s,
      value: v,
      rgb: { r, g, b },
      hex: initHex,
      huePosition: h * 100,
      paletteX: s * 100,
      paletteY: (1 - v) * 100,
      paletteWidth: 100,
      paletteHeight: 100,
      paletteBackground: `hsl(${h * 360}, 100%, 50%)`,
      presetColors: generatePresetColors()
    };
  }

  componentDidMount() {
    // 获取调色板尺寸
    this.getPaletteSize();
  }

  componentDidUpdate(prevProps) {
    // 显示状态变化时，重新获取调色板尺寸
    if (prevProps.show !== this.props.show && this.props.show) {
      this.getPaletteSize();
      
      // 如果初始颜色有变化，更新状态
      if (prevProps.initColor !== this.props.initColor && this.props.initColor) {
        this.updateFromInitColor(this.props.initColor);
      }
    }
  }

  // 从初始颜色更新状态
  updateFromInitColor = (initColor: string) => {
    const { r, g, b } = hex2rgb(initColor);
    const { h, s, v } = rgb2hsv(r, g, b);
    
    this.setState({
      hue: h,
      saturation: s,
      value: v,
      rgb: { r, g, b },
      hex: initColor,
      huePosition: h * 100,
      paletteX: s * 100,
      paletteY: (1 - v) * 100,
      paletteBackground: `hsl(${h * 360}, 100%, 50%)`
    });
  }

  // 获取调色板尺寸
  getPaletteSize = () => {
    setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.select('.color-picker-palette').boundingClientRect().exec(res => {
        if (res && res[0]) {
          const { width, height } = res[0];
          
          // 更新状态并重新计算圆点位置
          this.setState({
            paletteWidth: width,
            paletteHeight: height,
            paletteX: this.state.saturation * width,
            paletteY: (1 - this.state.value) * height
          });
        }
      });
    }, 300); // 延迟确保组件已渲染
  }

  // 更新颜色状态
  updateColorState = (h: number, s: number, v: number) => {
    const rgb = hsv2rgb(h, s, v);
    const hex = rgb2hex(rgb.r, rgb.g, rgb.b);

    this.setState({
      hue: h,
      saturation: s,
      value: v,
      rgb,
      hex,
      paletteBackground: `hsl(${h * 360}, 100%, 50%)`
    });
  }

  // 处理色相滑块变化
  handleHueChange = (e) => {
    const { x } = e.detail;
    const hue = x / 100;
    
    this.updateColorState(hue, this.state.saturation, this.state.value);
  }

  // 处理调色板圆点拖动
  handlePaletteMove = (e) => {
    const { x, y } = e.detail;
    const { paletteWidth, paletteHeight } = this.state;
    
    // 计算相对位置（0-1范围）
    const s = Math.max(0, Math.min(1, x / paletteWidth));
    const v = Math.max(0, Math.min(1, 1 - y / paletteHeight));
    
    // 更新颜色状态
    this.updateColorState(this.state.hue, s, v);
  }

  // 处理预设颜色点击
  handlePresetClick = (color: string) => {
    const { r, g, b } = hex2rgb(color);
    const { h, s, v } = rgb2hsv(r, g, b);
    
    this.setState({
      hue: h,
      saturation: s,
      value: v,
      rgb: { r, g, b },
      hex: color,
      huePosition: h * 100,
      paletteX: s * 100,
      paletteY: (1 - v) * 100,
      paletteBackground: `hsl(${h * 360}, 100%, 50%)`
    });
  }

  // 取消选择
  handleCancel = () => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
  }

  // 确认选择
  handleConfirm = () => {
    const { onConfirm } = this.props;
    const { hex, rgb } = this.state;
    
    if (onConfirm) {
      onConfirm({ hex, rgb });
    }
  }

  // 点击蒙层
  handleMaskClick = () => {
    const { maskClosable, onCancel } = this.props;
    
    if (maskClosable && onCancel) {
      onCancel();
    }
  }

  // 添加调色板点击功能
  handlePaletteAreaClick = (e) => {
    // 获取容器信息和点击位置
    const query = Taro.createSelectorQuery();
    query.select('.color-picker-palette').boundingClientRect().exec(res => {
      if (res && res[0]) {
        const palette = res[0];
        // 将点击坐标转换为相对于调色板的位置
        const relativeX = e.detail.x - palette.left;
        const relativeY = e.detail.y - palette.top;
        
        // 计算相对位置（0-1范围）
        const s = Math.max(0, Math.min(1, relativeX / palette.width));
        const v = Math.max(0, Math.min(1, 1 - relativeY / palette.height));
        
        // 更新颜色并设置圆点位置
        this.updateColorState(this.state.hue, s, v);
        this.setState({
          paletteX: s * palette.width,
          paletteY: (1 - v) * palette.height
        });
      }
    });
  }
  
  // 添加色相滑块点击功能
  handleHueAreaClick = (e) => {
    // 获取容器信息和点击位置
    const query = Taro.createSelectorQuery();
    query.select('.color-picker-hue-slider').boundingClientRect().exec(res => {
      if (res && res[0]) {
        const slider = res[0];
        // 将点击坐标转换为相对于滑块的位置
        const relativeX = e.detail.x - slider.left;
        
        // 计算相对位置（0-100范围）
        const huePosition = Math.max(0, Math.min(100, (relativeX / slider.width) * 100));
        const hue = huePosition / 100;
        
        // 更新颜色并设置滑块位置
        this.updateColorState(hue, this.state.saturation, this.state.value);
        this.setState({
          huePosition
        });
      }
    });
  }

  render() {
    const { show, showMask } = this.props;
    const { 
      hue, 
      rgb, 
      hex, 
      huePosition, 
      paletteX,
      paletteY,
      paletteBackground,
      presetColors
    } = this.state;
    
    return (
      <>
        {showMask && (
          <View 
            className={`color-picker-mask ${show ? 'show' : ''}`} 
            onClick={this.handleMaskClick}
          />
        )}
        
        <View className={`color-picker-container ${show ? 'show' : ''}`}>
          <View className='color-picker-header'>
            <Text className='color-picker-title'>选择颜色</Text>
            <View className='color-picker-close' onClick={this.handleCancel}>×</View>
          </View>
          
          <View className='color-picker-content'>
            {/* 颜色调色板 */}
            <MovableArea 
              className='color-picker-palette' 
              style={{ backgroundColor: paletteBackground }}
              onClick={this.handlePaletteAreaClick}
            >
              <View className='color-palette-inner' />
              <MovableView
                className='color-palette-thumb'
                x={paletteX}
                y={paletteY}
                direction='all'
                damping={50}
                friction={5}
                onChange={this.handlePaletteMove}
                style={{ backgroundColor: hex }}
              />
            </MovableArea>
            
            {/* 色相滑块 */}
            <MovableArea 
              className='color-picker-hue-slider'
              onClick={this.handleHueAreaClick}
            >
              <MovableView 
                className='color-hue-thumb'
                direction='horizontal'
                x={huePosition}
                damping={50}
                friction={5}
                onChange={this.handleHueChange}
              />
            </MovableArea>
            
            {/* 颜色预览 */}
            <View className='color-picker-preview'>
              <View className='color-preview-box' style={{ backgroundColor: hex }} />
              <View className='color-preview-values'>
                <View className='color-value-item color-value-hex'>{hex}</View>
                <View className='color-value-item color-value-rgb'>
                  RGB({rgb.r}, {rgb.g}, {rgb.b})
                </View>
              </View>
            </View>
            
            {/* 预设颜色 */}
            <View className='color-picker-presets'>
              <Text className='presets-title'>预设颜色</Text>
              <View className='presets-list'>
                {presetColors.map((color, index) => (
                  <View 
                    key={index}
                    className='preset-color'
                    style={{ backgroundColor: color }}
                    onClick={() => this.handlePresetClick(color)}
                  />
                ))}
              </View>
            </View>
            
            {/* 操作按钮 */}
            <View className='color-picker-buttons'>
              <View className='picker-button cancel-button' onClick={this.handleCancel}>
                取消
              </View>
              <View 
                className='picker-button confirm-button' 
                style={{ backgroundColor: hex }}
                onClick={this.handleConfirm}
              >
                确定
              </View>
            </View>
          </View>
          
          {/* 安全区适配 */}
          <View className='safe-area-inset-bottom' />
        </View>
      </>
    );
  }
}

export default ColorPicker; 