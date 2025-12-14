# Design Document

## Overview

本设计将题库管理系统升级为三级层级结构（课程→项目→任务→题目），通过数据库表重构和前端界面改造实现。系统将保持与现有Supabase后端的兼容性，并提供直观的树形导航界面。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    题库管理中心 (questionbank.html)           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │   侧边栏      │  │           主内容区                    │ │
│  │              │  │                                      │ │
│  │ 📖 课程A     │  │  ┌─────────────────────────────────┐ │ │
│  │  └📁 项目1   │  │  │  筛选栏: 搜索/题型/难度          │ │ │
│  │    └📋 任务a │  │  └─────────────────────────────────┘ │ │
│  │    └📋 任务b │  │  ┌─────────────────────────────────┐ │ │
│  │  └📁 项目2   │  │  │  题目列表                        │ │ │
│  │ 📖 课程B     │  │  │  - 题目1 [任务a]                 │ │ │
│  │              │  │  │  - 题目2 [任务b]                 │ │ │
│  └──────────────┘  │  └─────────────────────────────────┘ │ │
│                    └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. 数据库层

#### courses 表（课程）
- 保持现有结构，作为最高层级

#### projects 表（项目）- 新增
- 关联到 courses 表
- 存储项目信息

#### tasks 表（任务）- 新增
- 关联到 projects 表
- 存储任务信息
- 替代原有的 question_categories 表

#### questions 表
- 修改关联字段，从 category_id 改为 task_id

### 2. 前端组件

#### 侧边栏树形导航
- 可折叠的三级树形结构
- 点击展开/收起
- 显示各级题目数量

#### 层级管理弹窗
- 课程管理弹窗
- 项目管理弹窗
- 任务管理弹窗

#### 题目选择器
- 级联选择：课程 → 项目 → 任务

## Data Models

### courses 表（保持现有）
```sql
courses (
    id SERIAL PRIMARY KEY,
    course_id UUID UNIQUE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    teacher VARCHAR(100),
    semester VARCHAR(50),
    color VARCHAR(20),
    project_count INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP
)
```

### projects 表（新增）
```sql
projects (
    id SERIAL PRIMARY KEY,
    project_id UUID UNIQUE,
    course_id UUID REFERENCES courses(course_id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    task_count INTEGER DEFAULT 0,
    question_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP
)
```

### tasks 表（新增）
```sql
tasks (
    id SERIAL PRIMARY KEY,
    task_id UUID UNIQUE,
    project_id UUID REFERENCES projects(project_id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    question_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP
)
```

### questions 表（修改）
```sql
questions (
    -- 现有字段保持不变
    round INTEGER,
    title TEXT,
    options JSONB,
    answer VARCHAR(50),
    question_type VARCHAR(20),
    knowledge_tag VARCHAR(100),
    difficulty INTEGER,
    -- 修改关联字段
    task_id UUID REFERENCES tasks(task_id),  -- 替代 category_id
    created_at TIMESTAMP
)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Hierarchy Integrity - Foreign Key Constraints
*For any* project created, the project must have a valid course_id referencing an existing course; *for any* task created, the task must have a valid project_id referencing an existing project; *for any* question created, the question must have a valid task_id referencing an existing task.
**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Course Data Completeness
*For any* course creation with valid input, all provided attributes (name, code, teacher, semester, description, color) must be stored and retrievable.
**Validates: Requirements 1.1**

### Property 3: Empty Name Rejection
*For any* course, project, or task creation attempt with an empty name, the system must reject the operation.
**Validates: Requirements 2.2, 3.2, 4.2**

### Property 4: Cascade Delete - Course Level
*For any* course deletion, all projects belonging to that course, all tasks belonging to those projects, and all questions belonging to those tasks must be deleted.
**Validates: Requirements 2.4**

### Property 5: Cascade Delete - Project Level
*For any* project deletion, all tasks belonging to that project and all questions belonging to those tasks must be deleted.
**Validates: Requirements 3.4**

### Property 6: Cascade Delete - Task Level
*For any* task deletion, all questions belonging to that task must be deleted.
**Validates: Requirements 4.4**

### Property 7: Filter by Course
*For any* course selection, the returned questions must be exactly those where the question's task belongs to a project that belongs to the selected course.
**Validates: Requirements 2.5**

### Property 8: Filter by Project
*For any* project selection, the returned questions must be exactly those where the question's task belongs to the selected project.
**Validates: Requirements 3.5**

### Property 9: Filter by Task
*For any* task selection, the returned questions must be exactly those with task_id matching the selected task.
**Validates: Requirements 4.5, 6.4**

### Property 10: All Questions Filter
*For any* "all questions" selection, the returned questions must equal the total count of all questions in the database.
**Validates: Requirements 6.5**

### Property 11: Question Count Accuracy
*For any* hierarchy node, the displayed question_count must equal the actual count of questions belonging to that node (directly for tasks, aggregated for projects and courses).
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 12: Import Task Association
*For any* CSV import operation, all imported questions must have their task_id set to the selected target task.
**Validates: Requirements 5.1, 5.2**

### Property 13: Edit Preserves Relationships
*For any* course edit operation, all associated projects must remain linked to the course after the edit.
**Validates: Requirements 2.3**

## Error Handling

### 数据库错误
- 外键约束违反：显示友好错误消息，提示用户先删除子级数据
- 唯一约束违反：提示名称已存在
- 连接错误：显示重试按钮

### 用户输入错误
- 空名称：阻止提交，显示验证提示
- 无效选择：禁用提交按钮直到选择有效

### 级联删除确认
- 删除课程：显示将删除的项目、任务、题目数量
- 删除项目：显示将删除的任务、题目数量
- 删除任务：显示将删除的题目数量

## Testing Strategy

### 单元测试
- 测试层级数据加载函数
- 测试题目数量计算函数
- 测试筛选逻辑

### 属性测试
使用手动验证方式测试核心属性：
- 创建完整层级后验证数据完整性
- 删除各级节点后验证级联删除
- 添加/删除题目后验证计数更新

### 集成测试
- 测试完整的CRUD流程
- 测试CSV导入到指定任务
- 测试侧边栏导航和筛选
