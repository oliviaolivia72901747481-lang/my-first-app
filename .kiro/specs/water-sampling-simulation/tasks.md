# Implementation Plan - 地表水采样虚拟仿真模块

- [x] 1. 创建仿真模块基础架构






  - [x] 1.1 创建 WaterSamplingSimulation 类和状态管理器

    - 定义 SimulationState 接口和初始状态
    - 实现 phase 状态转换逻辑
    - 实现状态持久化到 localStorage
    - _Requirements: 1.1, 3.1_
  - [ ]* 1.2 编写状态管理属性测试
    - **Property 3: Point data persistence**
    - **Validates: Requirements 1.5**

- [x] 2. 实现河流场景渲染





  - [x] 2.1 创建河流俯视图场景


    - 使用 Canvas 或 SVG 渲染河流、河岸、工业园区
    - 实现河流配置（宽度50米、深度2米）
    - 添加污染源标记和地标元素
    - _Requirements: 1.1_
  - [x] 2.2 实现点击交互和采样断面设置


    - 监听 Canvas 点击事件
    - 计算点击位置对应的河流坐标
    - 显示采样断面标记
    - _Requirements: 1.2, 1.3_
  - [ ]* 2.3 编写点位有效性属性测试
    - **Property 1: Valid sampling points within river bounds**
    - **Validates: Requirements 1.2**

- [x] 3. 实现采样点位选择功能




  - [x] 3.1 创建断面详情视图









    - 显示河流横截面图
    - 允许选择表层/中层/底层采样点
    - 显示水深刻度和位置指示
    - _Requirements: 1.3_
  - [x] 3.2 实现点位验证逻辑





    - 根据 HJ/T 91-2002 验证点位有效性
    - 检查距岸距离、深度比例等
    - 显示警告提示和原因说明
    - _Requirements: 1.4_
  - [ ]* 3.3 编写无效点位警告属性测试
    - **Property 2: Invalid point selection triggers warning**
    - **Validates: Requirements 1.4**

- [x] 4. Checkpoint - 确保点位选择功能测试通过




  - Ensure all tests pass, ask the user if questions arise.

- [-] 5. 实现采样器具准备功能

  - [x] 5.1 创建器具列表和选择界面



    - 定义采样瓶、采样器、保存剂等器具数据
    - 渲染器具卡片列表
    - 显示器具详情（规格、用途、注意事项）
    - _Requirements: 2.1, 2.2_


  - [x] 5.2 实现器具匹配验证









    - 定义监测项目与器具的匹配规则
    - 验证选择的器具是否适合监测项目
    - 显示不匹配提示

    - _Requirements: 2.3_

  - [ ] 5.3 实现工具箱功能












    - 添加器具到工具箱
    - 显示已选器具列表
    - 支持移除器具
    - _Requirements: 2.4_
  - [ ]* 5.4 编写器具匹配属性测试
    - **Property 4: Equipment-parameter matching validation**
    - **Property 5: Toolbox contains selected equipment**
    - **Validates: Requirements 2.3, 2.4**

- [ ] 6. 实现虚拟采样操作功能










  - [ ] 6.1 创建采样操作界面









    - 显示当前采样点位信息
    - 显示可用器具和操作按钮
    - 实现操作步骤指示器
    - _Requirements: 3.1_
  - [ ] 6.2 实现采样操作动画
    - 冲洗动画（2-3次冲洗）
    - 采样动画（水样采集）
    - 封口和贴标签动画
    - _Requirements: 3.2, 3.3_
  - [ ] 6.3 实现操作序列验证
    - 记录操作步骤和顺序
    - 检测跳过的必要步骤
    - 记录操作失误
    - _Requirements: 3.4, 3.5_
  - [ ]* 6.4 编写操作序列属性测试
    - **Property 6: Operation sequence validation**
    - **Validates: Requirements 3.4**

- [ ] 7. Checkpoint - 确保采样操作功能测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. 实现现场测定功能
  - [ ] 8.1 创建现场测定界面
    - 显示可测定参数列表（水温、pH、溶解氧等）
    - 实现参数选择和测定按钮
    - _Requirements: 4.1_
  - [ ] 8.2 实现测定值模拟生成
    - 根据参数类型生成合理范围内的随机值
    - 水温: 5-30°C, pH: 6.5-8.5, DO: 4-12 mg/L
    - 显示测定结果和单位
    - _Requirements: 4.2_
  - [ ]* 8.3 编写测定值范围属性测试
    - **Property 7: Field measurement value ranges**
    - **Validates: Requirements 4.2**

- [ ] 9. 实现样品保存功能
  - [ ] 9.1 创建样品保存界面
    - 显示保存方法选项（加酸、加碱、冷藏等）
    - 显示各方法适用的监测项目
    - _Requirements: 4.3_
  - [ ] 9.2 实现保存方法验证
    - 定义监测项目与保存方法的匹配规则
    - 验证选择的保存方法是否正确
    - 记录操作失误
    - _Requirements: 4.4_
  - [ ] 9.3 生成操作记录数据
    - 汇总所有操作数据
    - 生成结构化的操作记录
    - 传递给后续阶段使用
    - _Requirements: 4.5_
  - [ ]* 9.4 编写保存方法属性测试
    - **Property 8: Preservation method validation**
    - **Validates: Requirements 4.4**

- [ ] 10. 实现评分和反馈系统
  - [ ] 10.1 实现评分引擎
    - 计算点位选择得分（20分）
    - 计算器具选择得分（20分）
    - 计算操作规范得分（30分）
    - 计算现场测定得分（15分）
    - 计算样品保存得分（15分）
    - _Requirements: 5.1_
  - [ ] 10.2 生成评分报告
    - 显示各维度得分和扣分原因
    - 显示总分和评级
    - 提供正确操作说明和标准引用
    - _Requirements: 5.2, 5.3_
  - [ ] 10.3 实现成就和鼓励系统
    - 高分显示鼓励信息
    - 满分显示特殊成就
    - 增加经验值奖励
    - _Requirements: 5.4_
  - [ ]* 10.4 编写评分完整性属性测试
    - **Property 9: Score calculation completeness**
    - **Property 10: Error feedback completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 11. 集成到虚拟工位平台
  - [ ] 11.1 修改 renderSimulationPlaceholder 函数
    - 替换占位符为实际仿真模块
    - 传递任务配置参数
    - _Requirements: 3.1_
  - [ ] 11.2 实现仿真完成回调
    - 将操作记录传递给下一阶段
    - 更新任务执行状态
    - _Requirements: 4.5_

- [ ] 12. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
