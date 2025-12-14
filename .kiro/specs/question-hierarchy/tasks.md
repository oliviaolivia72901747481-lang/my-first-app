# Implementation Plan

- [x] 1. Create database schema for three-level hierarchy





  - [x] 1.1 Create SQL file for projects and tasks tables


    - Create `projects` table with course_id foreign key
    - Create `tasks` table with project_id foreign key
    - Add indexes for foreign keys
    - Set up RLS policies for public access
    - _Requirements: 1.2, 1.3_
  - [x] 1.2 Create SQL migration for questions table


    - Add task_id column to questions table
    - Create index on task_id
    - _Requirements: 1.4_

- [x] 2. Update questionbank.html sidebar with tree navigation





  - [x] 2.1 Implement collapsible tree structure HTML/CSS


    - Replace flat category list with nested tree structure
    - Add expand/collapse icons and animations
    - Style for three levels: course → project → task
    - _Requirements: 6.1_
  - [x] 2.2 Implement tree data loading and rendering


    - Load courses with nested projects and tasks
    - Render tree with question counts at each level
    - Handle expand/collapse state
    - _Requirements: 6.1, 7.1, 7.2, 7.3_
  - [x] 2.3 Write property test for hierarchy data structure






    - **Property 1: Hierarchy Integrity**
    - **Validates: Requirements 1.2, 1.3, 1.4**

- [ ] 3. Implement course management
  - [ ] 3.1 Update course modal and CRUD functions
    - Modify existing course modal for new schema
    - Update saveCourse() to handle project_count
    - Implement course list display with project counts
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ] 3.2 Implement course deletion with cascade
    - Add confirmation dialog showing affected items count
    - Implement cascade delete for projects, tasks, questions
    - _Requirements: 2.4_
  - [ ]* 3.3 Write property test for cascade delete
    - **Property 4: Cascade Delete - Course Level**
    - **Validates: Requirements 2.4**

- [ ] 4. Implement project management
  - [ ] 4.1 Create project modal and CRUD functions
    - Create project add/edit modal with course selector
    - Implement saveProject() function
    - Implement loadProjects() function
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 4.2 Implement project deletion with cascade
    - Add confirmation dialog
    - Cascade delete tasks and questions
    - _Requirements: 3.4_
  - [ ]* 4.3 Write property test for project cascade delete
    - **Property 5: Cascade Delete - Project Level**
    - **Validates: Requirements 3.4**

- [ ] 5. Implement task management
  - [ ] 5.1 Create task modal and CRUD functions
    - Create task add/edit modal with project selector
    - Implement saveTask() function
    - Implement loadTasks() function
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 5.2 Implement task deletion with cascade
    - Add confirmation dialog
    - Cascade delete questions
    - _Requirements: 4.4_
  - [ ]* 5.3 Write property test for task cascade delete
    - **Property 6: Cascade Delete - Task Level**
    - **Validates: Requirements 4.4**

- [ ] 6. Update question filtering by hierarchy
  - [ ] 6.1 Implement filter by course
    - Filter questions where task.project.course matches selected course
    - Update loadQuestions() to handle course filter
    - _Requirements: 2.5_
  - [ ] 6.2 Implement filter by project
    - Filter questions where task.project matches selected project
    - _Requirements: 3.5_
  - [ ] 6.3 Implement filter by task
    - Filter questions where task matches selected task
    - _Requirements: 4.5, 6.4_
  - [ ]* 6.4 Write property test for filtering
    - **Property 7, 8, 9, 10: Filter Correctness**
    - **Validates: Requirements 2.5, 3.5, 4.5, 6.5**

- [ ] 7. Update question import and add functionality
  - [ ] 7.1 Update import modal with task selector
    - Replace category selector with cascading course → project → task selector
    - Update CSV import to use task_id
    - _Requirements: 5.1, 5.2_
  - [ ] 7.2 Update single question add/edit modal
    - Add cascading selector for task selection
    - Update save function to use task_id
    - _Requirements: 5.3, 5.4_
  - [ ]* 7.3 Write property test for import association
    - **Property 12: Import Task Association**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 8. Implement question count updates
  - [ ] 8.1 Create count update functions
    - Function to update task question_count
    - Function to update project question_count (aggregate from tasks)
    - Function to update course question_count (aggregate from projects)
    - _Requirements: 7.4_
  - [ ] 8.2 Integrate count updates into CRUD operations
    - Call count updates after question add/delete
    - Call count updates after task/project/course delete
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ]* 8.3 Write property test for count accuracy
    - **Property 11: Question Count Accuracy**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Final integration and cleanup
  - [ ] 10.1 Update presentation.html question bank integration
    - Ensure question loading works with new task_id structure
    - Update any references to category_id
    - _Requirements: 1.5_
  - [ ] 10.2 Remove deprecated category-related code
    - Remove old category modal and functions
    - Clean up unused CSS and HTML
    - _Requirements: All_

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
