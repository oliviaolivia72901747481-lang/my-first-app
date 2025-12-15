# Implementation Plan

## 采样布点沙盘实现任务

- [x] 1. 项目结构与基础设置





  - [x] 1.1 创建采样布点沙盘HTML页面框架


    - 创建 `public/classroom/sampling-sandbox.html` 文件
    - 设置页面基础结构：头部、工具栏、Canvas区域、侧边栏
    - 添加必要的CSS样式（与现有课堂系统风格一致）
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 创建核心JavaScript模块


    - 创建 `public/classroom/js/sampling-sandbox.js` 主控制器
    - 定义数据模型接口（SamplingPoint, Scenario, etc.）
    - 初始化Supabase连接（如需要）
    - _Requirements: 1.1_

- [x] 2. Canvas渲染引擎实现





  - [x] 2.1 实现Canvas基础渲染


    - 初始化Canvas上下文
    - 实现网格线绘制函数
    - 实现坐标转换函数（屏幕坐标↔Canvas坐标↔网格坐标）
    - _Requirements: 1.2, 1.5_
  - [x] 2.2 实现画布交互功能


    - 实现鼠标滚轮缩放（50%-200%范围限制）
    - 实现拖拽平移功能
    - 实现网格悬停高亮和坐标显示
    - _Requirements: 1.3, 1.4, 1.5_
  - [ ]* 2.3 编写画布缩放属性测试
    - **Property 1: 画布缩放范围约束**
    - **Validates: Requirements 1.3**

- [x] 3. 采样点管理实现





  - [x] 3.1 实现采样点添加功能


    - 点击Canvas添加采样点
    - 自动分配编号（S1, S2, S3...）
    - 边界验证（无效区域阻止添加）
    - _Requirements: 2.1, 2.6, 2.7_
  - [x] 3.2 实现采样点移动和删除


    - 拖拽移动采样点
    - 右键菜单删除采样点
    - 实时更新采样点计数
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  - [ ]* 3.3 编写采样点管理属性测试
    - **Property 2: 采样点增删一致性**
    - **Property 3: 采样点编号唯一性**
    - **Property 4: 边界验证正确性**
    - **Validates: Requirements 2.1, 2.4, 2.5, 2.6, 2.7**

- [x] 4. Checkpoint - 确保基础功能测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 采样方法实现





  - [x] 5.1 实现采样方法选择器


    - 创建方法选择UI（随机、系统、分层、对角线）
    - 实现方法切换逻辑
    - 保留已有采样点
    - _Requirements: 3.1, 3.2, 3.6_

  - [x] 5.2 实现网格吸附功能

    - 系统布点法启用网格吸附
    - 计算最近网格交点
    - 显示网格辅助线
    - _Requirements: 3.3, 7.2_
  - [x] 5.3 实现对角线辅助显示


    - 对角线布点法显示对角线
    - 计算对角线坐标
    - _Requirements: 3.5_
  - [ ]* 5.4 编写网格吸附属性测试
    - **Property 5: 网格吸附计算正确性**
    - **Validates: Requirements 3.3, 7.2**

- [x] 6. 场景管理实现





  - [x] 6.1 创建场景数据结构


    - 定义4个预设场景（堆存场、运输车辆、包装容器、填埋场）
    - 设置场景边界、有效区域、无效区域
    - 配置采样要求和标准答案
    - _Requirements: 4.2, 4.3_
  - [x] 6.2 实现场景选择器UI


    - 创建场景列表显示
    - 实现场景切换功能
    - 切换时清空采样点
    - _Requirements: 4.1, 4.4, 4.5_
  - [ ]* 6.3 编写场景切换属性测试
    - **Property 6: 场景切换状态重置**
    - **Validates: Requirements 4.5**

- [x] 7. 布点验证器实现



  - [x] 7.1 实现采样点数量验证


    - 根据废物堆存量计算最少采样点数
    - 实现国标公式：n = √(废物量/采样单元面积)，最少5个
    - _Requirements: 5.2_

  - [x] 7.2 实现分布均匀性验证
    - 计算采样点覆盖的网格单元
    - 计算覆盖率得分
    - _Requirements: 5.3_
  - [x] 7.3 实现位置有效性验证

    - 检查采样点是否在有效区域内
    - 标记无效位置的采样点
    - _Requirements: 5.4_

  - [x] 7.4 实现验证结果显示

    - 显示验证通过/不通过状态
    - 高亮问题区域
    - 显示改进建议
    - _Requirements: 5.5, 5.6, 5.7_
  - [ ]* 7.5 编写验证器属性测试
    - **Property 7: 最少采样点数计算**
    - **Property 8: 分布均匀性计算**
    - **Validates: Requirements 5.2, 5.3**

- [x] 8. Checkpoint - 确保验证功能测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. 评分系统实现






  - [x] 9.1 实现多维度评分计算

    - 采样点数量得分（30%）
    - 分布均匀性得分（30%）
    - 方法正确性得分（20%）
    - 操作规范性得分（20%）
    - _Requirements: 6.1, 6.2_
  - [x] 9.2 实现评级和反馈


    - 根据总分确定评级（优秀/良好/及格/需改进）
    - 生成文字反馈
    - 显示庆祝动画（优秀时）
    - _Requirements: 6.3, 6.4, 6.5, 6.6_
  - [ ]* 9.3 编写评分系统属性测试
    - **Property 9: 评分范围约束**
    - **Property 10: 评级阈值正确性**
    - **Validates: Requirements 6.1, 6.2, 6.5, 6.6**

- [x] 10. 辅助工具实现






  - [x] 10.1 实现距离和面积计算

    - 显示采样点之间的距离
    - 显示采样区域总面积
    - _Requirements: 7.3, 7.4_

  - [x] 10.2 实现自动布点功能

    - 根据当前采样方法生成推荐布点
    - _Requirements: 7.5_
  - [x] 10.3 实现撤销/重做功能


    - 记录操作历史
    - 实现撤销和重做
    - _Requirements: 7.7_
  - [x] 10.4 实现清空功能


    - 清空所有采样点
    - 重置状态
    - _Requirements: 7.6_
  - [ ]* 10.5 编写辅助工具属性测试
    - **Property 11: 距离计算正确性**
    - **Property 12: 面积计算正确性**
    - **Property 13: 撤销操作正确性**
    - **Validates: Requirements 7.3, 7.4, 7.7**

- [x] 11. 知识点提示系统





  - [x] 11.1 实现操作指南


    - 首次进入显示操作指南
    - 帮助按钮显示完整手册
    - _Requirements: 8.1, 8.5_
  - [x] 11.2 实现方法说明显示


    - 选择采样方法时显示说明
    - 显示适用场景和操作要点
    - _Requirements: 8.2_
  - [x] 11.3 实现国标条款显示


    - 添加采样点时显示相关国标
    - 术语tooltip解释
    - _Requirements: 8.3, 8.6_

- [x] 12. 练习记录管理





  - [x] 12.1 实现记录保存


    - 完成练习后自动保存到localStorage
    - 保存场景、采样点、得分、时间
    - _Requirements: 9.1_
  - [x] 12.2 实现记录查看和加载


    - 显示历史记录列表
    - 加载历史布点方案
    - 删除历史记录
    - _Requirements: 9.2, 9.3, 9.4_

  - [x] 12.3 实现记录数量限制

    - 超过20条自动清理最旧记录
    - _Requirements: 9.5_
  - [ ]* 12.4 编写练习记录属性测试
    - **Property 14: 练习记录数量限制**
    - **Property 15: 练习记录加载一致性**
    - **Validates: Requirements 9.1, 9.3, 9.5**

- [x] 13. Checkpoint - 确保所有核心功能测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. 教师演示模式





  - [x] 14.1 实现演示模式切换


    - 从管理后台进入时提供演示模式选项
    - 隐藏评分功能，放大显示
    - _Requirements: 10.1, 10.2_

  - [x] 14.2 实现标准答案展示

    - 显示场景的推荐布点方案
    - 逐步演示动画
    - _Requirements: 10.4, 10.5_

  - [x] 14.3 实现模式切换

    - 演示完成后切换到练习模式
    - _Requirements: 10.6_

- [x] 15. 系统集成






  - [x] 15.1 添加导航入口

    - 在admin.html添加采样布点沙盘入口按钮
    - 在presentation.html添加课件链接
    - _Requirements: 10.1_
  - [x] 15.2 样式优化和响应式适配


    - 确保与现有系统风格一致
    - 适配不同屏幕尺寸
    - _Requirements: 1.6_

- [x] 16. Final Checkpoint - 确保所有测试通过





  - Ensure all tests pass, ask the user if questions arise.
