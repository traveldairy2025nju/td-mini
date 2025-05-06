# 游记定位功能 - 后端实现指南

## 数据库模型修改

### 1. 游记模型(Diary Schema)添加位置字段

```javascript
// 游记模型中添加位置相关字段
const diarySchema = new Schema({
  // 保留现有字段...
  
  // 添加位置字段
  location: {
    name: { type: String }, // 位置名称
    address: { type: String }, // 位置地址
    latitude: { type: Number }, // 纬度
    longitude: { type: Number }, // 经度
  }
});
```

## API 接口修改

### 1. 创建/更新游记接口

修改创建和更新游记的接口，接受位置信息参数：

```javascript
// POST /api/diaries
router.post('/api/diaries', async (req, res) => {
  try {
    // 验证用户授权
    
    // 从请求体中获取数据
    const { title, content, images, video, location } = req.body;
    
    // 创建游记
    const diary = new Diary({
      title,
      content,
      images,
      video,
      location, // 保存位置信息
      author: req.user._id
      // 其他字段...
    });
    
    await diary.save();
    
    // 返回响应...
  } catch (error) {
    // 错误处理...
  }
});

// PUT /api/diaries/:id
router.put('/api/diaries/:id', async (req, res) => {
  try {
    // 验证用户授权
    
    // 获取要更新的字段
    const { title, content, images, video, location } = req.body;
    
    // 更新游记
    const diary = await Diary.findById(req.params.id);
    
    // 权限检查...
    
    // 更新字段
    diary.title = title;
    diary.content = content;
    diary.images = images;
    if (video !== undefined) diary.video = video;
    if (location !== undefined) diary.location = location; // 更新位置信息
    
    await diary.save();
    
    // 返回响应...
  } catch (error) {
    // 错误处理...
  }
});
```

### 2. 获取游记详情接口

确保获取游记详情的接口返回位置信息：

```javascript
// GET /api/diaries/:id
router.get('/api/diaries/:id', async (req, res) => {
  try {
    const diary = await Diary.findById(req.params.id)
      .populate('author', 'nickname avatar')
      // 其他 populate...
    
    if (!diary) {
      return res.status(404).json({
        success: false,
        message: '游记不存在'
      });
    }
    
    // 返回游记详情，包括位置信息
    return res.json({
      success: true,
      data: diary
    });
  } catch (error) {
    // 错误处理...
  }
});

// GET /api/diaries/:id/with-status
router.get('/api/diaries/:id/with-status', async (req, res) => {
  // 同样确保返回location字段
  // ...现有代码
});
```

## 注意事项

1. 位置字段应该是可选的，不要求所有游记都必须有位置信息
2. 确保在模型和API中进行适当的数据验证
3. 如果位置信息包含经纬度，确保它们是有效的值（纬度在-90到90之间，经度在-180到180之间）

## 测试

在实施后端更改后，需要测试以下内容：

1. 创建带位置信息的游记
2. 更新游记的位置信息
3. 获取带位置信息的游记详情
4. 验证前端能正确显示位置信息 
