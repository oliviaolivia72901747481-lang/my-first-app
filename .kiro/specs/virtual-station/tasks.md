# Implementation Plan

## 虚拟工位平台实现任务

- [x] 1. 项目结构与基础设置






  - [x] 1.1 创建虚拟工位平台核心模块


    - 创建 `public/classroom/js/virtual-station.js` 主控制器
    - 定义数据模型接口（Workstation, Task, TaskStage, CareerProfile等）
    - 初始化Supabase连接和本地存储
    - _Requirements: 1.1, 11.1_

  - [x] 1.2 创建数据库表结构


    - 创建 `public/classroom/sql/virtual_station_tables.sql`
    - 包含工位表、任务表、进度表、行为日志表、成就表、职业档案表
    - _Requirements: 1.1, 3.1, 7.1, 8.1_

- [x] 2. 工位场景系统实现






  - [x] 2.1 实现工位数据结构和预设数据


    - 定义Workstation接口和WorkstationCategory枚举
    - 创建预设工位数据（环境监测站、危废鉴别实验室、采样规划中心等）
    - _Requirements: 1.1, 1.2_

  - [ ]* 2.2 编写工位列表属性测试
    - **Property 1: 工位列表完整性**
    - **Validates: Requirements 1.1**


  - [x] 2.3 实现工位选择和加载界面

    - 创建工位卡片组件，显示名称、描述、进度、难度
    - 实现工位加载逻辑，显示任务单、工具栏、资料入口
    - _Requirements: 1.2, 1.3_

  - [x] 2.4 实现工位进度管理


    - 记录用户在各工位的完成进度
    - 显示进度条和完成状态
    - _Requirements: 1.1, 11.3_

- [x] 3. 任务流管理系统实现








  - [x] 3.1 实现任务数据结构


    - 定义Task、TaskStage、TaskBrief接口
    - 创建阶段类型枚举（task_receipt, plan_design, operation, record_filling, report_generation）
    - _Requirements: 2.1, 1.5_

  - [ ]* 3.2 编写任务阶段顺序属性测试
    - **Property 2: 任务阶段顺序正确性**
    - **Validates: Requirements 1.5, 2.1**

  - [x] 3.3 实现任务单展示界面


    - 显示任务背景、目标、要求、截止时间
    - 实现任务接受确认流程
    - _Requirements: 2.1_

  - [x] 3.4 实现方案制定阶段


    - 提供方案模板和必填项提示
    - 实现方案验证逻辑
    - _Requirements: 2.2, 2.3_

  - [ ]* 3.5 编写方案验证属性测试
    - **Property 3: 方案验证完整性**
    - **Validates: Requirements 2.3, 2.6**

  - [x] 3.6 实现记录填写和报告生成阶段





    - 自动生成原始记录模板
    - 实现报告格式验证
    - _Requirements: 2.5, 2.6_

- [x] 4. Checkpoint - 确保基础功能测试通过




  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 过程性数据采集系统实现






  - [x] 5.1 实现行为日志记录器


    - 创建ProcessTracker模块
    - 实现操作时间戳、页面停留时长记录
    - 实现字段修改记录（修改次数、前后差异）
    - _Requirements: 3.1, 3.2_

  - [ ]* 5.2 编写行为日志属性测试
    - **Property 4: 行为日志记录完整性**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 5.3 实现提示查看记录


    - 记录查看的提示类型和时间点
    - 统计提示查看率
    - _Requirements: 3.3_



  - [x] 5.4 实现疑难点识别
    - 设置停顿阈值配置
    - 实现超时标记逻辑
    - _Requirements: 3.4_

  - [ ]* 5.5 编写停顿阈值属性测试
    - **Property 5: 停顿阈值判断正确性**
    - **Validates: Requirements 3.4**

  - [x] 5.6 实现统计分析功能


    - 计算平均停顿时间、提示查看率、错误率
    - 生成班级分析报告
    - _Requirements: 3.5_

  - [ ]* 5.7 编写统计计算属性测试
    - **Property 6: 统计计算正确性**
    - **Validates: Requirements 3.5**

- [x] 6. 错误模式分析系统实现





  - [x] 6.1 实现错误分类记录





    - 定义错误类型枚举（概念错误、计算错误、流程错误、格式错误）
    - 实现错误自动分类逻辑
    - _Requirements: 4.1_

  - [ ]* 6.2 编写错误分类属性测试
    - **Property 7: 错误分类正确性**
    - **Validates: Requirements 4.1**

  - [x] 6.3 实现共性问题识别




    - 统计错误频率
    - 实现共性问题标记逻辑
    - _Requirements: 4.2_

  - [ ]* 6.4 编写共性问题属性测试
    - **Property 8: 共性问题识别正确性**
    - **Validates: Requirements 4.2**

  - [x] 6.5 实现错误热力图和资源推荐















    - 生成错误分布热力图数据
    - 关联知识点推荐学习资源
    - _Requirements: 4.3, 4.4_

- [x] 7. Checkpoint - 确保数据采集功能测试通过





  - Ensure all tests pass, ask the user if questions arise.


- [x] 8. AI专业助教系统实现




  - [x] 8.1 实现AI对话界面




    - 创建悬浮AI助教按钮
    - 实现对话框UI和消息列表
    - _Requirements: 5.1_

  - [x] 8.2 实现RAG知识库检索












    - 集成向量数据库或使用Supabase全文搜索
    - 实现问题-知识匹配逻辑
    - _Requirements: 5.1, 6.5_

  - [x] 8.3 实现标准引用格式化




    - 解析知识库中的国标内容
    - 在回答中自动添加标准引用
    - _Requirements: 5.2_

  - [ ]* 8.4 编写标准引用属性测试
    - **Property 9: AI回答标准引用格式**
    - **Validates: Requirements 5.2**

  - [x] 8.5 实现方案预批改功能








    - 实现逻辑检查规则
    - 生成错误说明和修改建议
    - _Requirements: 5.3, 5.4_

- [x] 9. 知识库管理系统实现





















  - [x] 9.1 实现知识文档上传和索引


    - 支持PDF、Word、Markdown文档上传
    - 实现文档解析和索引建立
    - _Requirements: 6.1_

  - [x] 9.2 实现国标分类存储





    - 按标准编号、发布日期、适用范围分类
    - 创建标准浏览界面
    - _Requirements: 6.2_

  - [x] 9.3 实现版本历史管理





    - 记录文档更新历史
    - 实现版本回滚功能
    - _Requirements: 6.3_

  - [ ]* 9.4 编写版本历史属性测试
    - **Property 10: 知识库版本历史完整性**
    - **Validates: Requirements 6.3**

  - [x] 9.5 实现知识库搜索





    - 实现关键词搜索
    - 实现语义搜索（可选）
    - _Requirements: 6.5_

  - [ ]* 9.6 编写搜索正确性属性测试
    - **Property 11: 知识库搜索正确性**
    - **Validates: Requirements 6.5**

- [x] 10. Checkpoint - 确保AI和知识库功能测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. 职业等级系统实现






  - [x] 11.1 实现职业档案数据结构


    - 定义CareerProfile接口和CareerLevel枚举
    - 创建等级配置（实习生→见习工程师→助理工程师→工程师→高级工程师→项目经理）
    - _Requirements: 7.1, 7.2_

  - [x] 11.2 实现经验值计算


    - 根据任务难度和完成质量计算XP
    - 实现XP奖励逻辑
    - _Requirements: 7.1_

  - [ ]* 11.3 编写经验值计算属性测试
    - **Property 12: 经验值计算正确性**
    - **Validates: Requirements 7.1**

  - [x] 11.4 实现等级晋升逻辑


    - 检查XP阈值
    - 触发晋升动画和通知
    - _Requirements: 7.2_

  - [ ]* 11.5 编写等级晋升属性测试
    - **Property 13: 等级晋升正确性**
    - **Validates: Requirements 7.2**

  - [x] 11.6 实现等级解锁功能


    - 配置各等级解锁的工位和任务
    - 实现解锁检查逻辑
    - _Requirements: 7.4_

  - [ ]* 11.7 编写等级解锁属性测试
    - **Property 14: 等级解锁正确性**
    - **Validates: Requirements 7.4**

  - [x] 11.8 实现职业档案展示


    - 显示当前等级、XP进度、距下一等级所需XP
    - 显示统计数据（完成工位数、任务数、学习时长）
    - _Requirements: 7.3_

- [x] 12. 成就勋章系统实现






  - [x] 12.1 实现成就数据结构


    - 定义Achievement接口和AchievementCondition
    - 创建预设成就列表（含稀有度分级）
    - _Requirements: 8.2, 8.3_

  - [x] 12.2 实现上岗证颁发


    - 检测工位全部任务完成
    - 颁发对应虚拟上岗证
    - _Requirements: 8.1_

  - [ ]* 12.3 编写上岗证颁发属性测试
    - **Property 15: 上岗证颁发正确性**
    - **Validates: Requirements 8.1**

  - [x] 12.4 实现成就条件检查


    - 实现各类成就条件判断（任务完成、连续学习、高分等）
    - 触发勋章颁发和动画
    - _Requirements: 8.2_

  - [ ]* 12.5 编写成就条件属性测试
    - **Property 16: 成就条件判断正确性**
    - **Validates: Requirements 8.2**

  - [x] 12.6 实现成就展示页面


    - 显示已获得和未解锁勋章
    - 显示解锁条件和进度
    - _Requirements: 8.3, 8.4_

  - [x] 12.7 实现成就分享功能


    - 生成成就卡片图片
    - 支持分享到社交平台
    - _Requirements: 8.5_

- [x] 13. Checkpoint - 确保职业成长系统测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [-] 14. 虚拟仿真交互系统实现




  - [ ] 14.1 实现仿真模块框架










    - 创建SimulationService
    - 定义仿真配置数据结构
    - _Requirements: 9.1_

  - [ ] 14.2 实现拖拽组装功能
    - 实现仪器组件拖拽交互
    - 实现组装顺序和连接验证
    - _Requirements: 9.2_

  - [ ]* 14.3 编写组装验证属性测试
    - **Property 17: 仿真组装验证正确性**
    - **Validates: Requirements 9.2**

  - [ ] 14.4 实现参数调节功能
    - 实现设备参数滑块/输入
    - 实现参数变化后果计算和显示
    - _Requirements: 9.3_

  - [ ]* 14.5 编写参数效果属性测试
    - **Property 18: 仿真参数效果正确性**
    - **Validates: Requirements 9.3**

  - [ ] 14.6 实现操作评估
    - 记录操作路径
    - 评估操作规范性并给出反馈
    - _Requirements: 9.4, 9.5_

- [x] 15. 竞赛排行系统实现








  - [x] 15.1 实现竞赛控制功能


    - 教师开启/结束竞赛
    - 向学生推送竞赛任务
    - _Requirements: 10.1_

  - [x] 15.2 实现实时排行榜





    - 实时更新排名数据
    - 按得分和用时排序
    - _Requirements: 10.2, 10.3_

  - [x]* 15.3 编写排行榜排序属性测试


    - **Property 19: 竞赛排行榜排序正确性**
    - **Validates: Requirements 10.2, 10.3**

  - [x] 15.4 实现竞赛结果展示和导出





    - 显示最终排名和路径对比
    - 导出Excel报告
    - _Requirements: 10.4, 10.5_

- [x] 16. 学习进度与记录系统实现










  - [x] 16.1 实现进度自动保存








    - 定时保存当前进度到云端
    - 实现本地缓存备份
    - _Requirements: 11.1_

  - [ ]* 16.2 编写进度保存属性测试
    - **Property 20: 进度保存持久化**
    - **Validates: Requirements 11.1, 11.3**

  - [x] 16.3 实现进度恢复





    - 检测未完成进度
    - 提供继续/重新开始选项
    - _Requirements: 11.2_

  - [x] 16.4 实现历史记录





    - 保存完成任务的完整记录
    - 显示历史列表和详情
    - _Requirements: 11.3, 11.4_

  - [ ]* 16.5 编写历史记录属性测试
    - **Property 21: 历史记录完整性**
    - **Validates: Requirements 11.3, 11.4**

  - [x] 16.6 实现重新挑战功能






    - 支持重玩历史任务
    - 保留最高分记录
    - _Requirements: 11.5_

- [x] 17. Checkpoint - 确保进度和竞赛功能测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. 教师管理后台实现




  - [x] 18.1 实现管理后台入口


    - 创建教师后台页面框架
    - 显示工位管理、任务管理、学生管理、数据分析入口
    - _Requirements: 12.1_


  - [x] 18.2 实现工位编辑器
    - 创建/编辑工位信息
    - 配置任务流和评分规则
    - _Requirements: 12.2_


  - [x] 18.3 实现学生数据查看
    - 显示个人和班级学习进度
    - 显示成绩分布和行为分析
    - _Requirements: 12.3_


  - [x] 18.4 实现数据导出功能
    - 导出学生成绩
    - 导出行为日志和错误分析报告
    - _Requirements: 12.4_

  - [ ]* 18.5 编写数据导出属性测试
    - **Property 22: 数据导出完整性**
    - **Validates: Requirements 10.5, 12.4**


  - [x] 18.6 实现任务截止提醒

    - 配置截止时间
    - 发送未完成提醒
    - _Requirements: 12.5_

- [x] 19. 系统集成与优化







  - [x] 19.1 完善导航入口

    - 在admin.html添加虚拟工位管理入口
    - 在presentation.html添加竞赛控制入口
    - _Requirements: 1.1_


  - [x] 19.2 样式优化和响应式适配

    - 确保与现有系统风格一致
    - 适配不同屏幕尺寸
    - 优化移动端体验
    - _Requirements: 1.3_


  - [x] 19.3 性能优化

    - 优化数据加载和缓存策略
    - 减少不必要的API调用
    - _Requirements: 11.1_

- [x] 20. Final Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.

