# Requirements Document

## Introduction

本功能将题库管理系统从原有的"课程-分类"两级结构升级为"课程-项目-任务"三级层级结构。这种结构更符合教学实践中的课程组织方式，便于教师按照教学进度和知识模块组织题目。

## Glossary

- **课程 (Course)**: 最高层级，代表一门完整的教学课程，如"环境监测技术"
- **项目 (Project)**: 中间层级，代表课程下的教学项目或章节，如"土壤检测"、"水质分析"
- **任务 (Task)**: 最低层级，代表项目下的具体学习任务或知识点，如"土壤水分测定"、"重金属检测"
- **题目 (Question)**: 属于某个任务的具体测试题目
- **题库管理中心**: 用于管理课程、项目、任务和题目的Web界面

## Requirements

### Requirement 1

**User Story:** As a teacher, I want to organize questions in a three-level hierarchy (Course → Project → Task), so that I can structure my question bank according to my teaching curriculum.

#### Acceptance Criteria

1. WHEN a teacher creates a new course THEN the system SHALL store the course with name, code, teacher, semester, description, and color attributes
2. WHEN a teacher creates a new project THEN the system SHALL require the project to be associated with exactly one course
3. WHEN a teacher creates a new task THEN the system SHALL require the task to be associated with exactly one project
4. WHEN a teacher adds a question THEN the system SHALL require the question to be associated with exactly one task
5. WHEN displaying the hierarchy THEN the system SHALL show courses containing projects containing tasks

### Requirement 2

**User Story:** As a teacher, I want to manage courses in the question bank center, so that I can create, edit, and delete courses for my teaching needs.

#### Acceptance Criteria

1. WHEN a teacher opens the course management interface THEN the system SHALL display all existing courses with their project counts
2. WHEN a teacher creates a course THEN the system SHALL validate that the course name is not empty
3. WHEN a teacher edits a course THEN the system SHALL update all course attributes and preserve associated projects
4. WHEN a teacher deletes a course THEN the system SHALL prompt for confirmation and cascade delete all associated projects, tasks, and questions
5. WHEN a course is selected in the sidebar THEN the system SHALL filter the question list to show only questions belonging to that course

### Requirement 3

**User Story:** As a teacher, I want to manage projects within courses, so that I can organize teaching content into logical modules.

#### Acceptance Criteria

1. WHEN a teacher opens the project management interface THEN the system SHALL display projects grouped by their parent course
2. WHEN a teacher creates a project THEN the system SHALL require selection of a parent course and a project name
3. WHEN a teacher edits a project THEN the system SHALL allow changing the project name, description, and color
4. WHEN a teacher deletes a project THEN the system SHALL cascade delete all associated tasks and questions
5. WHEN a project is selected in the sidebar THEN the system SHALL filter the question list to show only questions belonging to that project

### Requirement 4

**User Story:** As a teacher, I want to manage tasks within projects, so that I can organize specific learning objectives and knowledge points.

#### Acceptance Criteria

1. WHEN a teacher opens the task management interface THEN the system SHALL display tasks grouped by their parent project
2. WHEN a teacher creates a task THEN the system SHALL require selection of a parent project and a task name
3. WHEN a teacher edits a task THEN the system SHALL allow changing the task name, description, and color
4. WHEN a teacher deletes a task THEN the system SHALL cascade delete all associated questions
5. WHEN a task is selected in the sidebar THEN the system SHALL filter the question list to show only questions belonging to that task

### Requirement 5

**User Story:** As a teacher, I want to import questions and assign them to specific tasks, so that I can efficiently populate my question bank.

#### Acceptance Criteria

1. WHEN importing questions via CSV THEN the system SHALL require selection of a target task
2. WHEN a question is imported THEN the system SHALL associate the question with the selected task and inherit the task's project and course
3. WHEN adding a single question THEN the system SHALL require selection of a task from the hierarchy
4. WHEN editing a question THEN the system SHALL allow changing the question's associated task

### Requirement 6

**User Story:** As a teacher, I want to navigate the three-level hierarchy in the sidebar, so that I can quickly find and filter questions.

#### Acceptance Criteria

1. WHEN the sidebar loads THEN the system SHALL display a collapsible tree structure showing Course → Project → Task hierarchy
2. WHEN a teacher clicks on a course THEN the system SHALL expand to show its projects
3. WHEN a teacher clicks on a project THEN the system SHALL expand to show its tasks
4. WHEN a teacher clicks on a task THEN the system SHALL filter questions to show only that task's questions
5. WHEN "All Questions" is selected THEN the system SHALL display all questions across all courses

### Requirement 7

**User Story:** As a teacher, I want to see statistics at each hierarchy level, so that I can understand the distribution of questions in my question bank.

#### Acceptance Criteria

1. WHEN displaying a course THEN the system SHALL show the total question count across all its projects and tasks
2. WHEN displaying a project THEN the system SHALL show the total question count across all its tasks
3. WHEN displaying a task THEN the system SHALL show the question count for that specific task
4. WHEN questions are added or deleted THEN the system SHALL update the counts at all affected hierarchy levels
