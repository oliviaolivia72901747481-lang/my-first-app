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
- ✅ **答题分析** - 学情分析、正误统计
- ✅ **弹幕监控** - 实名追踪、安全验证
- ✅ **抢答控制** - 倒计时动画、结果显示

## 🔗 访问地址

### 主页面
- `/` - Next.js 应用主页
- `/classroom` - 教学系统学生端入口

### 学生端
- `/sign` - 签到页面
- `/vote` - 答题页面
- `/danmu` - 弹幕页面
- `/buzzer` - 抢答页面

### 教师端
- `/admin` - 教师控制台
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
- **页面无法访问** - 检查 `public/classroom/` 目录是否存在
- **功能异常** - 确认 Supabase 配置正确
- **样式错误** - 清除浏览器缓存重试

### 调试工具
- 访问 `/classroom/test.html` 进行功能测试
- 查看浏览器开发者工具控制台
- 检查网络请求状态

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