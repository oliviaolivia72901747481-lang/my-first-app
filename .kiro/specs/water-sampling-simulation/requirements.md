# Requirements Document

## Introduction

本文档定义了"地表水采样虚拟仿真模块"的需求规格。该模块是虚拟工位平台中"环境监测站"工位的核心实训组件，用于模拟地表水采样的完整操作流程。学生将在虚拟河流场景中，根据HJ/T 91-2002《地表水和污水监测技术规范》的要求，完成采样点位选择、采样器具准备、采样操作和样品保存等环节。

## Glossary

- **采样断面**: 在河流中垂直于水流方向设置的采样位置线
- **采样点位**: 在采样断面上具体的采样位置点
- **采样器具**: 用于采集水样的工具，如采样瓶、采样器等
- **样品保存**: 采集后对水样进行的保存处理，包括加保存剂、冷藏等
- **现场测定**: 在采样现场进行的水质参数测定，如水温、pH、溶解氧等
- **HJ/T 91-2002**: 《地表水和污水监测技术规范》国家标准

## Requirements

### Requirement 1

**User Story:** As a 环境监测专业学生, I want to 在虚拟河流场景中选择采样点位, so that I can 学习正确的采样断面和点位布设方法。

#### Acceptance Criteria

1. WHEN 用户进入虚拟仿真模块 THEN the system SHALL 显示一个可交互的河流俯视图场景，包含河流、河岸、工业园区等元素
2. WHEN 用户点击河流上的位置 THEN the system SHALL 允许用户在该位置设置采样断面
3. WHEN 用户设置采样断面后 THEN the system SHALL 显示断面详情视图，允许用户在断面上选择具体采样点位
4. WHEN 用户选择的点位不符合规范要求 THEN the system SHALL 显示警告提示并说明原因
5. WHEN 用户完成点位选择 THEN the system SHALL 记录选择的点位信息供后续评分使用

### Requirement 2

**User Story:** As a 环境监测专业学生, I want to 选择和准备采样器具, so that I can 学习不同水质参数对应的采样容器和保存方法。

#### Acceptance Criteria

1. WHEN 用户进入器具准备阶段 THEN the system SHALL 显示可用的采样器具列表，包含采样瓶、采样器、保存剂等
2. WHEN 用户选择采样器具 THEN the system SHALL 显示该器具的规格、用途和使用注意事项
3. WHEN 用户选择的器具与监测项目不匹配 THEN the system SHALL 提供提示信息
4. WHEN 用户完成器具选择 THEN the system SHALL 将选择的器具添加到采样工具箱中

### Requirement 3

**User Story:** As a 环境监测专业学生, I want to 执行虚拟采样操作, so that I can 掌握正确的采样步骤和操作规范。

#### Acceptance Criteria

1. WHEN 用户开始采样操作 THEN the system SHALL 显示采样操作界面，包含采样点位、采样器具和操作按钮
2. WHEN 用户执行采样前冲洗操作 THEN the system SHALL 播放冲洗动画并记录操作
3. WHEN 用户执行采样操作 THEN the system SHALL 模拟水样采集过程并显示采集进度
4. WHEN 用户跳过必要的操作步骤 THEN the system SHALL 记录为操作失误并在评分时扣分
5. WHEN 用户完成单个点位采样 THEN the system SHALL 允许用户继续下一个点位或结束采样

### Requirement 4

**User Story:** As a 环境监测专业学生, I want to 进行现场测定和样品保存, so that I can 学习现场参数测定方法和样品保存要求。

#### Acceptance Criteria

1. WHEN 用户进入现场测定阶段 THEN the system SHALL 显示可测定的现场参数列表（水温、pH、溶解氧等）
2. WHEN 用户选择测定参数 THEN the system SHALL 模拟测定过程并生成随机但合理的测定值
3. WHEN 用户进入样品保存阶段 THEN the system SHALL 显示保存方法选项（加酸、加碱、冷藏等）
4. WHEN 用户选择的保存方法与监测项目不匹配 THEN the system SHALL 记录为操作失误
5. WHEN 用户完成所有操作 THEN the system SHALL 生成操作记录数据供后续阶段使用

### Requirement 5

**User Story:** As a 环境监测专业学生, I want to 获得操作评分和反馈, so that I can 了解自己的操作是否符合规范要求。

#### Acceptance Criteria

1. WHEN 用户完成所有采样操作 THEN the system SHALL 计算综合评分，包含点位选择、器具选择、操作规范、保存方法等维度
2. WHEN 评分完成 THEN the system SHALL 显示详细的评分报告，列出每个环节的得分和扣分原因
3. WHEN 用户操作存在错误 THEN the system SHALL 提供正确操作的说明和相关标准引用
4. WHEN 用户获得高分 THEN the system SHALL 显示鼓励信息和成就徽章
