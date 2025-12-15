# Requirements Document

## Introduction

本需求文档定义了"采样布点沙盘"交互式课件模块。该模块是固体废物监测课程的核心教学工具，用于帮助学生理解和掌握固体废物采样布点的原理、方法和规范要求。通过可视化的沙盘界面，学生可以在模拟场景中进行采样点布设练习，系统实时评估布点方案的合理性。

## Glossary

- **Sampling_Sandbox**: 采样布点沙盘系统，提供可视化采样布点练习的核心模块
- **Sampling_Point**: 采样点，在沙盘上标记的废物采样位置
- **Sampling_Area**: 采样区域，需要进行采样的固体废物堆场或场地
- **Grid_System**: 网格系统，将采样区域划分为规则网格便于布点
- **Sampling_Method**: 采样方法，包括随机布点法、系统布点法、分层布点法等
- **Point_Validator**: 布点验证器，检验采样方案是否符合国标要求
- **Scenario_Engine**: 场景引擎，管理不同类型的采样场景
- **Score_Calculator**: 评分计算器，根据布点方案计算得分

## Requirements

### Requirement 1: 沙盘画布与基础交互

**User Story:** As a 学生, I want to 在可视化沙盘上查看和操作采样区域, so that I can 直观地理解采样布点的空间概念。

#### Acceptance Criteria

1. WHEN 学生打开采样布点沙盘页面 THEN Sampling_Sandbox SHALL 显示一个可交互的Canvas画布区域
2. WHEN 沙盘加载完成 THEN Sampling_Sandbox SHALL 显示带有网格线的采样区域底图
3. WHEN 学生使用鼠标滚轮 THEN Sampling_Sandbox SHALL 支持画布的缩放操作（50%-200%）
4. WHEN 学生拖拽画布空白区域 THEN Sampling_Sandbox SHALL 支持画布的平移操作
5. WHEN 学生将鼠标悬停在网格上 THEN Sampling_Sandbox SHALL 高亮显示当前网格并显示坐标信息
6. WHEN 画布尺寸变化 THEN Sampling_Sandbox SHALL 自适应调整显示比例保持内容可见

### Requirement 2: 采样点布设操作

**User Story:** As a 学生, I want to 在沙盘上添加、移动和删除采样点, so that I can 设计自己的采样布点方案。

#### Acceptance Criteria

1. WHEN 学生点击沙盘上的有效区域 THEN Sampling_Sandbox SHALL 在该位置添加一个采样点标记
2. WHEN 学生拖拽已有的采样点 THEN Sampling_Sandbox SHALL 允许移动采样点到新位置
3. WHEN 学生右键点击采样点 THEN Sampling_Sandbox SHALL 显示上下文菜单（删除、编辑属性）
4. WHEN 学生点击删除采样点 THEN Sampling_Sandbox SHALL 移除该采样点并更新统计信息
5. WHEN 采样点数量变化 THEN Sampling_Sandbox SHALL 实时更新采样点计数显示
6. WHEN 学生添加采样点时 THEN Sampling_Sandbox SHALL 自动为采样点分配编号（S1, S2, S3...）
7. WHEN 采样点位于无效区域（如边界外） THEN Sampling_Sandbox SHALL 阻止添加并显示提示

### Requirement 3: 采样方法选择

**User Story:** As a 学生, I want to 选择不同的采样布点方法, so that I can 学习和比较各种采样方法的特点。

#### Acceptance Criteria

1. WHEN 学生打开采样方法选择器 THEN Sampling_Sandbox SHALL 显示可用的采样方法列表
2. WHEN 学生选择"随机布点法" THEN Sampling_Sandbox SHALL 切换到随机布点模式并显示相关说明
3. WHEN 学生选择"系统布点法（网格法）" THEN Sampling_Sandbox SHALL 显示网格辅助线并启用网格吸附
4. WHEN 学生选择"分层布点法" THEN Sampling_Sandbox SHALL 允许先划分分层区域再在各层布点
5. WHEN 学生选择"对角线布点法" THEN Sampling_Sandbox SHALL 显示对角线辅助线
6. WHEN 采样方法切换 THEN Sampling_Sandbox SHALL 保留已有采样点但更新辅助显示

### Requirement 4: 场景模板管理

**User Story:** As a 学生, I want to 选择不同的采样场景进行练习, so that I can 学习不同类型固体废物的采样要求。

#### Acceptance Criteria

1. WHEN 学生打开场景选择器 THEN Scenario_Engine SHALL 显示预设场景列表
2. WHEN 场景列表加载 THEN Scenario_Engine SHALL 包含至少以下场景：堆存场采样、运输车辆采样、包装容器采样、填埋场采样
3. WHEN 学生选择场景 THEN Scenario_Engine SHALL 加载对应的底图、区域边界和采样要求
4. WHEN 场景加载完成 THEN Scenario_Engine SHALL 显示该场景的采样规范说明
5. WHEN 学生切换场景 THEN Sampling_Sandbox SHALL 清空当前采样点并重置画布
6. WHEN 场景包含特殊区域 THEN Scenario_Engine SHALL 用不同颜色标识（如危险区域用红色）

### Requirement 5: 布点方案验证

**User Story:** As a 学生, I want to 验证我的布点方案是否符合国标要求, so that I can 了解方案的合理性并改进。

#### Acceptance Criteria

1. WHEN 学生点击"验证方案"按钮 THEN Point_Validator SHALL 检查当前布点方案
2. WHEN 验证采样点数量 THEN Point_Validator SHALL 根据废物堆存量计算最少采样点数并比对
3. WHEN 验证采样点分布 THEN Point_Validator SHALL 检查采样点是否均匀覆盖采样区域
4. WHEN 验证采样点位置 THEN Point_Validator SHALL 检查是否有采样点位于无效区域
5. WHEN 验证完成 THEN Point_Validator SHALL 显示验证结果（通过/不通过）及详细说明
6. IF 验证不通过 THEN Point_Validator SHALL 高亮显示问题区域并给出改进建议
7. WHEN 验证通过 THEN Point_Validator SHALL 显示绿色通过标识和鼓励信息

### Requirement 6: 评分与反馈系统

**User Story:** As a 学生, I want to 获得布点方案的评分和详细反馈, so that I can 量化了解自己的掌握程度。

#### Acceptance Criteria

1. WHEN 学生提交布点方案 THEN Score_Calculator SHALL 计算综合得分（0-100分）
2. WHEN 计算得分时 THEN Score_Calculator SHALL 考虑以下维度：采样点数量（30%）、分布均匀性（30%）、方法正确性（20%）、操作规范性（20%）
3. WHEN 评分完成 THEN Score_Calculator SHALL 显示总分和各维度得分
4. WHEN 评分完成 THEN Score_Calculator SHALL 提供文字反馈说明优点和改进建议
5. WHEN 得分达到80分以上 THEN Score_Calculator SHALL 显示"优秀"评级和庆祝动画
6. WHEN 得分低于60分 THEN Score_Calculator SHALL 显示"需要改进"评级和学习建议链接

### Requirement 7: 辅助工具栏

**User Story:** As a 学生, I want to 使用辅助工具帮助布点, so that I can 更准确地完成采样布点任务。

#### Acceptance Criteria

1. WHEN 学生打开工具栏 THEN Sampling_Sandbox SHALL 显示可用工具列表
2. WHEN 学生启用"网格吸附" THEN Sampling_Sandbox SHALL 将采样点自动对齐到最近的网格交点
3. WHEN 学生启用"距离测量" THEN Sampling_Sandbox SHALL 显示采样点之间的距离
4. WHEN 学生启用"面积计算" THEN Sampling_Sandbox SHALL 显示采样区域的总面积
5. WHEN 学生点击"自动布点" THEN Sampling_Sandbox SHALL 根据当前采样方法自动生成推荐布点
6. WHEN 学生点击"清空所有" THEN Sampling_Sandbox SHALL 删除所有采样点并重置状态
7. WHEN 学生点击"撤销" THEN Sampling_Sandbox SHALL 撤销最近一次操作

### Requirement 8: 知识点提示系统

**User Story:** As a 学生, I want to 在操作过程中获得相关知识点提示, so that I can 边做边学加深理解。

#### Acceptance Criteria

1. WHEN 学生首次进入沙盘 THEN Sampling_Sandbox SHALL 显示简要操作指南
2. WHEN 学生选择采样方法 THEN Sampling_Sandbox SHALL 显示该方法的适用场景和操作要点
3. WHEN 学生添加采样点时 THEN Sampling_Sandbox SHALL 在侧边栏显示相关国标条款
4. WHEN 学生操作出现常见错误 THEN Sampling_Sandbox SHALL 弹出提示说明正确做法
5. WHEN 学生点击"帮助"按钮 THEN Sampling_Sandbox SHALL 显示完整的操作手册和知识点汇总
6. WHEN 学生悬停在专业术语上 THEN Sampling_Sandbox SHALL 显示术语解释tooltip

### Requirement 9: 练习记录与进度

**User Story:** As a 学生, I want to 保存和查看我的练习记录, so that I can 追踪学习进度和复习之前的方案。

#### Acceptance Criteria

1. WHEN 学生完成一次练习 THEN Sampling_Sandbox SHALL 自动保存练习记录到本地存储
2. WHEN 学生查看历史记录 THEN Sampling_Sandbox SHALL 显示之前的练习列表（场景、得分、时间）
3. WHEN 学生选择历史记录 THEN Sampling_Sandbox SHALL 加载该次练习的布点方案
4. WHEN 学生删除历史记录 THEN Sampling_Sandbox SHALL 移除指定记录
5. WHEN 历史记录超过20条 THEN Sampling_Sandbox SHALL 自动清理最旧的记录

### Requirement 10: 教师演示模式

**User Story:** As a 教师, I want to 使用演示模式向学生展示标准布点方法, so that I can 在课堂上进行直观教学。

#### Acceptance Criteria

1. WHEN 教师从管理后台进入沙盘 THEN Sampling_Sandbox SHALL 提供"演示模式"选项
2. WHEN 教师启用演示模式 THEN Sampling_Sandbox SHALL 隐藏评分功能并放大显示界面
3. WHEN 教师在演示模式操作 THEN Sampling_Sandbox SHALL 显示操作步骤说明
4. WHEN 教师点击"显示标准答案" THEN Sampling_Sandbox SHALL 展示该场景的推荐布点方案
5. WHEN 教师点击"逐步演示" THEN Sampling_Sandbox SHALL 动画展示布点过程
6. WHEN 演示完成 THEN Sampling_Sandbox SHALL 提供"让学生尝试"按钮切换到练习模式
