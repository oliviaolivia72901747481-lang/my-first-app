# 🎓 智慧课堂教学辅助软件

这是一个基于 Next.js 的现代化教学辅助软件，包含完整的课堂互动功能。

## 🚀 快速开始

### 开发环境
```bash
npm install
npm run dev
```

### 生产构建
```bash
npm run build
npm start
```

## 📁 项目结构

```
├── app/                    # Next.js 应用主页
├── public/
│   └── classroom/          # 教学辅助软件
│       ├── js/
│       │   ├── common.js   # 公共配置和工具
│       │   └── navigation.js # 导航组件
│       ├── index.html      # 学生端首页
│       ├── admin.html      # 教师控制台
│       ├── sign.html       # 签到功能
│       ├── vote.html       # 答题功能
│       ├── danmu.html      # 弹幕功能
│       ├── buzzer.html     # 抢答功能
│       └── ...             # 其他功能页面
└── classroom/              # 源文件目录
```

## 🎯 功能特性

### 学生端功能
- ✅ **智能签到** - 防重复签到、输入验证
- ✅ **多样答题** - 支持单选、多选、判断题
- ✅ **实名弹幕** - 敏感词过滤、频率限制
- ✅ **快速抢答** - 实时同步、音效反馈
- ✅ **统一导航** - 底部导航栏、页面高亮

### 教师端功能
- ✅ **课堂中控** - 全班统一控制跳转
- ✅ **签到管理** - 实时监控、Excel导出
- ✅ **答题分析** - 学情分析、正误统计、🎉礼花庆祝
- ✅ **弹幕监控** - 实名追踪、安全验证
- ✅ **抢答控制** - 倒计时动画、🎉获胜礼花
- ✅ **键盘快捷键** - 支持翻页笔控制
- ✅ **🏆实时排行榜** - 积分系统、今日学霸榜
- ✅ **🎯老师提词器** - 题目解析、下一题预览
- ✅ **🎬课件播放器** - PPT图片+互动工具叠加

## 🔗 访问地址

### 主页面
- `/` - Next.js 应用主页
- `/classroom` - 教学系统学生端入口

### 学生端 (推荐使用简洁URL)
- `/sign` - 签到页面
- `/vote` - 答题页面
- `/danmu` - 弹幕页面
- `/buzzer` - 抢答页面

### 教师端 (推荐使用简洁URL)
- `/admin` - 教师控制台
- `/sign-admin` - 签到管理
- `/vote-admin` - 答题管理
- `/danmu-admin` - 弹幕管理
- `/buzzer-admin` - 抢答管理

### 直接访问 (备用)
如果简洁URL不工作，可以直接访问：

**学生端:**
- `/classroom/sign.html` - 签到页面
- `/classroom/vote.html` - 答题页面
- `/classroom/danmu.html` - 弹幕页面
- `/classroom/buzzer.html` - 抢答页面

**教师端:**
- `/classroom/sign-admin.html` - 签到管理
- `/classroom/vote-admin.html` - 答题管理
- `/classroom/danmu-admin.html` - 弹幕管理
- `/classroom/buzzer-admin.html` - 抢答管理

## ⚙️ 配置说明

### Supabase 配置
在 `public/classroom/js/common.js` 中配置数据库连接：

```javascript
const SUPABASE_CONFIG = {
    url: 'your-supabase-url',
    key: 'your-supabase-key'
};
```

### 数据库表结构
需要在 Supabase 中创建以下表：
- `global_state` - 全局状态控制
- `attendance` - 签到记录
- `vote_config` - 答题配置
- `questions` - 题目库
- `vote_logs` - 答题记录
- `messages` - 弹幕消息
- `buzzer` - 抢答状态

## 🛠️ 开发指南

### 添加新功能
1. 在 `classroom/` 目录中创建 HTML 文件
2. 复制到 `public/classroom/` 目录
3. 在 `next.config.ts` 中添加路由重写规则

### 修改现有功能
1. 编辑 `classroom/` 目录中的源文件
2. 运行 `xcopy classroom public\classroom\ /E /I` 更新
3. 重新构建项目

## 🔒 安全特性

- **敏感词过滤** - 智能检测不当内容
- **频率限制** - 防止刷屏行为
- **实名追踪** - 后台可查看操作记录
- **输入验证** - 严格的数据格式检查
- **权限控制** - 管理功能需要验证

## 📱 使用流程

### 教师操作
1. 访问 `/admin` 打开控制台
2. 选择需要的功能模块
3. 学生端自动跳转到相应功能
4. 在对应管理页面监控和控制

### 学生操作
1. 访问 `/classroom` 进入系统
2. 首次使用需要完成签到
3. 根据教师控制自动跳转功能
4. 使用底部导航快速切换

## 🚨 故障排除

### 常见问题
- **404 错误** - 使用简洁URL（如 `/vote` 而不是 `/vote.html`）
- **JavaScript文件404** - 确保所有script标签使用绝对路径（如 `/classroom/js/common.js`）
- **"Dependencies not loaded"错误** - 检查common.js和navigation.js是否正确加载
- **"Identifier already declared"错误** - 避免重新声明ClassroomCommon中的函数，直接使用`ClassroomCommon.functionName()`
- **"function is not defined"错误** - 清除浏览器缓存，确保JavaScript文件正确加载
- **"Illegal return statement"错误** - return语句必须在函数内部，已修复为函数包装模式
- **页面无法访问** - 检查 `public/classroom/` 目录是否存在
- **功能异常** - 确认 Supabase 配置正确
- **样式错误** - 清除浏览器缓存重试
- **导航不工作** - 确保使用绝对路径（以 `/` 开头）

### 调试工具
- 访问 `/classroom/test.html` 进行功能测试
- 查看浏览器开发者工具控制台
- 检查网络请求状态

## ⌨️ 快捷键说明

### 答题控制台 (vote-admin)
| 快捷键 | 功能 |
|--------|------|
| `→` / `PageDown` | 下一题 |
| `←` / `PageUp` | 上一题 |
| `Space` | 暂停/公布答案 |
| `Esc` | 关闭弹窗 |

> 💡 **翻页笔支持**: 大多数翻页笔的前进/后退键对应 PageDown/PageUp，可直接控制答题进度

### 礼花特效
- **答题**: 当全班正确率 ≥ 80% 时自动触发
- **抢答**: 当有学生抢答成功时自动触发

## 🏆 积分系统

### 积分规则
| 行为 | 积分 |
|------|------|
| 答对题目 | +10分 |
| 抢答获胜 | +20分 |

### 排行榜功能
- 实时更新学生积分排名
- 支持全屏展示"今日学霸榜"
- 前三名显示金银铜牌

## 🎯 老师提词器

老师端独有的"画中画"功能，学生看不到：
- **本题解析**: 显示当前题目的正确答案和解析
- **下一题预览**: 提前查看下一道题目内容和答案
- 帮助老师更好地把控课堂节奏

## 🎬 课件播放器

把PPT装进网页，实现无缝互动教学：

### 使用方法
1. 将PPT导出为图片（JPG/PNG格式）
2. 访问 `/presentation` 打开课件播放器
3. 点击"上传课件"，拖拽或选择图片
4. 设置自动触发点（可选）
5. 开始演示！

### 功能特点
- **PPT背景**: 全屏显示课件图片
- **互动叠加**: 在任意幻灯片上叠加弹幕、投票、抢答
- **自动触发**: 设置"第N页自动弹出第M题"
- **快捷键支持**: 翻页笔控制、键盘快捷键

### 快捷键
| 快捷键 | 功能 |
|--------|------|
| `←` `→` / `PageUp` `PageDown` | 翻页 |
| `V` | 显示/隐藏答题 |
| `D` | 开启弹幕 |
| `B` | 启动抢答 |
| `F` | 全屏 |
| `ESC` | 关闭弹窗 |

## 📞 技术支持

如需帮助，请检查：
1. Node.js 版本兼容性
2. 网络连接状态
3. Supabase 服务状态
4. 浏览器兼容性

---

**开发者**: AI Assistant  
**技术栈**: Next.js + Supabase + Vanilla JavaScript  
**许可证**: MIT