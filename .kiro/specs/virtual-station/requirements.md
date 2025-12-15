# Requirements Document

## Introduction

本需求文档定义了"虚拟工位平台"专业实训系统。该平台区别于传统LMS（学习管理系统），定位为"教学工具"和"专业实训平台"，专注于解决"技能习得"和"深度理解"的问题。平台以高职教育"就业导向"为核心，通过模拟真实工作流、无感采集学习过程数据、AI垂直领域助教、职业RPG成就系统四大差异化功能，为环境监测等专业提供沉浸式实训体验。

## Glossary

- **Virtual_Station**: 虚拟工位平台，提供深度场景化实训的核心系统
- **Workstation**: 工位，模拟真实工作场景的实训单元（如环境监测站、危废鉴别实验室）
- **Task_Flow**: 任务流，工作手册式的数字化交互流程（接受任务单→制定方案→填写记录→生成报告）
- **Process_Tracker**: 过程追踪器，无感采集学习行为数据的模块
- **Behavior_Log**: 行为日志，记录学生操作的时间戳、停顿时长、修改次数、提示查看等
- **AI_Tutor**: AI专业助教，基于RAG知识库的垂直领域智能问答系统
- **Knowledge_Base**: 知识库，包含国家标准、行业规范、教案等专业资料
- **Career_System**: 职业成长系统，RPG式的等级、勋章、上岗证体系
- **Achievement**: 成就/勋章，完成特定任务或达成条件后获得的虚拟认证
- **Career_Level**: 职业等级，如实习生、见习工程师、助理工程师、项目经理
- **XP**: 经验值，通过完成任务获得，用于职业等级晋升
- **Virtual_Simulation**: 虚拟仿真，基于Web的轻量级2D/2.5D交互模拟

## Requirements

### Requirement 1: 虚拟工位场景系统

**User Story:** As a 学生, I want to 进入模拟真实工作环境的虚拟工位, so that I can 在接近实际工作的场景中学习专业技能。

#### Acceptance Criteria

1. WHEN 学生进入虚拟工位平台 THEN Virtual_Station SHALL 显示可用工位列表，包含工位名称、描述、进度状态
2. WHEN 学生选择某个工位 THEN Virtual_Station SHALL 加载该工位的工作环境界面，模拟真实工作场景
3. WHEN 工位加载完成 THEN Virtual_Station SHALL 显示当前任务单、可用工具、参考资料入口
4. WHEN 学生在工位中操作 THEN Virtual_Station SHALL 提供工作手册式的交互界面，而非传统的"章节作业"形式
5. WHEN 工位包含多个任务阶段 THEN Virtual_Station SHALL 按工作流顺序引导：接受任务单→制定方案→执行操作→填写记录→生成报告

### Requirement 2: 任务流管理系统

**User Story:** As a 学生, I want to 按照真实工作流程完成实训任务, so that I can 掌握完整的工作方法和流程。

#### Acceptance Criteria

1. WHEN 学生开始新任务 THEN Task_Flow SHALL 显示任务单，包含任务背景、目标、要求、截止时间
2. WHEN 学生进入方案制定阶段 THEN Task_Flow SHALL 提供方案模板和必填项提示
3. WHEN 学生提交方案 THEN Task_Flow SHALL 验证方案完整性并给出即时反馈
4. WHEN 学生进入操作执行阶段 THEN Task_Flow SHALL 提供虚拟仿真界面或步骤引导
5. WHEN 学生完成操作 THEN Task_Flow SHALL 自动生成原始记录模板供填写
6. WHEN 学生提交最终报告 THEN Task_Flow SHALL 验证报告格式和必要内容

### Requirement 3: 过程性数据采集系统

**User Story:** As a 教师, I want to 无感采集学生的学习过程数据, so that I can 分析学习难点和优化教学内容。

#### Acceptance Criteria

1. WHEN 学生在平台上操作 THEN Process_Tracker SHALL 自动记录操作时间戳、页面停留时长
2. WHEN 学生修改已填写内容 THEN Process_Tracker SHALL 记录修改次数和修改前后的内容差异
3. WHEN 学生查看提示或帮助 THEN Process_Tracker SHALL 记录查看的提示类型和查看时间点
4. WHEN 学生在某步骤停顿超过设定阈值 THEN Process_Tracker SHALL 标记该步骤为"疑难点"
5. WHEN 教师查看分析报告 THEN Process_Tracker SHALL 显示全班在各步骤的平均停顿时间、提示查看率、错误率

### Requirement 4: 错误模式分析系统

**User Story:** As a 教师, I want to 了解学生的常见错误模式, so that I can 针对性地改进教学。

#### Acceptance Criteria

1. WHEN 学生提交包含错误的内容 THEN Process_Tracker SHALL 分类记录错误类型（概念错误、计算错误、流程错误、格式错误）
2. WHEN 同一错误在多个学生中出现 THEN Process_Tracker SHALL 统计错误频率并标记为"共性问题"
3. WHEN 教师查看错误分析 THEN Process_Tracker SHALL 显示错误热力图，标识高频错误步骤
4. WHEN 错误与特定知识点关联 THEN Process_Tracker SHALL 推荐相关学习资源

### Requirement 5: AI专业助教系统

**User Story:** As a 学生, I want to 向AI助教提问专业问题, so that I can 获得引用国标规范的准确回答。

#### Acceptance Criteria

1. WHEN 学生向AI助教提问 THEN AI_Tutor SHALL 在知识库中检索相关内容并生成回答
2. WHEN 回答涉及国家标准 THEN AI_Tutor SHALL 引用具体标准编号（如GB 5085.1-2007）和条款内容
3. WHEN 学生提交方案设计 THEN AI_Tutor SHALL 进行逻辑检查并指出潜在问题
4. WHEN AI检测到明显错误 THEN AI_Tutor SHALL 给出具体的错误说明和修改建议
5. WHEN 学生请求解释专业术语 THEN AI_Tutor SHALL 提供通俗易懂的解释和实际应用示例

### Requirement 6: 知识库管理系统

**User Story:** As a 教师, I want to 管理AI助教的知识库内容, so that I can 确保AI回答基于最新的标准和教案。

#### Acceptance Criteria

1. WHEN 教师上传知识文档 THEN Knowledge_Base SHALL 解析文档内容并建立索引
2. WHEN 知识库包含国家标准 THEN Knowledge_Base SHALL 按标准编号、发布日期、适用范围分类存储
3. WHEN 教师更新知识内容 THEN Knowledge_Base SHALL 记录版本历史并支持回滚
4. WHEN AI引用知识库内容 THEN Knowledge_Base SHALL 提供原文出处链接
5. WHEN 知识库搜索 THEN Knowledge_Base SHALL 支持关键词搜索和语义搜索

### Requirement 7: 职业等级系统

**User Story:** As a 学生, I want to 通过完成任务提升职业等级, so that I can 获得成就感和持续学习的动力。

#### Acceptance Criteria

1. WHEN 学生完成任务 THEN Career_System SHALL 根据任务难度和完成质量奖励经验值
2. WHEN 学生经验值达到阈值 THEN Career_System SHALL 自动晋升职业等级并显示晋升动画
3. WHEN 学生查看个人主页 THEN Career_System SHALL 显示当前等级、经验值进度、距下一等级所需经验
4. WHEN 职业等级提升 THEN Career_System SHALL 解锁新的工位或高级任务
5. WHEN 学生达到最高等级 THEN Career_System SHALL 显示"项目经理"称号和特殊标识

### Requirement 8: 成就勋章系统

**User Story:** As a 学生, I want to 获得虚拟上岗证和技能勋章, so that I can 展示我的专业能力和学习成果。

#### Acceptance Criteria

1. WHEN 学生完成特定工位的全部任务 THEN Career_System SHALL 颁发该工位的"虚拟上岗证"
2. WHEN 学生达成特定成就条件 THEN Career_System SHALL 颁发对应勋章并显示获得动画
3. WHEN 学生查看成就页面 THEN Career_System SHALL 显示已获得勋章、未解锁勋章（显示解锁条件）
4. WHEN 学生获得稀有成就 THEN Career_System SHALL 在排行榜和个人主页突出显示
5. WHEN 学生分享成就 THEN Career_System SHALL 生成可分享的成就卡片图片

### Requirement 9: 虚拟仿真交互系统

**User Story:** As a 学生, I want to 通过轻量级虚拟仿真进行操作练习, so that I can 在安全环境中学习设备操作和实验流程。

#### Acceptance Criteria

1. WHEN 学生进入仿真模块 THEN Virtual_Simulation SHALL 加载2D/2.5D交互界面
2. WHEN 学生拖拽仪器组件 THEN Virtual_Simulation SHALL 验证组装顺序和连接正确性
3. WHEN 学生调节设备参数 THEN Virtual_Simulation SHALL 实时显示参数变化带来的后果
4. WHEN 学生操作错误 THEN Virtual_Simulation SHALL 显示错误提示和正确操作演示
5. WHEN 学生完成仿真操作 THEN Virtual_Simulation SHALL 记录操作路径并评估操作规范性

### Requirement 10: 实时排行与竞赛系统

**User Story:** As a 教师, I want to 组织学生进行实训竞赛, so that I can 激发学习积极性和团队协作。

#### Acceptance Criteria

1. WHEN 教师开启竞赛模式 THEN Virtual_Station SHALL 向参赛学生推送竞赛任务
2. WHEN 竞赛进行中 THEN Virtual_Station SHALL 显示实时排行榜（按完成进度和质量排序）
3. WHEN 学生完成竞赛任务 THEN Virtual_Station SHALL 计算综合得分并更新排名
4. WHEN 竞赛结束 THEN Virtual_Station SHALL 显示最终排名和各学生的完成路径对比
5. WHEN 教师导出竞赛结果 THEN Virtual_Station SHALL 生成包含详细数据的Excel报告

### Requirement 11: 学习进度与记录系统

**User Story:** As a 学生, I want to 保存学习进度和查看历史记录, so that I can 随时继续学习和回顾已完成的任务。

#### Acceptance Criteria

1. WHEN 学生中途退出 THEN Virtual_Station SHALL 自动保存当前进度到云端
2. WHEN 学生返回平台 THEN Virtual_Station SHALL 提供继续上次进度的选项
3. WHEN 学生完成任务 THEN Virtual_Station SHALL 保存完整记录（任务ID、得分、用时、操作路径）
4. WHEN 学生查看历史 THEN Virtual_Station SHALL 显示已完成任务列表和各项得分
5. WHEN 学生选择历史任务 THEN Virtual_Station SHALL 支持查看详情或重新挑战

### Requirement 12: 教师管理后台

**User Story:** As a 教师, I want to 管理工位内容和查看学生数据, so that I can 定制教学内容和跟踪学习效果。

#### Acceptance Criteria

1. WHEN 教师进入管理后台 THEN Virtual_Station SHALL 显示工位管理、任务管理、学生管理、数据分析入口
2. WHEN 教师创建新工位 THEN Virtual_Station SHALL 提供工位编辑器，支持设置场景、任务流、评分规则
3. WHEN 教师查看学生数据 THEN Virtual_Station SHALL 显示个人和班级的学习进度、成绩分布、行为分析
4. WHEN 教师导出数据 THEN Virtual_Station SHALL 支持导出学生成绩、行为日志、错误分析报告
5. WHEN 教师设置任务截止时间 THEN Virtual_Station SHALL 在截止前向未完成学生发送提醒

