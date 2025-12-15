# Requirements Document

## Introduction

本需求文档定义了"危废鉴别剧本杀"交互式教学模块。该模块是固体废物监测课程的创新教学工具，通过沉浸式推理游戏的形式，帮助学生掌握GB 5085系列危险废物鉴别标准。学生扮演"环境侦探"角色，通过分析案件卷宗、购买检测线索、做出鉴别判定，在游戏化的过程中学习危废鉴别的专业知识和决策逻辑。

## Glossary

- **Detective_Game**: 危废鉴别剧本杀系统，提供沉浸式推理游戏的核心模块
- **Case_File**: 案件卷宗，包含不明废弃物的基础信息（气味、工艺、外观等）
- **Clue_Card**: 线索卡片，代表可购买的检测项目及其结果
- **Virtual_Budget**: 虚拟预算，学生用于购买检测项目的游戏货币
- **Detection_Item**: 检测项目，如重金属检测、有机物检测、腐蚀性检测等
- **Identification_Result**: 鉴别结果，最终判定废物是否为危险废物
- **Score_Engine**: 评分引擎，根据检测路径和预算使用计算得分
- **Case_Library**: 案件库，存储预设的危废鉴别案例
- **GB_5085_Standard**: 国标GB 5085系列危险废物鉴别标准

## Requirements

### Requirement 1: 案件卷宗系统

**User Story:** As a 学生, I want to 查看不明废弃物的案件卷宗, so that I can 获取初步信息开始推理分析。

#### Acceptance Criteria

1. WHEN 学生进入游戏 THEN Detective_Game SHALL 显示案件卷宗界面，包含废弃物的基础描述信息
2. WHEN 案件卷宗加载完成 THEN Detective_Game SHALL 显示以下信息：废物来源（产生工艺）、外观描述（颜色、形态）、气味描述、初步检测数据（如pH值）
3. WHEN 学生查看卷宗 THEN Detective_Game SHALL 以"档案袋"或"卷宗夹"的视觉风格呈现信息
4. WHEN 卷宗包含图片证据 THEN Detective_Game SHALL 支持点击放大查看废物照片
5. WHEN 学生首次查看案件 THEN Detective_Game SHALL 显示案件难度等级（初级/中级/高级）和预算额度

### Requirement 2: 线索购买系统

**User Story:** As a 学生, I want to 使用虚拟预算购买检测项目获取线索, so that I can 逐步收集证据进行危废鉴别。

#### Acceptance Criteria

1. WHEN 学生打开检测商店 THEN Detective_Game SHALL 显示可购买的检测项目列表及价格
2. WHEN 检测项目列表显示 THEN Detective_Game SHALL 按类别分组：腐蚀性检测、急性毒性检测、浸出毒性检测、易燃性检测、反应性检测、毒性物质含量检测
3. WHEN 学生购买检测项目 THEN Detective_Game SHALL 扣除相应虚拟预算并显示检测结果
4. WHEN 学生预算不足 THEN Detective_Game SHALL 阻止购买并提示"预算不足，请谨慎选择检测项目"
5. WHEN 检测结果返回 THEN Detective_Game SHALL 以"线索卡片"形式展示，包含检测项目名称、检测值、标准限值、是否超标
6. WHEN 学生购买重复检测项目 THEN Detective_Game SHALL 阻止购买并提示"该项目已检测"
7. WHEN 学生购买检测项目 THEN Detective_Game SHALL 记录购买顺序和时间用于评分

### Requirement 3: 智能提示系统

**User Story:** As a 学生, I want to 在推理过程中获得适当的提示, so that I can 学习专业的鉴别思路而不是盲目猜测。

#### Acceptance Criteria

1. WHEN 学生连续购买3个无关检测项目 THEN Detective_Game SHALL 显示温和提示"侦探，注意分析废物来源，可能有更精准的检测方向"
2. WHEN 学生查看某个检测项目详情 THEN Detective_Game SHALL 显示该项目适用的废物类型和相关国标条款
3. WHEN 学生悬停在专业术语上 THEN Detective_Game SHALL 显示术语解释tooltip
4. WHEN 学生请求帮助 THEN Detective_Game SHALL 提供当前案件的推理思路提示（消耗少量预算）
5. WHEN 学生完成案件后 THEN Detective_Game SHALL 显示最优解题路径对比

### Requirement 4: 鉴别判定系统

**User Story:** As a 学生, I want to 根据收集的线索做出危废鉴别判定, so that I can 完成案件并获得评价。

#### Acceptance Criteria

1. WHEN 学生点击"提交鉴别结论" THEN Detective_Game SHALL 显示判定选项：危险废物、一般工业固废、需要进一步鉴别
2. WHEN 学生选择"危险废物" THEN Detective_Game SHALL 要求选择危险特性类别（腐蚀性、毒性、易燃性、反应性、感染性）
3. WHEN 学生选择危险特性 THEN Detective_Game SHALL 要求填写判定依据（选择相关国标条款）
4. WHEN 学生提交判定 THEN Detective_Game SHALL 验证判定结果是否正确
5. WHEN 判定正确 THEN Detective_Game SHALL 显示成功结局动画和详细评分
6. WHEN 判定错误 THEN Detective_Game SHALL 显示失败结局和后果说明（如"误判导致环境污染"或"过度鉴定浪费资源"）

### Requirement 5: 评分与反馈系统

**User Story:** As a 学生, I want to 获得详细的评分和反馈, so that I can 了解自己的鉴别能力和改进方向。

#### Acceptance Criteria

1. WHEN 案件完成 THEN Score_Engine SHALL 计算综合得分（0-100分）
2. WHEN 计算得分时 THEN Score_Engine SHALL 考虑以下维度：判定准确性（40%）、预算使用效率（30%）、检测路径合理性（20%）、用时（10%）
3. WHEN 学生使用最少检测项目正确判定 THEN Score_Engine SHALL 给予"精准侦探"称号和额外加分
4. WHEN 学生购买过多无关检测 THEN Score_Engine SHALL 在预算效率维度扣分
5. WHEN 评分完成 THEN Score_Engine SHALL 显示与最优路径的对比分析
6. WHEN 得分达到90分以上 THEN Score_Engine SHALL 显示"金牌侦探"成就和庆祝动画
7. WHEN 得分低于60分 THEN Score_Engine SHALL 显示详细的改进建议和相关知识点链接

### Requirement 6: 案件库管理

**User Story:** As a 教师, I want to 管理和创建危废鉴别案件, so that I can 根据教学需要定制案例。

#### Acceptance Criteria

1. WHEN 教师进入案件管理 THEN Case_Library SHALL 显示所有预设案件列表
2. WHEN 案件列表显示 THEN Case_Library SHALL 包含至少以下预设案件：电镀废水处理污泥、废矿物油、废酸液、医疗废物、废有机溶剂
3. WHEN 教师创建新案件 THEN Case_Library SHALL 提供案件编辑器，支持设置卷宗信息、正确答案、检测项目结果
4. WHEN 教师编辑案件 THEN Case_Library SHALL 支持设置案件难度、预算额度、时间限制
5. WHEN 教师保存案件 THEN Case_Library SHALL 验证案件完整性（必须有正确答案和至少一条关键线索）

### Requirement 7: 游戏进度与记录

**User Story:** As a 学生, I want to 保存游戏进度和查看历史记录, so that I can 追踪学习进度和复习之前的案件。

#### Acceptance Criteria

1. WHEN 学生中途退出游戏 THEN Detective_Game SHALL 自动保存当前进度到本地存储
2. WHEN 学生返回游戏 THEN Detective_Game SHALL 提供继续上次进度或重新开始的选项
3. WHEN 学生完成案件 THEN Detective_Game SHALL 保存完整记录（案件ID、得分、用时、检测路径）
4. WHEN 学生查看历史记录 THEN Detective_Game SHALL 显示已完成案件列表和各项得分
5. WHEN 学生选择历史案件 THEN Detective_Game SHALL 支持重玩该案件（清空之前的检测记录）

### Requirement 8: 多人竞赛模式

**User Story:** As a 教师, I want to 组织学生进行危废鉴别竞赛, so that I can 增加课堂互动性和学习积极性。

#### Acceptance Criteria

1. WHEN 教师开启竞赛模式 THEN Detective_Game SHALL 向所有在线学生推送同一案件
2. WHEN 竞赛开始 THEN Detective_Game SHALL 显示倒计时和实时排行榜
3. WHEN 学生提交判定 THEN Detective_Game SHALL 实时更新排行榜（按得分和用时排序）
4. WHEN 竞赛结束 THEN Detective_Game SHALL 显示最终排名和各学生的检测路径对比
5. WHEN 竞赛结束 THEN Detective_Game SHALL 支持导出竞赛结果为Excel报告

### Requirement 9: 知识库集成

**User Story:** As a 学生, I want to 在游戏中快速查阅GB 5085标准, so that I can 在实践中学习标准内容。

#### Acceptance Criteria

1. WHEN 学生点击"知识库"按钮 THEN Detective_Game SHALL 显示GB 5085系列标准的结构化内容
2. WHEN 知识库显示 THEN Detective_Game SHALL 按危险特性分类：腐蚀性(GB 5085.1)、急性毒性(GB 5085.2)、浸出毒性(GB 5085.3)、易燃性(GB 5085.4)、反应性(GB 5085.5)、毒性物质含量(GB 5085.6)
3. WHEN 学生搜索知识库 THEN Detective_Game SHALL 支持按关键词搜索标准条款
4. WHEN 学生在游戏中遇到相关检测项目 THEN Detective_Game SHALL 提供快速跳转到对应标准条款的链接
5. WHEN 学生查看标准条款 THEN Detective_Game SHALL 显示限值表格和判定方法说明

