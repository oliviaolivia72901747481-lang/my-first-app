# Implementation Plan

- [x] 1. 创建数据库表和基础模块






  - [x] 1.1 创建版本历史表 SQL 脚本


    - 创建 question_versions 表结构
    - 添加索引和外键约束
    - 配置 RLS 策略
    - _Requirements: 9.1, 9.2_


  - [x] 1.2 创建模板和筛选表 SQL 脚本

    - 创建 question_templates 表
    - 创建 saved_filters 表
    - 创建 ai_generation_log 表
    - _Requirements: 8.3, 3.5_

- [x] 2. 实现批量操作模块






  - [x] 2.1 创建 js/batch-operations.js 模块


    - 实现选择管理（selectAll, deselectAll, toggleSelect）
    - 实现 getSelectedCount() 函数
    - _Requirements: 1.1, 1.2, 1.6_

  - [ ]* 2.2 编写属性测试：全选完整性
    - **Property 1: Select All Completeness**
    - **Validates: Requirements 1.2, 1.6**

  - [x] 2.3 实现批量删除功能

    - 实现 batchDelete() 函数
    - 添加确认对话框逻辑
    - 返回操作统计结果
    - _Requirements: 1.3, 1.5_

  - [ ]* 2.4 编写属性测试：批量删除正确性
    - **Property 2: Batch Delete Correctness**
    - **Validates: Requirements 1.3, 1.5**

  - [x] 2.5 实现批量移动和更新功能

    - 实现 batchMove() 函数
    - 实现 batchUpdate() 函数（支持部分字段更新）
    - _Requirements: 1.4, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.6 编写属性测试：批量移动和更新
    - **Property 3: Batch Move Correctness**
    - **Property 4: Batch Update Partial Fields**
    - **Validates: Requirements 1.4, 2.2, 2.3, 2.4, 2.5**

  - [x] 2.7 实现批量复制功能

    - 实现 batchCopy() 函数
    - 支持选择目标任务
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 2.8 编写属性测试：复制保留内容
    - **Property 15: Copy Preserves Content**
    - **Validates: Requirements 10.1, 10.2**

- [x] 3. Checkpoint - 确保批量操作测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 实现高级搜索模块






  - [x] 4.1 创建 js/question-search.js 模块


    - 实现 search() 全文搜索函数
    - 实现 filter() 多条件筛选函数
    - 实现 searchAndFilter() 组合函数
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 4.2 编写属性测试：搜索和筛选
    - **Property 5: Search Result Relevance**
    - **Property 6: Filter AND Logic**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 4.3 实现关键词高亮功能


    - 实现 highlightKeyword() 函数
    - _Requirements: 3.4_

  - [x] 4.4 实现筛选条件保存功能


    - 实现 saveFilter() 函数
    - 实现 loadSavedFilters() 函数
    - 实现 deleteSavedFilter() 函数
    - _Requirements: 3.5_

  - [ ]* 4.5 编写属性测试：筛选条件保存
    - **Property 7: Saved Filter Round Trip**
    - **Validates: Requirements 3.5**


- [x] 5. 实现导入导出增强模块





  - [x] 5.1 创建 js/import-export.js 模块


    - 实现 parseCSV() 增强版（支持错误标记）
    - 实现 validateQuestion() 验证函数
    - _Requirements: 6.1, 6.3_

  - [ ]* 5.2 编写属性测试：导入验证
    - **Property 9: Import Validation Accuracy**
    - **Validates: Requirements 6.3, 6.4, 6.5**


  - [x] 5.3 实现 Excel 导入功能

    - 集成 SheetJS 库
    - 实现 parseExcel() 函数
    - _Requirements: 6.2_

  - [x] 5.4 实现导入选项功能


    - 支持覆盖模式选择
    - 实现 importQuestions() 增强版
    - _Requirements: 6.4, 6.5, 6.6_


  - [x] 5.5 实现多格式导出功能

    - 实现 exportToCSV() 函数
    - 实现 exportToExcel() 函数
    - 实现 exportToJSON() 函数
    - _Requirements: 7.2, 7.3, 7.5_

  - [ ]* 5.6 编写属性测试：导出完整性
    - **Property 10: Export Completeness**
    - **Validates: Requirements 7.2, 7.5**


- [x] 6. Checkpoint - 确保导入导出测试通过




  - Ensure all tests pass, ask the user if questions arise.


- [x] 7. 实现版本历史模块






  - [x] 7.1 创建 js/version-history.js 模块

    - 实现 saveVersion() 函数
    - 实现 getVersions() 函数
    - 实现 getVersion() 函数
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 7.2 编写属性测试：版本创建
    - **Property 12: Version Creation on Edit**
    - **Validates: Requirements 9.1**

  - [x] 7.3 实现版本恢复功能


    - 实现 restoreVersion() 函数
    - 实现 compareVersions() 函数
    - _Requirements: 9.4_

  - [ ]* 7.4 编写属性测试：版本恢复
    - **Property 13: Version Restore Correctness**
    - **Validates: Requirements 9.4**


  - [x] 7.5 实现版本清理功能

    - 实现 cleanupVersions() 函数
    - 保留最近10个版本
    - _Requirements: 9.5_

  - [ ]* 7.6 编写属性测试：版本限制
    - **Property 14: Version Limit Enforcement**
    - **Validates: Requirements 9.5**


- [x] 8. 实现题目模板模块





  - [x] 8.1 创建 js/question-templates.js 模块


    - 定义内置模板（单选、多选、判断、填空）
    - 实现 applyTemplate() 函数
    - _Requirements: 8.1, 8.2_

  - [ ]* 8.2 编写属性测试：模板应用
    - **Property 11: Template Application**
    - **Validates: Requirements 8.2**


  - [x] 8.3 实现自定义模板管理

    - 实现 saveTemplate() 函数
    - 实现 getTemplates() 函数
    - 实现 deleteTemplate() 函数
    - _Requirements: 8.3, 8.4_

- [x] 9. Checkpoint - 确保模板和版本测试通过





  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. 实现 AI 助手模块








  - [x] 10.1 创建 js/ai-assistant.js 模块


    - 配置 API 连接（支持 OpenAI/Claude）
    - 实现 buildGeneratePrompt() 提示词构建
    - 实现 buildOptimizePrompt() 提示词构建
    - _Requirements: 4.1, 5.1_


  - [x] 10.2 实现 AI 生成题目功能



    - 实现 generateQuestions() 函数
    - 支持指定题型、难度、数量
    - 验证生成数量约束
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 10.3 编写属性测试：AI生成数量约束
    - **Property 8: AI Generation Count Constraint**
    - **Validates: Requirements 4.4**


  - [x] 10.4 实现 AI 优化题目功能

    - 实现 optimizeQuestion() 函数
    - 实现 generateExplanation() 函数
    - 实现 checkQuality() 函数
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 10.5 实现 AI 错误处理


    - 处理 API 超时和速率限制
    - 显示友好的错误提示
    - _Requirements: 4.7_

- [x] 11. 更新题库管理页面 UI








  - [x] 11.1 添加批量操作工具栏


    - 添加复选框到题目列表
    - 添加全选/取消全选按钮
    - 添加批量操作按钮（删除、移动、编辑、复制）
    - 显示已选数量
    - _Requirements: 1.1, 1.2, 1.6_

  - [x] 11.2 添加高级搜索面板


    - 添加搜索输入框
    - 添加多条件筛选器
    - 添加保存筛选按钮
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 11.3 添加 AI 助手面板


    - 添加 AI 生成题目界面
    - 添加 AI 优化题目界面
    - 添加 API 配置界面
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.5_


  - [x] 11.4 添加导入导出增强界面

    - 更新导入弹窗支持 Excel
    - 添加导出选项面板
    - 添加错误预览和统计
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 7.1, 7.2, 7.3_


  - [x] 11.5 添加版本历史界面

    - 添加版本历史查看按钮
    - 添加版本列表弹窗
    - 添加版本对比和恢复功能
    - _Requirements: 9.2, 9.3, 9.4_


  - [x] 11.6 添加模板选择界面

    - 添加模板选择下拉框
    - 添加自定义模板管理入口
    - _Requirements: 8.1, 8.2, 8.4_

- [x] 12. 集成和完善







  - [x] 12.1 集成所有模块到 questionbank.html

    - 引入所有新建的 JS 模块
    - 绑定 UI 事件到模块函数
    - _Requirements: All_


  - [x] 12.2 添加操作日志记录

    - 记录批量操作日志
    - 记录 AI 生成日志
    - _Requirements: 1.5_

- [ ] 13. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

