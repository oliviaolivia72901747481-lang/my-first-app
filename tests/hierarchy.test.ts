/**
 * Property-Based Tests for Question Hierarchy Data Structure
 * 
 * **Feature: question-hierarchy, Property 1: Hierarchy Integrity**
 * **Validates: Requirements 1.2, 1.3, 1.4**
 * 
 * Tests the three-level hierarchy structure: Course → Project → Task → Question
 * Ensures foreign key constraints are maintained at all levels.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============ Data Types ============

interface Course {
  course_id: string;
  name: string;
  code?: string;
  teacher?: string;
  semester?: string;
  description?: string;
  color?: string;
  project_count: number;
  question_count: number;
}

interface Project {
  project_id: string;
  course_id: string;  // Foreign key to Course
  name: string;
  description?: string;
  color?: string;
  task_count: number;
  question_count: number;
}

interface Task {
  task_id: string;
  project_id: string;  // Foreign key to Project
  name: string;
  description?: string;
  color?: string;
  question_count: number;
}

interface Question {
  id: number;
  task_id: string;  // Foreign key to Task
  title: string;
  question_type: 'single' | 'multiple' | 'truefalse' | 'fillblank';
  answer: string;
}

interface HierarchyData {
  courses: Course[];
  projects: Project[];
  tasks: Task[];
  questions: Question[];
}

// ============ Hierarchy Validation Functions ============

/**
 * Validates that all projects have valid course_id references
 * Requirement 1.2: Projects must be associated with exactly one course
 */
function validateProjectCourseReferences(data: HierarchyData): { valid: boolean; errors: string[] } {
  const courseIds = new Set(data.courses.map(c => c.course_id));
  const errors: string[] = [];
  
  for (const project of data.projects) {
    if (!project.course_id) {
      errors.push(`Project "${project.name}" (${project.project_id}) has no course_id`);
    } else if (!courseIds.has(project.course_id)) {
      errors.push(`Project "${project.name}" (${project.project_id}) references non-existent course_id: ${project.course_id}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates that all tasks have valid project_id references
 * Requirement 1.3: Tasks must be associated with exactly one project
 */
function validateTaskProjectReferences(data: HierarchyData): { valid: boolean; errors: string[] } {
  const projectIds = new Set(data.projects.map(p => p.project_id));
  const errors: string[] = [];
  
  for (const task of data.tasks) {
    if (!task.project_id) {
      errors.push(`Task "${task.name}" (${task.task_id}) has no project_id`);
    } else if (!projectIds.has(task.project_id)) {
      errors.push(`Task "${task.name}" (${task.task_id}) references non-existent project_id: ${task.project_id}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates that all questions have valid task_id references
 * Requirement 1.4: Questions must be associated with exactly one task
 */
function validateQuestionTaskReferences(data: HierarchyData): { valid: boolean; errors: string[] } {
  const taskIds = new Set(data.tasks.map(t => t.task_id));
  const errors: string[] = [];
  
  for (const question of data.questions) {
    if (!question.task_id) {
      errors.push(`Question "${question.title}" (${question.id}) has no task_id`);
    } else if (!taskIds.has(question.task_id)) {
      errors.push(`Question "${question.title}" (${question.id}) references non-existent task_id: ${question.task_id}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates the complete hierarchy integrity
 */
function validateHierarchyIntegrity(data: HierarchyData): { valid: boolean; errors: string[] } {
  const allErrors: string[] = [];
  
  const projectValidation = validateProjectCourseReferences(data);
  const taskValidation = validateTaskProjectReferences(data);
  const questionValidation = validateQuestionTaskReferences(data);
  
  allErrors.push(...projectValidation.errors);
  allErrors.push(...taskValidation.errors);
  allErrors.push(...questionValidation.errors);
  
  return { valid: allErrors.length === 0, errors: allErrors };
}

// ============ Generators ============

const uuidArbitrary = fc.uuid();

// Generate a hex color string like #3b82f6
const colorArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);

const courseArbitrary = fc.record({
  course_id: uuidArbitrary,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  code: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  teacher: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  semester: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  color: fc.option(colorArbitrary, { nil: undefined }),
  project_count: fc.nat({ max: 100 }),
  question_count: fc.nat({ max: 1000 }),
});

/**
 * Generate a project that references a valid course from the given list
 */
function projectArbitrary(courseIds: string[]) {
  if (courseIds.length === 0) {
    // If no courses, generate with a random course_id (will be invalid)
    return fc.record({
      project_id: uuidArbitrary,
      course_id: uuidArbitrary,
      name: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
      color: fc.option(colorArbitrary, { nil: undefined }),
      task_count: fc.nat({ max: 50 }),
      question_count: fc.nat({ max: 500 }),
    });
  }
  
  return fc.record({
    project_id: uuidArbitrary,
    course_id: fc.constantFrom(...courseIds),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    color: fc.option(colorArbitrary, { nil: undefined }),
    task_count: fc.nat({ max: 50 }),
    question_count: fc.nat({ max: 500 }),
  });
}

/**
 * Generate a task that references a valid project from the given list
 */
function taskArbitrary(projectIds: string[]) {
  if (projectIds.length === 0) {
    return fc.record({
      task_id: uuidArbitrary,
      project_id: uuidArbitrary,
      name: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
      color: fc.option(colorArbitrary, { nil: undefined }),
      question_count: fc.nat({ max: 200 }),
    });
  }
  
  return fc.record({
    task_id: uuidArbitrary,
    project_id: fc.constantFrom(...projectIds),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    color: fc.option(colorArbitrary, { nil: undefined }),
    question_count: fc.nat({ max: 200 }),
  });
}

/**
 * Generate a question that references a valid task from the given list
 */
function questionArbitrary(taskIds: string[], idStart: number) {
  if (taskIds.length === 0) {
    return fc.record({
      id: fc.constant(idStart),
      task_id: uuidArbitrary,
      title: fc.string({ minLength: 1, maxLength: 500 }),
      question_type: fc.constantFrom('single', 'multiple', 'truefalse', 'fillblank') as fc.Arbitrary<'single' | 'multiple' | 'truefalse' | 'fillblank'>,
      answer: fc.string({ minLength: 1, maxLength: 50 }),
    });
  }
  
  return fc.record({
    id: fc.constant(idStart),
    task_id: fc.constantFrom(...taskIds),
    title: fc.string({ minLength: 1, maxLength: 500 }),
    question_type: fc.constantFrom('single', 'multiple', 'truefalse', 'fillblank') as fc.Arbitrary<'single' | 'multiple' | 'truefalse' | 'fillblank'>,
    answer: fc.string({ minLength: 1, maxLength: 50 }),
  });
}

/**
 * Generate a valid hierarchy where all foreign keys are valid
 * Key constraint: tasks only exist if projects exist, questions only exist if tasks exist
 */
const validHierarchyArbitrary: fc.Arbitrary<HierarchyData> = fc
  .array(courseArbitrary, { minLength: 1, maxLength: 5 })
  .chain(courses => {
    const courseIds = courses.map(c => c.course_id);
    return fc.array(projectArbitrary(courseIds), { minLength: 0, maxLength: 10 }).map(projects => ({
      courses,
      projects,
    }));
  })
  .chain(({ courses, projects }) => {
    const projectIds = projects.map(p => p.project_id);
    // Only generate tasks if there are projects to reference
    if (projectIds.length === 0) {
      return fc.constant({ courses, projects, tasks: [] as Task[] });
    }
    return fc.array(taskArbitrary(projectIds), { minLength: 0, maxLength: 20 }).map(tasks => ({
      courses,
      projects,
      tasks,
    }));
  })
  .chain(({ courses, projects, tasks }) => {
    const taskIds = tasks.map(t => t.task_id);
    // Only generate questions if there are tasks to reference
    if (taskIds.length === 0) {
      return fc.constant({ courses, projects, tasks, questions: [] as Question[] });
    }
    return fc.array(fc.nat({ max: 50 }), { minLength: 0, maxLength: 30 }).chain(questionCounts => {
      const questionArbitraries = questionCounts.map((_, idx) => questionArbitrary(taskIds, idx + 1));
      if (questionArbitraries.length === 0) {
        return fc.constant({ courses, projects, tasks, questions: [] as Question[] });
      }
      return fc.tuple(...questionArbitraries).map(questions => ({
        courses,
        projects,
        tasks,
        questions,
      }));
    });
  });

/**
 * Generate an invalid hierarchy with broken foreign key references
 */
const invalidHierarchyArbitrary: fc.Arbitrary<HierarchyData> = fc.oneof(
  // Case 1: Project with invalid course_id
  fc.tuple(
    fc.array(courseArbitrary, { minLength: 1, maxLength: 3 }),
    fc.record({
      project_id: uuidArbitrary,
      course_id: uuidArbitrary, // Random UUID, likely not in courses
      name: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
      color: fc.option(colorArbitrary, { nil: undefined }),
      task_count: fc.nat({ max: 50 }),
      question_count: fc.nat({ max: 500 }),
    })
  ).map(([courses, invalidProject]) => ({
    courses,
    projects: [invalidProject],
    tasks: [],
    questions: [],
  })),
  
  // Case 2: Task with invalid project_id
  fc.tuple(
    fc.array(courseArbitrary, { minLength: 1, maxLength: 3 }),
    fc.record({
      task_id: uuidArbitrary,
      project_id: uuidArbitrary, // Random UUID, no projects exist
      name: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
      color: fc.option(colorArbitrary, { nil: undefined }),
      question_count: fc.nat({ max: 200 }),
    })
  ).map(([courses, invalidTask]) => ({
    courses,
    projects: [],
    tasks: [invalidTask],
    questions: [],
  })),
  
  // Case 3: Question with invalid task_id
  fc.tuple(
    fc.array(courseArbitrary, { minLength: 1, maxLength: 3 }),
    fc.record({
      id: fc.nat({ max: 1000 }),
      task_id: uuidArbitrary, // Random UUID, no tasks exist
      title: fc.string({ minLength: 1, maxLength: 500 }),
      question_type: fc.constantFrom('single', 'multiple', 'truefalse', 'fillblank') as fc.Arbitrary<'single' | 'multiple' | 'truefalse' | 'fillblank'>,
      answer: fc.string({ minLength: 1, maxLength: 50 }),
    })
  ).map(([courses, invalidQuestion]) => ({
    courses,
    projects: [],
    tasks: [],
    questions: [invalidQuestion],
  }))
);

// ============ Property Tests ============

describe('Hierarchy Integrity Property Tests', () => {
  /**
   * **Feature: question-hierarchy, Property 1: Hierarchy Integrity**
   * **Validates: Requirements 1.2, 1.3, 1.4**
   * 
   * For any project created, the project must have a valid course_id referencing an existing course;
   * For any task created, the task must have a valid project_id referencing an existing project;
   * For any question created, the question must have a valid task_id referencing an existing task.
   */
  describe('Property 1: Hierarchy Integrity - Foreign Key Constraints', () => {
    it('should validate that all projects reference existing courses (Requirement 1.2)', () => {
      fc.assert(
        fc.property(validHierarchyArbitrary, (data) => {
          const result = validateProjectCourseReferences(data);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate that all tasks reference existing projects (Requirement 1.3)', () => {
      fc.assert(
        fc.property(validHierarchyArbitrary, (data) => {
          const result = validateTaskProjectReferences(data);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate that all questions reference existing tasks (Requirement 1.4)', () => {
      fc.assert(
        fc.property(validHierarchyArbitrary, (data) => {
          const result = validateQuestionTaskReferences(data);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate complete hierarchy integrity for valid data', () => {
      fc.assert(
        fc.property(validHierarchyArbitrary, (data) => {
          const result = validateHierarchyIntegrity(data);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should detect invalid foreign key references', () => {
      fc.assert(
        fc.property(invalidHierarchyArbitrary, (data) => {
          const result = validateHierarchyIntegrity(data);
          // Invalid hierarchy should have at least one error
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ============ Cascade Delete Functions ============

/**
 * Simulates cascade delete of a course and returns the resulting hierarchy
 * When a course is deleted:
 * - All projects belonging to that course are deleted
 * - All tasks belonging to those projects are deleted
 * - All questions belonging to those tasks are deleted
 */
function cascadeDeleteCourse(data: HierarchyData, courseIdToDelete: string): HierarchyData {
  // Find all projects belonging to the course
  const projectIdsToDelete = new Set(
    data.projects
      .filter(p => p.course_id === courseIdToDelete)
      .map(p => p.project_id)
  );
  
  // Find all tasks belonging to those projects
  const taskIdsToDelete = new Set(
    data.tasks
      .filter(t => projectIdsToDelete.has(t.project_id))
      .map(t => t.task_id)
  );
  
  return {
    courses: data.courses.filter(c => c.course_id !== courseIdToDelete),
    projects: data.projects.filter(p => p.course_id !== courseIdToDelete),
    tasks: data.tasks.filter(t => !projectIdsToDelete.has(t.project_id)),
    questions: data.questions.filter(q => !taskIdsToDelete.has(q.task_id)),
  };
}

/**
 * Validates that cascade delete properly removed all associated entities
 */
function validateCascadeDeleteCourse(
  originalData: HierarchyData,
  resultData: HierarchyData,
  deletedCourseId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 1. The deleted course should not exist
  const courseStillExists = resultData.courses.some(c => c.course_id === deletedCourseId);
  if (courseStillExists) {
    errors.push(`Course ${deletedCourseId} still exists after deletion`);
  }
  
  // 2. No projects should reference the deleted course
  const orphanedProjects = resultData.projects.filter(p => p.course_id === deletedCourseId);
  if (orphanedProjects.length > 0) {
    errors.push(`${orphanedProjects.length} projects still reference deleted course ${deletedCourseId}`);
  }
  
  // 3. Find project IDs that belonged to the deleted course
  const deletedProjectIds = new Set(
    originalData.projects
      .filter(p => p.course_id === deletedCourseId)
      .map(p => p.project_id)
  );
  
  // 4. No tasks should reference any of the deleted projects
  const orphanedTasks = resultData.tasks.filter(t => deletedProjectIds.has(t.project_id));
  if (orphanedTasks.length > 0) {
    errors.push(`${orphanedTasks.length} tasks still reference deleted projects`);
  }
  
  // 5. Find task IDs that belonged to the deleted projects
  const deletedTaskIds = new Set(
    originalData.tasks
      .filter(t => deletedProjectIds.has(t.project_id))
      .map(t => t.task_id)
  );
  
  // 6. No questions should reference any of the deleted tasks
  const orphanedQuestions = resultData.questions.filter(q => deletedTaskIds.has(q.task_id));
  if (orphanedQuestions.length > 0) {
    errors.push(`${orphanedQuestions.length} questions still reference deleted tasks`);
  }
  
  // 7. Verify the result hierarchy is still valid (no broken references)
  const integrityCheck = validateHierarchyIntegrity(resultData);
  if (!integrityCheck.valid) {
    errors.push(...integrityCheck.errors.map(e => `Post-delete integrity error: ${e}`));
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Generator for hierarchy with at least one course that has projects, tasks, and questions
 * This ensures we have meaningful data to test cascade delete
 */
const hierarchyWithFullDepthArbitrary: fc.Arbitrary<HierarchyData> = fc
  .array(courseArbitrary, { minLength: 1, maxLength: 5 })
  .chain(courses => {
    const courseIds = courses.map(c => c.course_id);
    // Ensure at least one project per course for meaningful cascade test
    return fc.array(projectArbitrary(courseIds), { minLength: 1, maxLength: 10 }).map(projects => ({
      courses,
      projects,
    }));
  })
  .chain(({ courses, projects }) => {
    const projectIds = projects.map(p => p.project_id);
    // Ensure at least one task
    return fc.array(taskArbitrary(projectIds), { minLength: 1, maxLength: 20 }).map(tasks => ({
      courses,
      projects,
      tasks,
    }));
  })
  .chain(({ courses, projects, tasks }) => {
    const taskIds = tasks.map(t => t.task_id);
    // Generate questions
    return fc.array(fc.nat({ max: 50 }), { minLength: 1, maxLength: 30 }).chain(questionCounts => {
      const questionArbitraries = questionCounts.map((_, idx) => questionArbitrary(taskIds, idx + 1));
      return fc.tuple(...questionArbitraries).map(questions => ({
        courses,
        projects,
        tasks,
        questions,
      }));
    });
  });

// ============ Cascade Delete Property Tests ============

describe('Cascade Delete Property Tests', () => {
  /**
   * **Feature: question-hierarchy, Property 4: Cascade Delete - Course Level**
   * **Validates: Requirements 2.4**
   * 
   * For any course deletion, all projects belonging to that course,
   * all tasks belonging to those projects, and all questions belonging
   * to those tasks must be deleted.
   */
  describe('Property 4: Cascade Delete - Course Level', () => {
    it('should delete all associated projects, tasks, and questions when a course is deleted', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Pick a random course to delete
          const courseToDelete = data.courses[0];
          
          // Perform cascade delete
          const resultData = cascadeDeleteCourse(data, courseToDelete.course_id);
          
          // Validate the cascade delete was correct
          const validation = validateCascadeDeleteCourse(data, resultData, courseToDelete.course_id);
          
          expect(validation.valid).toBe(true);
          if (!validation.valid) {
            console.error('Cascade delete validation errors:', validation.errors);
          }
          expect(validation.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve unrelated courses, projects, tasks, and questions', () => {
      fc.assert(
        fc.property(
          hierarchyWithFullDepthArbitrary.filter(data => data.courses.length >= 2),
          (data) => {
            // Pick the first course to delete
            const courseToDelete = data.courses[0];
            const courseToKeep = data.courses[1];
            
            // Perform cascade delete
            const resultData = cascadeDeleteCourse(data, courseToDelete.course_id);
            
            // The kept course should still exist
            const keptCourseExists = resultData.courses.some(c => c.course_id === courseToKeep.course_id);
            expect(keptCourseExists).toBe(true);
            
            // Projects belonging to the kept course should still exist
            const originalKeptProjects = data.projects.filter(p => p.course_id === courseToKeep.course_id);
            const resultKeptProjects = resultData.projects.filter(p => p.course_id === courseToKeep.course_id);
            expect(resultKeptProjects.length).toBe(originalKeptProjects.length);
            
            // Tasks belonging to kept projects should still exist
            const keptProjectIds = new Set(originalKeptProjects.map(p => p.project_id));
            const originalKeptTasks = data.tasks.filter(t => keptProjectIds.has(t.project_id));
            const resultKeptTasks = resultData.tasks.filter(t => keptProjectIds.has(t.project_id));
            expect(resultKeptTasks.length).toBe(originalKeptTasks.length);
            
            // Questions belonging to kept tasks should still exist
            const keptTaskIds = new Set(originalKeptTasks.map(t => t.task_id));
            const originalKeptQuestions = data.questions.filter(q => keptTaskIds.has(q.task_id));
            const resultKeptQuestions = resultData.questions.filter(q => keptTaskIds.has(q.task_id));
            expect(resultKeptQuestions.length).toBe(originalKeptQuestions.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should result in valid hierarchy after cascade delete', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Delete each course one by one and verify hierarchy remains valid
          for (const course of data.courses) {
            const resultData = cascadeDeleteCourse(data, course.course_id);
            const integrityCheck = validateHierarchyIntegrity(resultData);
            
            expect(integrityCheck.valid).toBe(true);
            expect(integrityCheck.errors).toHaveLength(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle deleting a course with no associated projects', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            courseArbitrary,
            hierarchyWithFullDepthArbitrary
          ),
          ([isolatedCourse, existingData]) => {
            // Add an isolated course with no projects
            const dataWithIsolatedCourse: HierarchyData = {
              courses: [...existingData.courses, isolatedCourse],
              projects: existingData.projects,
              tasks: existingData.tasks,
              questions: existingData.questions,
            };
            
            // Delete the isolated course
            const resultData = cascadeDeleteCourse(dataWithIsolatedCourse, isolatedCourse.course_id);
            
            // The isolated course should be deleted
            expect(resultData.courses.some(c => c.course_id === isolatedCourse.course_id)).toBe(false);
            
            // All other data should remain unchanged
            expect(resultData.courses.length).toBe(existingData.courses.length);
            expect(resultData.projects.length).toBe(existingData.projects.length);
            expect(resultData.tasks.length).toBe(existingData.tasks.length);
            expect(resultData.questions.length).toBe(existingData.questions.length);
            
            // Hierarchy should still be valid
            const integrityCheck = validateHierarchyIntegrity(resultData);
            expect(integrityCheck.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============ Project Cascade Delete Functions ============

/**
 * Simulates cascade delete of a project and returns the resulting hierarchy
 * When a project is deleted:
 * - All tasks belonging to that project are deleted
 * - All questions belonging to those tasks are deleted
 * - The parent course remains intact
 */
function cascadeDeleteProject(data: HierarchyData, projectIdToDelete: string): HierarchyData {
  // Find all tasks belonging to the project
  const taskIdsToDelete = new Set(
    data.tasks
      .filter(t => t.project_id === projectIdToDelete)
      .map(t => t.task_id)
  );
  
  return {
    courses: data.courses, // Courses remain unchanged
    projects: data.projects.filter(p => p.project_id !== projectIdToDelete),
    tasks: data.tasks.filter(t => t.project_id !== projectIdToDelete),
    questions: data.questions.filter(q => !taskIdsToDelete.has(q.task_id)),
  };
}

/**
 * Validates that cascade delete of a project properly removed all associated entities
 */
function validateCascadeDeleteProject(
  originalData: HierarchyData,
  resultData: HierarchyData,
  deletedProjectId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 1. The deleted project should not exist
  const projectStillExists = resultData.projects.some(p => p.project_id === deletedProjectId);
  if (projectStillExists) {
    errors.push(`Project ${deletedProjectId} still exists after deletion`);
  }
  
  // 2. No tasks should reference the deleted project
  const orphanedTasks = resultData.tasks.filter(t => t.project_id === deletedProjectId);
  if (orphanedTasks.length > 0) {
    errors.push(`${orphanedTasks.length} tasks still reference deleted project ${deletedProjectId}`);
  }
  
  // 3. Find task IDs that belonged to the deleted project
  const deletedTaskIds = new Set(
    originalData.tasks
      .filter(t => t.project_id === deletedProjectId)
      .map(t => t.task_id)
  );
  
  // 4. No questions should reference any of the deleted tasks
  const orphanedQuestions = resultData.questions.filter(q => deletedTaskIds.has(q.task_id));
  if (orphanedQuestions.length > 0) {
    errors.push(`${orphanedQuestions.length} questions still reference deleted tasks`);
  }
  
  // 5. The parent course should still exist
  const deletedProject = originalData.projects.find(p => p.project_id === deletedProjectId);
  if (deletedProject) {
    const parentCourseExists = resultData.courses.some(c => c.course_id === deletedProject.course_id);
    if (!parentCourseExists) {
      errors.push(`Parent course ${deletedProject.course_id} was incorrectly deleted`);
    }
  }
  
  // 6. Verify the result hierarchy is still valid (no broken references)
  const integrityCheck = validateHierarchyIntegrity(resultData);
  if (!integrityCheck.valid) {
    errors.push(...integrityCheck.errors.map(e => `Post-delete integrity error: ${e}`));
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Generator for hierarchy with at least one project that has tasks and questions
 * This ensures we have meaningful data to test project cascade delete
 */
const hierarchyWithProjectDepthArbitrary: fc.Arbitrary<HierarchyData> = fc
  .array(courseArbitrary, { minLength: 1, maxLength: 5 })
  .chain(courses => {
    const courseIds = courses.map(c => c.course_id);
    // Ensure at least one project
    return fc.array(projectArbitrary(courseIds), { minLength: 1, maxLength: 10 }).map(projects => ({
      courses,
      projects,
    }));
  })
  .chain(({ courses, projects }) => {
    const projectIds = projects.map(p => p.project_id);
    // Ensure at least one task per project for meaningful cascade test
    return fc.array(taskArbitrary(projectIds), { minLength: 1, maxLength: 20 }).map(tasks => ({
      courses,
      projects,
      tasks,
    }));
  })
  .chain(({ courses, projects, tasks }) => {
    const taskIds = tasks.map(t => t.task_id);
    // Generate questions
    return fc.array(fc.nat({ max: 50 }), { minLength: 1, maxLength: 30 }).chain(questionCounts => {
      const questionArbitraries = questionCounts.map((_, idx) => questionArbitrary(taskIds, idx + 1));
      return fc.tuple(...questionArbitraries).map(questions => ({
        courses,
        projects,
        tasks,
        questions,
      }));
    });
  });

// ============ Project Cascade Delete Property Tests ============

describe('Project Cascade Delete Property Tests', () => {
  /**
   * **Feature: question-hierarchy, Property 5: Cascade Delete - Project Level**
   * **Validates: Requirements 3.4**
   * 
   * For any project deletion, all tasks belonging to that project
   * and all questions belonging to those tasks must be deleted.
   */
  describe('Property 5: Cascade Delete - Project Level', () => {
    it('should delete all associated tasks and questions when a project is deleted', () => {
      fc.assert(
        fc.property(hierarchyWithProjectDepthArbitrary, (data) => {
          // Pick the first project to delete
          const projectToDelete = data.projects[0];
          
          // Perform cascade delete
          const resultData = cascadeDeleteProject(data, projectToDelete.project_id);
          
          // Validate the cascade delete was correct
          const validation = validateCascadeDeleteProject(data, resultData, projectToDelete.project_id);
          
          expect(validation.valid).toBe(true);
          if (!validation.valid) {
            console.error('Project cascade delete validation errors:', validation.errors);
          }
          expect(validation.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve parent course when project is deleted', () => {
      fc.assert(
        fc.property(hierarchyWithProjectDepthArbitrary, (data) => {
          // Pick a project to delete
          const projectToDelete = data.projects[0];
          const parentCourseId = projectToDelete.course_id;
          
          // Perform cascade delete
          const resultData = cascadeDeleteProject(data, projectToDelete.project_id);
          
          // The parent course should still exist
          const parentCourseExists = resultData.courses.some(c => c.course_id === parentCourseId);
          expect(parentCourseExists).toBe(true);
          
          // All courses should remain unchanged
          expect(resultData.courses.length).toBe(data.courses.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve unrelated projects, tasks, and questions', () => {
      fc.assert(
        fc.property(
          hierarchyWithProjectDepthArbitrary.filter(data => data.projects.length >= 2),
          (data) => {
            // Pick the first project to delete
            const projectToDelete = data.projects[0];
            const projectToKeep = data.projects[1];
            
            // Perform cascade delete
            const resultData = cascadeDeleteProject(data, projectToDelete.project_id);
            
            // The kept project should still exist
            const keptProjectExists = resultData.projects.some(p => p.project_id === projectToKeep.project_id);
            expect(keptProjectExists).toBe(true);
            
            // Tasks belonging to the kept project should still exist
            const originalKeptTasks = data.tasks.filter(t => t.project_id === projectToKeep.project_id);
            const resultKeptTasks = resultData.tasks.filter(t => t.project_id === projectToKeep.project_id);
            expect(resultKeptTasks.length).toBe(originalKeptTasks.length);
            
            // Questions belonging to kept tasks should still exist
            const keptTaskIds = new Set(originalKeptTasks.map(t => t.task_id));
            const originalKeptQuestions = data.questions.filter(q => keptTaskIds.has(q.task_id));
            const resultKeptQuestions = resultData.questions.filter(q => keptTaskIds.has(q.task_id));
            expect(resultKeptQuestions.length).toBe(originalKeptQuestions.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should result in valid hierarchy after project cascade delete', () => {
      fc.assert(
        fc.property(hierarchyWithProjectDepthArbitrary, (data) => {
          // Delete each project one by one and verify hierarchy remains valid
          for (const project of data.projects) {
            const resultData = cascadeDeleteProject(data, project.project_id);
            const integrityCheck = validateHierarchyIntegrity(resultData);
            
            expect(integrityCheck.valid).toBe(true);
            expect(integrityCheck.errors).toHaveLength(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle deleting a project with no associated tasks', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            courseArbitrary,
            hierarchyWithProjectDepthArbitrary
          ),
          ([isolatedCourse, existingData]) => {
            // Create an isolated project with no tasks
            const isolatedProject: Project = {
              project_id: crypto.randomUUID(),
              course_id: isolatedCourse.course_id,
              name: 'Isolated Project',
              task_count: 0,
              question_count: 0,
            };
            
            // Add the isolated course and project
            const dataWithIsolatedProject: HierarchyData = {
              courses: [...existingData.courses, isolatedCourse],
              projects: [...existingData.projects, isolatedProject],
              tasks: existingData.tasks,
              questions: existingData.questions,
            };
            
            // Delete the isolated project
            const resultData = cascadeDeleteProject(dataWithIsolatedProject, isolatedProject.project_id);
            
            // The isolated project should be deleted
            expect(resultData.projects.some(p => p.project_id === isolatedProject.project_id)).toBe(false);
            
            // The parent course should still exist
            expect(resultData.courses.some(c => c.course_id === isolatedCourse.course_id)).toBe(true);
            
            // All other data should remain unchanged
            expect(resultData.projects.length).toBe(existingData.projects.length);
            expect(resultData.tasks.length).toBe(existingData.tasks.length);
            expect(resultData.questions.length).toBe(existingData.questions.length);
            
            // Hierarchy should still be valid
            const integrityCheck = validateHierarchyIntegrity(resultData);
            expect(integrityCheck.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============ Task Cascade Delete Functions ============

/**
 * Simulates cascade delete of a task and returns the resulting hierarchy
 * When a task is deleted:
 * - All questions belonging to that task are deleted
 * - The parent project and course remain intact
 */
function cascadeDeleteTask(data: HierarchyData, taskIdToDelete: string): HierarchyData {
  return {
    courses: data.courses, // Courses remain unchanged
    projects: data.projects, // Projects remain unchanged
    tasks: data.tasks.filter(t => t.task_id !== taskIdToDelete),
    questions: data.questions.filter(q => q.task_id !== taskIdToDelete),
  };
}

/**
 * Validates that cascade delete of a task properly removed all associated entities
 */
function validateCascadeDeleteTask(
  originalData: HierarchyData,
  resultData: HierarchyData,
  deletedTaskId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 1. The deleted task should not exist
  const taskStillExists = resultData.tasks.some(t => t.task_id === deletedTaskId);
  if (taskStillExists) {
    errors.push(`Task ${deletedTaskId} still exists after deletion`);
  }
  
  // 2. No questions should reference the deleted task
  const orphanedQuestions = resultData.questions.filter(q => q.task_id === deletedTaskId);
  if (orphanedQuestions.length > 0) {
    errors.push(`${orphanedQuestions.length} questions still reference deleted task ${deletedTaskId}`);
  }
  
  // 3. The parent project should still exist
  const deletedTask = originalData.tasks.find(t => t.task_id === deletedTaskId);
  if (deletedTask) {
    const parentProjectExists = resultData.projects.some(p => p.project_id === deletedTask.project_id);
    if (!parentProjectExists) {
      errors.push(`Parent project ${deletedTask.project_id} was incorrectly deleted`);
    }
    
    // 4. The grandparent course should still exist
    const parentProject = originalData.projects.find(p => p.project_id === deletedTask.project_id);
    if (parentProject) {
      const grandparentCourseExists = resultData.courses.some(c => c.course_id === parentProject.course_id);
      if (!grandparentCourseExists) {
        errors.push(`Grandparent course ${parentProject.course_id} was incorrectly deleted`);
      }
    }
  }
  
  // 5. Verify the result hierarchy is still valid (no broken references)
  const integrityCheck = validateHierarchyIntegrity(resultData);
  if (!integrityCheck.valid) {
    errors.push(...integrityCheck.errors.map(e => `Post-delete integrity error: ${e}`));
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Generator for hierarchy with at least one task that has questions
 * This ensures we have meaningful data to test task cascade delete
 */
const hierarchyWithTaskDepthArbitrary: fc.Arbitrary<HierarchyData> = fc
  .array(courseArbitrary, { minLength: 1, maxLength: 5 })
  .chain(courses => {
    const courseIds = courses.map(c => c.course_id);
    return fc.array(projectArbitrary(courseIds), { minLength: 1, maxLength: 10 }).map(projects => ({
      courses,
      projects,
    }));
  })
  .chain(({ courses, projects }) => {
    const projectIds = projects.map(p => p.project_id);
    // Ensure at least one task
    return fc.array(taskArbitrary(projectIds), { minLength: 1, maxLength: 20 }).map(tasks => ({
      courses,
      projects,
      tasks,
    }));
  })
  .chain(({ courses, projects, tasks }) => {
    const taskIds = tasks.map(t => t.task_id);
    // Generate at least one question to test cascade delete
    return fc.array(fc.nat({ max: 50 }), { minLength: 1, maxLength: 30 }).chain(questionCounts => {
      const questionArbitraries = questionCounts.map((_, idx) => questionArbitrary(taskIds, idx + 1));
      return fc.tuple(...questionArbitraries).map(questions => ({
        courses,
        projects,
        tasks,
        questions,
      }));
    });
  });

// ============ Task Cascade Delete Property Tests ============

describe('Task Cascade Delete Property Tests', () => {
  /**
   * **Feature: question-hierarchy, Property 6: Cascade Delete - Task Level**
   * **Validates: Requirements 4.4**
   * 
   * For any task deletion, all questions belonging to that task must be deleted.
   */
  describe('Property 6: Cascade Delete - Task Level', () => {
    it('should delete all associated questions when a task is deleted', () => {
      fc.assert(
        fc.property(hierarchyWithTaskDepthArbitrary, (data) => {
          // Pick the first task to delete
          const taskToDelete = data.tasks[0];
          
          // Perform cascade delete
          const resultData = cascadeDeleteTask(data, taskToDelete.task_id);
          
          // Validate the cascade delete was correct
          const validation = validateCascadeDeleteTask(data, resultData, taskToDelete.task_id);
          
          expect(validation.valid).toBe(true);
          if (!validation.valid) {
            console.error('Task cascade delete validation errors:', validation.errors);
          }
          expect(validation.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve parent project and course when task is deleted', () => {
      fc.assert(
        fc.property(hierarchyWithTaskDepthArbitrary, (data) => {
          // Pick a task to delete
          const taskToDelete = data.tasks[0];
          const parentProjectId = taskToDelete.project_id;
          const parentProject = data.projects.find(p => p.project_id === parentProjectId);
          const grandparentCourseId = parentProject?.course_id;
          
          // Perform cascade delete
          const resultData = cascadeDeleteTask(data, taskToDelete.task_id);
          
          // The parent project should still exist
          const parentProjectExists = resultData.projects.some(p => p.project_id === parentProjectId);
          expect(parentProjectExists).toBe(true);
          
          // The grandparent course should still exist
          if (grandparentCourseId) {
            const grandparentCourseExists = resultData.courses.some(c => c.course_id === grandparentCourseId);
            expect(grandparentCourseExists).toBe(true);
          }
          
          // All courses and projects should remain unchanged
          expect(resultData.courses.length).toBe(data.courses.length);
          expect(resultData.projects.length).toBe(data.projects.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve unrelated tasks and questions', () => {
      fc.assert(
        fc.property(
          hierarchyWithTaskDepthArbitrary.filter(data => data.tasks.length >= 2),
          (data) => {
            // Pick the first task to delete
            const taskToDelete = data.tasks[0];
            const taskToKeep = data.tasks[1];
            
            // Perform cascade delete
            const resultData = cascadeDeleteTask(data, taskToDelete.task_id);
            
            // The kept task should still exist
            const keptTaskExists = resultData.tasks.some(t => t.task_id === taskToKeep.task_id);
            expect(keptTaskExists).toBe(true);
            
            // Questions belonging to the kept task should still exist
            const originalKeptQuestions = data.questions.filter(q => q.task_id === taskToKeep.task_id);
            const resultKeptQuestions = resultData.questions.filter(q => q.task_id === taskToKeep.task_id);
            expect(resultKeptQuestions.length).toBe(originalKeptQuestions.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should result in valid hierarchy after task cascade delete', () => {
      fc.assert(
        fc.property(hierarchyWithTaskDepthArbitrary, (data) => {
          // Delete each task one by one and verify hierarchy remains valid
          for (const task of data.tasks) {
            const resultData = cascadeDeleteTask(data, task.task_id);
            const integrityCheck = validateHierarchyIntegrity(resultData);
            
            expect(integrityCheck.valid).toBe(true);
            expect(integrityCheck.errors).toHaveLength(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle deleting a task with no associated questions', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            courseArbitrary,
            hierarchyWithTaskDepthArbitrary
          ),
          ([isolatedCourse, existingData]) => {
            // Create an isolated project
            const isolatedProject: Project = {
              project_id: crypto.randomUUID(),
              course_id: isolatedCourse.course_id,
              name: 'Isolated Project',
              task_count: 1,
              question_count: 0,
            };
            
            // Create an isolated task with no questions
            const isolatedTask: Task = {
              task_id: crypto.randomUUID(),
              project_id: isolatedProject.project_id,
              name: 'Isolated Task',
              question_count: 0,
            };
            
            // Add the isolated course, project, and task
            const dataWithIsolatedTask: HierarchyData = {
              courses: [...existingData.courses, isolatedCourse],
              projects: [...existingData.projects, isolatedProject],
              tasks: [...existingData.tasks, isolatedTask],
              questions: existingData.questions,
            };
            
            // Delete the isolated task
            const resultData = cascadeDeleteTask(dataWithIsolatedTask, isolatedTask.task_id);
            
            // The isolated task should be deleted
            expect(resultData.tasks.some(t => t.task_id === isolatedTask.task_id)).toBe(false);
            
            // The parent project should still exist
            expect(resultData.projects.some(p => p.project_id === isolatedProject.project_id)).toBe(true);
            
            // The grandparent course should still exist
            expect(resultData.courses.some(c => c.course_id === isolatedCourse.course_id)).toBe(true);
            
            // All other data should remain unchanged
            expect(resultData.tasks.length).toBe(existingData.tasks.length);
            expect(resultData.questions.length).toBe(existingData.questions.length);
            
            // Hierarchy should still be valid
            const integrityCheck = validateHierarchyIntegrity(resultData);
            expect(integrityCheck.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly count deleted questions', () => {
      fc.assert(
        fc.property(hierarchyWithTaskDepthArbitrary, (data) => {
          // Pick a task to delete
          const taskToDelete = data.tasks[0];
          
          // Count questions belonging to this task before deletion
          const questionsToBeDeleted = data.questions.filter(q => q.task_id === taskToDelete.task_id);
          const originalQuestionCount = data.questions.length;
          
          // Perform cascade delete
          const resultData = cascadeDeleteTask(data, taskToDelete.task_id);
          
          // Verify the correct number of questions were deleted
          const expectedRemainingQuestions = originalQuestionCount - questionsToBeDeleted.length;
          expect(resultData.questions.length).toBe(expectedRemainingQuestions);
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ============ Filter Functions ============

/**
 * Filter questions by course
 * Returns questions where the question's task belongs to a project that belongs to the selected course
 * Requirement 2.5: Filter questions to show only questions belonging to that course
 */
function filterQuestionsByCourse(data: HierarchyData, courseId: string): Question[] {
  // Find all projects belonging to the course
  const projectIds = new Set(
    data.projects
      .filter(p => p.course_id === courseId)
      .map(p => p.project_id)
  );
  
  // Find all tasks belonging to those projects
  const taskIds = new Set(
    data.tasks
      .filter(t => projectIds.has(t.project_id))
      .map(t => t.task_id)
  );
  
  // Return questions belonging to those tasks
  return data.questions.filter(q => taskIds.has(q.task_id));
}

/**
 * Filter questions by project
 * Returns questions where the question's task belongs to the selected project
 * Requirement 3.5: Filter questions to show only questions belonging to that project
 */
function filterQuestionsByProject(data: HierarchyData, projectId: string): Question[] {
  // Find all tasks belonging to the project
  const taskIds = new Set(
    data.tasks
      .filter(t => t.project_id === projectId)
      .map(t => t.task_id)
  );
  
  // Return questions belonging to those tasks
  return data.questions.filter(q => taskIds.has(q.task_id));
}

/**
 * Filter questions by task
 * Returns questions with task_id matching the selected task
 * Requirement 4.5, 6.4: Filter questions to show only questions belonging to that task
 */
function filterQuestionsByTask(data: HierarchyData, taskId: string): Question[] {
  return data.questions.filter(q => q.task_id === taskId);
}

/**
 * Get all questions (no filter)
 * Returns all questions in the database
 * Requirement 6.5: Display all questions across all courses
 */
function getAllQuestions(data: HierarchyData): Question[] {
  return data.questions;
}

/**
 * Validates that filtered questions are exactly those expected for a course filter
 */
function validateCourseFilter(
  data: HierarchyData,
  courseId: string,
  filteredQuestions: Question[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Get expected questions
  const expectedQuestions = filterQuestionsByCourse(data, courseId);
  const expectedIds = new Set(expectedQuestions.map(q => q.id));
  const filteredIds = new Set(filteredQuestions.map(q => q.id));
  
  // Check for missing questions (should be in filtered but aren't)
  for (const expected of expectedQuestions) {
    if (!filteredIds.has(expected.id)) {
      errors.push(`Question ${expected.id} should be in filtered results but is missing`);
    }
  }
  
  // Check for extra questions (shouldn't be in filtered but are)
  for (const filtered of filteredQuestions) {
    if (!expectedIds.has(filtered.id)) {
      errors.push(`Question ${filtered.id} should not be in filtered results`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates that filtered questions are exactly those expected for a project filter
 */
function validateProjectFilter(
  data: HierarchyData,
  projectId: string,
  filteredQuestions: Question[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Get expected questions
  const expectedQuestions = filterQuestionsByProject(data, projectId);
  const expectedIds = new Set(expectedQuestions.map(q => q.id));
  const filteredIds = new Set(filteredQuestions.map(q => q.id));
  
  // Check for missing questions
  for (const expected of expectedQuestions) {
    if (!filteredIds.has(expected.id)) {
      errors.push(`Question ${expected.id} should be in filtered results but is missing`);
    }
  }
  
  // Check for extra questions
  for (const filtered of filteredQuestions) {
    if (!expectedIds.has(filtered.id)) {
      errors.push(`Question ${filtered.id} should not be in filtered results`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates that filtered questions are exactly those expected for a task filter
 */
function validateTaskFilter(
  data: HierarchyData,
  taskId: string,
  filteredQuestions: Question[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Get expected questions
  const expectedQuestions = filterQuestionsByTask(data, taskId);
  const expectedIds = new Set(expectedQuestions.map(q => q.id));
  const filteredIds = new Set(filteredQuestions.map(q => q.id));
  
  // Check for missing questions
  for (const expected of expectedQuestions) {
    if (!filteredIds.has(expected.id)) {
      errors.push(`Question ${expected.id} should be in filtered results but is missing`);
    }
  }
  
  // Check for extra questions
  for (const filtered of filteredQuestions) {
    if (!expectedIds.has(filtered.id)) {
      errors.push(`Question ${filtered.id} should not be in filtered results`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// ============ Filter Property Tests ============

describe('Filter Correctness Property Tests', () => {
  /**
   * **Feature: question-hierarchy, Property 7: Filter by Course**
   * **Validates: Requirements 2.5**
   * 
   * For any course selection, the returned questions must be exactly those
   * where the question's task belongs to a project that belongs to the selected course.
   */
  describe('Property 7: Filter by Course', () => {
    it('should return exactly the questions belonging to the selected course', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Test filtering for each course
          for (const course of data.courses) {
            const filteredQuestions = filterQuestionsByCourse(data, course.course_id);
            const validation = validateCourseFilter(data, course.course_id, filteredQuestions);
            
            expect(validation.valid).toBe(true);
            if (!validation.valid) {
              console.error('Course filter validation errors:', validation.errors);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return empty array for non-existent course', () => {
      fc.assert(
        fc.property(
          fc.tuple(hierarchyWithFullDepthArbitrary, uuidArbitrary),
          ([data, nonExistentCourseId]) => {
            // Ensure the UUID doesn't accidentally match an existing course
            const courseExists = data.courses.some(c => c.course_id === nonExistentCourseId);
            if (courseExists) return; // Skip this case
            
            const filteredQuestions = filterQuestionsByCourse(data, nonExistentCourseId);
            expect(filteredQuestions).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all questions from all projects under the course', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          for (const course of data.courses) {
            const filteredQuestions = filterQuestionsByCourse(data, course.course_id);
            
            // Get all projects for this course
            const courseProjectIds = new Set(
              data.projects
                .filter(p => p.course_id === course.course_id)
                .map(p => p.project_id)
            );
            
            // Get all tasks for those projects
            const courseTaskIds = new Set(
              data.tasks
                .filter(t => courseProjectIds.has(t.project_id))
                .map(t => t.task_id)
            );
            
            // Every filtered question should belong to a task in this course
            for (const question of filteredQuestions) {
              expect(courseTaskIds.has(question.task_id)).toBe(true);
            }
            
            // Every question belonging to this course should be in filtered results
            const filteredIds = new Set(filteredQuestions.map(q => q.id));
            for (const question of data.questions) {
              if (courseTaskIds.has(question.task_id)) {
                expect(filteredIds.has(question.id)).toBe(true);
              }
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: question-hierarchy, Property 8: Filter by Project**
   * **Validates: Requirements 3.5**
   * 
   * For any project selection, the returned questions must be exactly those
   * where the question's task belongs to the selected project.
   */
  describe('Property 8: Filter by Project', () => {
    it('should return exactly the questions belonging to the selected project', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Test filtering for each project
          for (const project of data.projects) {
            const filteredQuestions = filterQuestionsByProject(data, project.project_id);
            const validation = validateProjectFilter(data, project.project_id, filteredQuestions);
            
            expect(validation.valid).toBe(true);
            if (!validation.valid) {
              console.error('Project filter validation errors:', validation.errors);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return empty array for non-existent project', () => {
      fc.assert(
        fc.property(
          fc.tuple(hierarchyWithFullDepthArbitrary, uuidArbitrary),
          ([data, nonExistentProjectId]) => {
            // Ensure the UUID doesn't accidentally match an existing project
            const projectExists = data.projects.some(p => p.project_id === nonExistentProjectId);
            if (projectExists) return; // Skip this case
            
            const filteredQuestions = filterQuestionsByProject(data, nonExistentProjectId);
            expect(filteredQuestions).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all questions from all tasks under the project', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          for (const project of data.projects) {
            const filteredQuestions = filterQuestionsByProject(data, project.project_id);
            
            // Get all tasks for this project
            const projectTaskIds = new Set(
              data.tasks
                .filter(t => t.project_id === project.project_id)
                .map(t => t.task_id)
            );
            
            // Every filtered question should belong to a task in this project
            for (const question of filteredQuestions) {
              expect(projectTaskIds.has(question.task_id)).toBe(true);
            }
            
            // Every question belonging to this project should be in filtered results
            const filteredIds = new Set(filteredQuestions.map(q => q.id));
            for (const question of data.questions) {
              if (projectTaskIds.has(question.task_id)) {
                expect(filteredIds.has(question.id)).toBe(true);
              }
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should be a subset of course filter results', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          for (const project of data.projects) {
            const projectQuestions = filterQuestionsByProject(data, project.project_id);
            const courseQuestions = filterQuestionsByCourse(data, project.course_id);
            
            const courseQuestionIds = new Set(courseQuestions.map(q => q.id));
            
            // Every question in project filter should also be in course filter
            for (const question of projectQuestions) {
              expect(courseQuestionIds.has(question.id)).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: question-hierarchy, Property 9: Filter by Task**
   * **Validates: Requirements 4.5, 6.4**
   * 
   * For any task selection, the returned questions must be exactly those
   * with task_id matching the selected task.
   */
  describe('Property 9: Filter by Task', () => {
    it('should return exactly the questions belonging to the selected task', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Test filtering for each task
          for (const task of data.tasks) {
            const filteredQuestions = filterQuestionsByTask(data, task.task_id);
            const validation = validateTaskFilter(data, task.task_id, filteredQuestions);
            
            expect(validation.valid).toBe(true);
            if (!validation.valid) {
              console.error('Task filter validation errors:', validation.errors);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return empty array for non-existent task', () => {
      fc.assert(
        fc.property(
          fc.tuple(hierarchyWithFullDepthArbitrary, uuidArbitrary),
          ([data, nonExistentTaskId]) => {
            // Ensure the UUID doesn't accidentally match an existing task
            const taskExists = data.tasks.some(t => t.task_id === nonExistentTaskId);
            if (taskExists) return; // Skip this case
            
            const filteredQuestions = filterQuestionsByTask(data, nonExistentTaskId);
            expect(filteredQuestions).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return questions with exact task_id match', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          for (const task of data.tasks) {
            const filteredQuestions = filterQuestionsByTask(data, task.task_id);
            
            // Every filtered question should have the exact task_id
            for (const question of filteredQuestions) {
              expect(question.task_id).toBe(task.task_id);
            }
            
            // Every question with this task_id should be in filtered results
            const filteredIds = new Set(filteredQuestions.map(q => q.id));
            for (const question of data.questions) {
              if (question.task_id === task.task_id) {
                expect(filteredIds.has(question.id)).toBe(true);
              }
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should be a subset of project filter results', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          for (const task of data.tasks) {
            const taskQuestions = filterQuestionsByTask(data, task.task_id);
            const projectQuestions = filterQuestionsByProject(data, task.project_id);
            
            const projectQuestionIds = new Set(projectQuestions.map(q => q.id));
            
            // Every question in task filter should also be in project filter
            for (const question of taskQuestions) {
              expect(projectQuestionIds.has(question.id)).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: question-hierarchy, Property 10: All Questions Filter**
   * **Validates: Requirements 6.5**
   * 
   * For any "all questions" selection, the returned questions must equal
   * the total count of all questions in the database.
   */
  describe('Property 10: All Questions Filter', () => {
    it('should return all questions in the database', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          const allQuestions = getAllQuestions(data);
          
          // Should return exactly the same number of questions
          expect(allQuestions.length).toBe(data.questions.length);
          
          // Should contain all questions
          const allIds = new Set(allQuestions.map(q => q.id));
          for (const question of data.questions) {
            expect(allIds.has(question.id)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return empty array for empty database', () => {
      fc.assert(
        fc.property(
          fc.array(courseArbitrary, { minLength: 1, maxLength: 3 }),
          (courses) => {
            const emptyData: HierarchyData = {
              courses,
              projects: [],
              tasks: [],
              questions: [],
            };
            
            const allQuestions = getAllQuestions(emptyData);
            expect(allQuestions).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be the union of all course filters', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          const allQuestions = getAllQuestions(data);
          const allIds = new Set(allQuestions.map(q => q.id));
          
          // Collect all questions from all course filters
          const unionIds = new Set<number>();
          for (const course of data.courses) {
            const courseQuestions = filterQuestionsByCourse(data, course.course_id);
            for (const q of courseQuestions) {
              unionIds.add(q.id);
            }
          }
          
          // The union of all course filters should equal all questions
          // (assuming all questions have valid task references)
          const validQuestionIds = new Set(
            data.questions
              .filter(q => data.tasks.some(t => t.task_id === q.task_id))
              .map(q => q.id)
          );
          
          for (const id of validQuestionIds) {
            expect(unionIds.has(id)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should include questions from all hierarchy levels', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          const allQuestions = getAllQuestions(data);
          
          // Group questions by their task
          const questionsByTask = new Map<string, Question[]>();
          for (const question of allQuestions) {
            const existing = questionsByTask.get(question.task_id) || [];
            existing.push(question);
            questionsByTask.set(question.task_id, existing);
          }
          
          // Verify questions are distributed across tasks
          for (const task of data.tasks) {
            const taskQuestions = questionsByTask.get(task.task_id) || [];
            const expectedCount = data.questions.filter(q => q.task_id === task.task_id).length;
            expect(taskQuestions.length).toBe(expectedCount);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});

// ============ Import Task Association Functions ============

/**
 * Represents a raw question from CSV import (before task_id is assigned)
 */
interface RawImportQuestion {
  title: string;
  question_type: 'single' | 'multiple' | 'truefalse' | 'fillblank';
  answer: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  knowledge_tag?: string;
  difficulty?: number;
}

/**
 * Simulates the import process that assigns task_id to all imported questions
 * This mirrors the confirmImport() function in questionbank.html
 * 
 * @param rawQuestions - Questions parsed from CSV (without task_id)
 * @param targetTaskId - The task_id selected by the user for import
 * @param startRound - The starting round number for imported questions
 * @returns Questions with task_id and round assigned
 */
function importQuestionsToTask(
  rawQuestions: RawImportQuestion[],
  targetTaskId: string,
  startRound: number = 1
): Question[] {
  return rawQuestions.map((q, i) => ({
    id: startRound + i,
    task_id: targetTaskId,
    title: q.title,
    question_type: q.question_type,
    answer: q.answer,
  }));
}

/**
 * Validates that all imported questions have the correct task_id
 * Property 12: For any CSV import operation, all imported questions must have
 * their task_id set to the selected target task.
 */
function validateImportTaskAssociation(
  importedQuestions: Question[],
  targetTaskId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const question of importedQuestions) {
    if (!question.task_id) {
      errors.push(`Question "${question.title}" (id: ${question.id}) has no task_id assigned`);
    } else if (question.task_id !== targetTaskId) {
      errors.push(`Question "${question.title}" (id: ${question.id}) has task_id "${question.task_id}" but should have "${targetTaskId}"`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates that imported questions inherit the correct project and course
 * through the task's hierarchy
 */
function validateImportHierarchyInheritance(
  importedQuestions: Question[],
  targetTaskId: string,
  data: HierarchyData
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Find the target task
  const targetTask = data.tasks.find(t => t.task_id === targetTaskId);
  if (!targetTask) {
    errors.push(`Target task ${targetTaskId} does not exist in hierarchy`);
    return { valid: false, errors };
  }
  
  // Find the parent project
  const parentProject = data.projects.find(p => p.project_id === targetTask.project_id);
  if (!parentProject) {
    errors.push(`Parent project ${targetTask.project_id} does not exist for task ${targetTaskId}`);
    return { valid: false, errors };
  }
  
  // Find the grandparent course
  const grandparentCourse = data.courses.find(c => c.course_id === parentProject.course_id);
  if (!grandparentCourse) {
    errors.push(`Grandparent course ${parentProject.course_id} does not exist for project ${parentProject.project_id}`);
    return { valid: false, errors };
  }
  
  // Verify all imported questions can be traced back through the hierarchy
  for (const question of importedQuestions) {
    if (question.task_id !== targetTaskId) {
      errors.push(`Question "${question.title}" is not associated with target task`);
      continue;
    }
    
    // Verify the question would appear in course filter
    const courseQuestions = filterQuestionsByCourse(
      { ...data, questions: importedQuestions },
      grandparentCourse.course_id
    );
    if (!courseQuestions.some(q => q.id === question.id)) {
      errors.push(`Question "${question.title}" would not appear in course filter for ${grandparentCourse.name}`);
    }
    
    // Verify the question would appear in project filter
    const projectQuestions = filterQuestionsByProject(
      { ...data, questions: importedQuestions },
      parentProject.project_id
    );
    if (!projectQuestions.some(q => q.id === question.id)) {
      errors.push(`Question "${question.title}" would not appear in project filter for ${parentProject.name}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// ============ Import Generators ============

/**
 * Generate a raw question for import (without task_id)
 */
const rawImportQuestionArbitrary: fc.Arbitrary<RawImportQuestion> = fc.oneof(
  // Single choice question
  fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }),
    question_type: fc.constant('single' as const),
    answer: fc.constantFrom('A', 'B', 'C', 'D'),
    option_a: fc.string({ minLength: 1, maxLength: 100 }),
    option_b: fc.string({ minLength: 1, maxLength: 100 }),
    option_c: fc.string({ minLength: 1, maxLength: 100 }),
    option_d: fc.string({ minLength: 1, maxLength: 100 }),
    knowledge_tag: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
    difficulty: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  }),
  // Multiple choice question
  fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }),
    question_type: fc.constant('multiple' as const),
    answer: fc.subarray(['A', 'B', 'C', 'D'], { minLength: 2, maxLength: 4 }).map(arr => arr.join('')),
    option_a: fc.string({ minLength: 1, maxLength: 100 }),
    option_b: fc.string({ minLength: 1, maxLength: 100 }),
    option_c: fc.string({ minLength: 1, maxLength: 100 }),
    option_d: fc.string({ minLength: 1, maxLength: 100 }),
    knowledge_tag: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
    difficulty: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  }),
  // True/False question
  fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }),
    question_type: fc.constant('truefalse' as const),
    answer: fc.constantFrom('对', '错'),
    knowledge_tag: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
    difficulty: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  }),
  // Fill in the blank question
  fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }),
    question_type: fc.constant('fillblank' as const),
    answer: fc.string({ minLength: 1, maxLength: 100 }),
    knowledge_tag: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
    difficulty: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  })
);

/**
 * Generate a batch of raw questions for import
 */
const rawImportBatchArbitrary: fc.Arbitrary<RawImportQuestion[]> = fc.array(
  rawImportQuestionArbitrary,
  { minLength: 1, maxLength: 50 }
);

// ============ Import Task Association Property Tests ============

describe('Import Task Association Property Tests', () => {
  /**
   * **Feature: question-hierarchy, Property 12: Import Task Association**
   * **Validates: Requirements 5.1, 5.2**
   * 
   * For any CSV import operation, all imported questions must have their
   * task_id set to the selected target task.
   */
  describe('Property 12: Import Task Association', () => {
    it('should assign the selected task_id to all imported questions', () => {
      fc.assert(
        fc.property(
          fc.tuple(rawImportBatchArbitrary, uuidArbitrary, fc.integer({ min: 1, max: 1000 })),
          ([rawQuestions, targetTaskId, startRound]) => {
            // Simulate the import process
            const importedQuestions = importQuestionsToTask(rawQuestions, targetTaskId, startRound);
            
            // Validate all questions have the correct task_id
            const validation = validateImportTaskAssociation(importedQuestions, targetTaskId);
            
            expect(validation.valid).toBe(true);
            if (!validation.valid) {
              console.error('Import task association validation errors:', validation.errors);
            }
            expect(validation.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should assign task_id to every single imported question without exception', () => {
      fc.assert(
        fc.property(
          fc.tuple(rawImportBatchArbitrary, uuidArbitrary),
          ([rawQuestions, targetTaskId]) => {
            const importedQuestions = importQuestionsToTask(rawQuestions, targetTaskId);
            
            // Every imported question must have a task_id
            for (const question of importedQuestions) {
              expect(question.task_id).toBeDefined();
              expect(question.task_id).not.toBe('');
              expect(question.task_id).not.toBeNull();
            }
            
            // The count of questions with task_id should equal total imported
            const questionsWithTaskId = importedQuestions.filter(q => q.task_id === targetTaskId);
            expect(questionsWithTaskId.length).toBe(rawQuestions.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve question content while assigning task_id', () => {
      fc.assert(
        fc.property(
          fc.tuple(rawImportBatchArbitrary, uuidArbitrary),
          ([rawQuestions, targetTaskId]) => {
            const importedQuestions = importQuestionsToTask(rawQuestions, targetTaskId);
            
            // Each imported question should preserve its original content
            for (let i = 0; i < rawQuestions.length; i++) {
              const raw = rawQuestions[i];
              const imported = importedQuestions[i];
              
              expect(imported.title).toBe(raw.title);
              expect(imported.question_type).toBe(raw.question_type);
              expect(imported.answer).toBe(raw.answer);
              expect(imported.task_id).toBe(targetTaskId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly integrate imported questions into existing hierarchy', () => {
      fc.assert(
        fc.property(
          fc.tuple(hierarchyWithFullDepthArbitrary, rawImportBatchArbitrary),
          ([existingData, rawQuestions]) => {
            // Skip if no tasks exist
            if (existingData.tasks.length === 0) return;
            
            // Pick a random existing task as the import target
            const targetTask = existingData.tasks[0];
            
            // Import questions to the target task
            const importedQuestions = importQuestionsToTask(
              rawQuestions,
              targetTask.task_id,
              existingData.questions.length + 1
            );
            
            // Validate task association
            const taskValidation = validateImportTaskAssociation(importedQuestions, targetTask.task_id);
            expect(taskValidation.valid).toBe(true);
            
            // Validate hierarchy inheritance
            const hierarchyValidation = validateImportHierarchyInheritance(
              importedQuestions,
              targetTask.task_id,
              existingData
            );
            expect(hierarchyValidation.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should make imported questions filterable by the target task', () => {
      fc.assert(
        fc.property(
          fc.tuple(hierarchyWithFullDepthArbitrary, rawImportBatchArbitrary),
          ([existingData, rawQuestions]) => {
            // Skip if no tasks exist
            if (existingData.tasks.length === 0) return;
            
            // Pick a random existing task as the import target
            const targetTask = existingData.tasks[0];
            
            // Import questions to the target task
            const importedQuestions = importQuestionsToTask(
              rawQuestions,
              targetTask.task_id,
              existingData.questions.length + 1
            );
            
            // Create updated hierarchy with imported questions
            const updatedData: HierarchyData = {
              ...existingData,
              questions: [...existingData.questions, ...importedQuestions],
            };
            
            // Filter by the target task
            const filteredByTask = filterQuestionsByTask(updatedData, targetTask.task_id);
            
            // All imported questions should appear in the task filter
            const filteredIds = new Set(filteredByTask.map(q => q.id));
            for (const imported of importedQuestions) {
              expect(filteredIds.has(imported.id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should make imported questions filterable by parent project and course', () => {
      fc.assert(
        fc.property(
          fc.tuple(hierarchyWithFullDepthArbitrary, rawImportBatchArbitrary),
          ([existingData, rawQuestions]) => {
            // Skip if no tasks exist
            if (existingData.tasks.length === 0) return;
            
            // Pick a random existing task as the import target
            const targetTask = existingData.tasks[0];
            const parentProject = existingData.projects.find(p => p.project_id === targetTask.project_id);
            if (!parentProject) return;
            
            const grandparentCourse = existingData.courses.find(c => c.course_id === parentProject.course_id);
            if (!grandparentCourse) return;
            
            // Import questions to the target task
            const importedQuestions = importQuestionsToTask(
              rawQuestions,
              targetTask.task_id,
              existingData.questions.length + 1
            );
            
            // Create updated hierarchy with imported questions
            const updatedData: HierarchyData = {
              ...existingData,
              questions: [...existingData.questions, ...importedQuestions],
            };
            
            // Filter by parent project
            const filteredByProject = filterQuestionsByProject(updatedData, parentProject.project_id);
            const projectFilteredIds = new Set(filteredByProject.map(q => q.id));
            for (const imported of importedQuestions) {
              expect(projectFilteredIds.has(imported.id)).toBe(true);
            }
            
            // Filter by grandparent course
            const filteredByCourse = filterQuestionsByCourse(updatedData, grandparentCourse.course_id);
            const courseFilteredIds = new Set(filteredByCourse.map(q => q.id));
            for (const imported of importedQuestions) {
              expect(courseFilteredIds.has(imported.id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty import batch gracefully', () => {
      fc.assert(
        fc.property(uuidArbitrary, (targetTaskId) => {
          const importedQuestions = importQuestionsToTask([], targetTaskId);
          
          expect(importedQuestions).toHaveLength(0);
          
          // Validation should pass for empty batch
          const validation = validateImportTaskAssociation(importedQuestions, targetTaskId);
          expect(validation.valid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should assign sequential round numbers starting from startRound', () => {
      fc.assert(
        fc.property(
          fc.tuple(rawImportBatchArbitrary, uuidArbitrary, fc.integer({ min: 1, max: 1000 })),
          ([rawQuestions, targetTaskId, startRound]) => {
            const importedQuestions = importQuestionsToTask(rawQuestions, targetTaskId, startRound);
            
            // Verify sequential IDs (which represent round numbers)
            for (let i = 0; i < importedQuestions.length; i++) {
              expect(importedQuestions[i].id).toBe(startRound + i);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// Export validation functions for use in other modules
export {
  validateProjectCourseReferences,
  validateTaskProjectReferences,
  validateQuestionTaskReferences,
  validateHierarchyIntegrity,
  cascadeDeleteCourse,
  validateCascadeDeleteCourse,
  cascadeDeleteProject,
  validateCascadeDeleteProject,
  cascadeDeleteTask,
  validateCascadeDeleteTask,
  filterQuestionsByCourse,
  filterQuestionsByProject,
  filterQuestionsByTask,
  getAllQuestions,
  validateCourseFilter,
  validateProjectFilter,
  validateTaskFilter,
  importQuestionsToTask,
  validateImportTaskAssociation,
  validateImportHierarchyInheritance,
  type Course,
  type Project,
  type Task,
  type Question,
  type HierarchyData,
  type RawImportQuestion,
};


// ============ Question Count Accuracy Functions ============

/**
 * Calculates the actual question count for a task
 * This is a direct count of questions with matching task_id
 * Requirement 7.3: Display the question count for that specific task
 */
function calculateTaskQuestionCount(data: HierarchyData, taskId: string): number {
  return data.questions.filter(q => q.task_id === taskId).length;
}

/**
 * Calculates the actual question count for a project
 * This is an aggregate count of all questions in tasks belonging to the project
 * Requirement 7.2: Display the total question count across all its tasks
 */
function calculateProjectQuestionCount(data: HierarchyData, projectId: string): number {
  // Find all tasks belonging to this project
  const projectTaskIds = new Set(
    data.tasks
      .filter(t => t.project_id === projectId)
      .map(t => t.task_id)
  );
  
  // Count questions belonging to those tasks
  return data.questions.filter(q => projectTaskIds.has(q.task_id)).length;
}

/**
 * Calculates the actual question count for a course
 * This is an aggregate count of all questions in projects belonging to the course
 * Requirement 7.1: Display the total question count across all its projects and tasks
 */
function calculateCourseQuestionCount(data: HierarchyData, courseId: string): number {
  // Find all projects belonging to this course
  const courseProjectIds = new Set(
    data.projects
      .filter(p => p.course_id === courseId)
      .map(p => p.project_id)
  );
  
  // Find all tasks belonging to those projects
  const courseTaskIds = new Set(
    data.tasks
      .filter(t => courseProjectIds.has(t.project_id))
      .map(t => t.task_id)
  );
  
  // Count questions belonging to those tasks
  return data.questions.filter(q => courseTaskIds.has(q.task_id)).length;
}

/**
 * Updates the question_count fields in the hierarchy to reflect actual counts
 * This simulates the count update functions in questionbank.js
 * Requirement 7.4: Update the counts at all affected hierarchy levels
 */
function updateHierarchyCounts(data: HierarchyData): HierarchyData {
  // Update task counts
  const updatedTasks = data.tasks.map(task => ({
    ...task,
    question_count: calculateTaskQuestionCount(data, task.task_id),
  }));
  
  // Update project counts
  const updatedProjects = data.projects.map(project => ({
    ...project,
    question_count: calculateProjectQuestionCount(data, project.project_id),
  }));
  
  // Update course counts
  const updatedCourses = data.courses.map(course => ({
    ...course,
    question_count: calculateCourseQuestionCount(data, course.course_id),
  }));
  
  return {
    courses: updatedCourses,
    projects: updatedProjects,
    tasks: updatedTasks,
    questions: data.questions,
  };
}

/**
 * Validates that all question_count fields match actual counts
 */
function validateQuestionCounts(data: HierarchyData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate task counts
  for (const task of data.tasks) {
    const actualCount = calculateTaskQuestionCount(data, task.task_id);
    if (task.question_count !== actualCount) {
      errors.push(`Task "${task.name}" (${task.task_id}) has question_count ${task.question_count} but actual count is ${actualCount}`);
    }
  }
  
  // Validate project counts
  for (const project of data.projects) {
    const actualCount = calculateProjectQuestionCount(data, project.project_id);
    if (project.question_count !== actualCount) {
      errors.push(`Project "${project.name}" (${project.project_id}) has question_count ${project.question_count} but actual count is ${actualCount}`);
    }
  }
  
  // Validate course counts
  for (const course of data.courses) {
    const actualCount = calculateCourseQuestionCount(data, course.course_id);
    if (course.question_count !== actualCount) {
      errors.push(`Course "${course.name}" (${course.course_id}) has question_count ${course.question_count} but actual count is ${actualCount}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Simulates adding a question and updating counts
 */
function addQuestionAndUpdateCounts(data: HierarchyData, question: Question): HierarchyData {
  const newData: HierarchyData = {
    ...data,
    questions: [...data.questions, question],
  };
  return updateHierarchyCounts(newData);
}

/**
 * Simulates deleting a question and updating counts
 */
function deleteQuestionAndUpdateCounts(data: HierarchyData, questionId: number): HierarchyData {
  const newData: HierarchyData = {
    ...data,
    questions: data.questions.filter(q => q.id !== questionId),
  };
  return updateHierarchyCounts(newData);
}

// ============ Question Count Accuracy Property Tests ============

describe('Question Count Accuracy Property Tests', () => {
  /**
   * **Feature: question-hierarchy, Property 11: Question Count Accuracy**
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
   * 
   * For any hierarchy node, the displayed question_count must equal the actual
   * count of questions belonging to that node (directly for tasks, aggregated
   * for projects and courses).
   */
  describe('Property 11: Question Count Accuracy', () => {
    it('should have accurate task question counts after updateHierarchyCounts', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Update counts to ensure accuracy
          const updatedData = updateHierarchyCounts(data);
          
          // Validate all task counts
          for (const task of updatedData.tasks) {
            const actualCount = calculateTaskQuestionCount(updatedData, task.task_id);
            expect(task.question_count).toBe(actualCount);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have accurate project question counts (aggregated from tasks)', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Update counts to ensure accuracy
          const updatedData = updateHierarchyCounts(data);
          
          // Validate all project counts
          for (const project of updatedData.projects) {
            const actualCount = calculateProjectQuestionCount(updatedData, project.project_id);
            expect(project.question_count).toBe(actualCount);
            
            // Also verify it equals sum of task counts
            const projectTaskIds = new Set(
              updatedData.tasks
                .filter(t => t.project_id === project.project_id)
                .map(t => t.task_id)
            );
            const sumOfTaskCounts = updatedData.tasks
              .filter(t => projectTaskIds.has(t.task_id))
              .reduce((sum, t) => sum + t.question_count, 0);
            expect(project.question_count).toBe(sumOfTaskCounts);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have accurate course question counts (aggregated from projects)', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Update counts to ensure accuracy
          const updatedData = updateHierarchyCounts(data);
          
          // Validate all course counts
          for (const course of updatedData.courses) {
            const actualCount = calculateCourseQuestionCount(updatedData, course.course_id);
            expect(course.question_count).toBe(actualCount);
            
            // Also verify it equals sum of project counts
            const courseProjectIds = new Set(
              updatedData.projects
                .filter(p => p.course_id === course.course_id)
                .map(p => p.project_id)
            );
            const sumOfProjectCounts = updatedData.projects
              .filter(p => courseProjectIds.has(p.project_id))
              .reduce((sum, p) => sum + p.question_count, 0);
            expect(course.question_count).toBe(sumOfProjectCounts);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should pass full validation after updateHierarchyCounts', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Update counts
          const updatedData = updateHierarchyCounts(data);
          
          // Full validation should pass
          const validation = validateQuestionCounts(updatedData);
          expect(validation.valid).toBe(true);
          expect(validation.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should update counts correctly when a question is added', () => {
      fc.assert(
        fc.property(
          fc.tuple(hierarchyWithFullDepthArbitrary, fc.integer({ min: 10000, max: 99999 })),
          ([data, newQuestionId]) => {
            // Skip if no tasks exist
            if (data.tasks.length === 0) return;
            
            // Pick a random task to add the question to
            const targetTask = data.tasks[0];
            
            // Create a new question
            const newQuestion: Question = {
              id: newQuestionId,
              task_id: targetTask.task_id,
              title: 'New Test Question',
              question_type: 'single',
              answer: 'A',
            };
            
            // Get counts before adding
            const beforeData = updateHierarchyCounts(data);
            const taskCountBefore = beforeData.tasks.find(t => t.task_id === targetTask.task_id)?.question_count ?? 0;
            
            // Add question and update counts
            const afterData = addQuestionAndUpdateCounts(beforeData, newQuestion);
            const taskCountAfter = afterData.tasks.find(t => t.task_id === targetTask.task_id)?.question_count ?? 0;
            
            // Task count should increase by 1
            expect(taskCountAfter).toBe(taskCountBefore + 1);
            
            // Full validation should pass
            const validation = validateQuestionCounts(afterData);
            expect(validation.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update counts correctly when a question is deleted', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Skip if no questions exist
          if (data.questions.length === 0) return;
          
          // Update counts first
          const beforeData = updateHierarchyCounts(data);
          
          // Pick a question to delete
          const questionToDelete = beforeData.questions[0];
          const taskId = questionToDelete.task_id;
          const taskCountBefore = beforeData.tasks.find(t => t.task_id === taskId)?.question_count ?? 0;
          
          // Delete question and update counts
          const afterData = deleteQuestionAndUpdateCounts(beforeData, questionToDelete.id);
          const taskCountAfter = afterData.tasks.find(t => t.task_id === taskId)?.question_count ?? 0;
          
          // Task count should decrease by 1
          expect(taskCountAfter).toBe(taskCountBefore - 1);
          
          // Full validation should pass
          const validation = validateQuestionCounts(afterData);
          expect(validation.valid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should propagate count changes up the hierarchy when question is added', () => {
      fc.assert(
        fc.property(
          fc.tuple(hierarchyWithFullDepthArbitrary, fc.integer({ min: 10000, max: 99999 })),
          ([data, newQuestionId]) => {
            // Skip if no tasks exist
            if (data.tasks.length === 0) return;
            
            // Update counts first
            const beforeData = updateHierarchyCounts(data);
            
            // Pick a task and find its parent project and course
            const targetTask = beforeData.tasks[0];
            const parentProject = beforeData.projects.find(p => p.project_id === targetTask.project_id);
            if (!parentProject) return;
            const grandparentCourse = beforeData.courses.find(c => c.course_id === parentProject.course_id);
            if (!grandparentCourse) return;
            
            // Get counts before
            const taskCountBefore = targetTask.question_count;
            const projectCountBefore = parentProject.question_count;
            const courseCountBefore = grandparentCourse.question_count;
            
            // Create and add a new question
            const newQuestion: Question = {
              id: newQuestionId,
              task_id: targetTask.task_id,
              title: 'New Test Question',
              question_type: 'single',
              answer: 'A',
            };
            const afterData = addQuestionAndUpdateCounts(beforeData, newQuestion);
            
            // Get counts after
            const taskAfter = afterData.tasks.find(t => t.task_id === targetTask.task_id);
            const projectAfter = afterData.projects.find(p => p.project_id === parentProject.project_id);
            const courseAfter = afterData.courses.find(c => c.course_id === grandparentCourse.course_id);
            
            // All counts should increase by 1
            expect(taskAfter?.question_count).toBe(taskCountBefore + 1);
            expect(projectAfter?.question_count).toBe(projectCountBefore + 1);
            expect(courseAfter?.question_count).toBe(courseCountBefore + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should propagate count changes up the hierarchy when question is deleted', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Skip if no questions exist
          if (data.questions.length === 0) return;
          
          // Update counts first
          const beforeData = updateHierarchyCounts(data);
          
          // Pick a question and find its task, project, and course
          const questionToDelete = beforeData.questions[0];
          const targetTask = beforeData.tasks.find(t => t.task_id === questionToDelete.task_id);
          if (!targetTask) return;
          const parentProject = beforeData.projects.find(p => p.project_id === targetTask.project_id);
          if (!parentProject) return;
          const grandparentCourse = beforeData.courses.find(c => c.course_id === parentProject.course_id);
          if (!grandparentCourse) return;
          
          // Get counts before
          const taskCountBefore = targetTask.question_count;
          const projectCountBefore = parentProject.question_count;
          const courseCountBefore = grandparentCourse.question_count;
          
          // Delete question and update counts
          const afterData = deleteQuestionAndUpdateCounts(beforeData, questionToDelete.id);
          
          // Get counts after
          const taskAfter = afterData.tasks.find(t => t.task_id === targetTask.task_id);
          const projectAfter = afterData.projects.find(p => p.project_id === parentProject.project_id);
          const courseAfter = afterData.courses.find(c => c.course_id === grandparentCourse.course_id);
          
          // All counts should decrease by 1
          expect(taskAfter?.question_count).toBe(taskCountBefore - 1);
          expect(projectAfter?.question_count).toBe(projectCountBefore - 1);
          expect(courseAfter?.question_count).toBe(courseCountBefore - 1);
        }),
        { numRuns: 100 }
      );
    });

    it('should have zero counts for nodes with no questions', () => {
      fc.assert(
        fc.property(
          fc.array(courseArbitrary, { minLength: 1, maxLength: 3 }),
          (courses) => {
            // Create hierarchy with no questions
            const emptyData: HierarchyData = {
              courses,
              projects: [],
              tasks: [],
              questions: [],
            };
            
            const updatedData = updateHierarchyCounts(emptyData);
            
            // All course counts should be 0
            for (const course of updatedData.courses) {
              expect(course.question_count).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain count accuracy after cascade delete of task', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Skip if no tasks exist
          if (data.tasks.length === 0) return;
          
          // Update counts first
          const beforeData = updateHierarchyCounts(data);
          
          // Pick a task to delete
          const taskToDelete = beforeData.tasks[0];
          const parentProject = beforeData.projects.find(p => p.project_id === taskToDelete.project_id);
          if (!parentProject) return;
          
          // Count questions that will be deleted
          const questionsToDelete = beforeData.questions.filter(q => q.task_id === taskToDelete.task_id).length;
          const projectCountBefore = parentProject.question_count;
          
          // Perform cascade delete and update counts
          const afterDelete = cascadeDeleteTask(beforeData, taskToDelete.task_id);
          const afterData = updateHierarchyCounts(afterDelete);
          
          // Project count should decrease by the number of deleted questions
          const projectAfter = afterData.projects.find(p => p.project_id === parentProject.project_id);
          expect(projectAfter?.question_count).toBe(projectCountBefore - questionsToDelete);
          
          // Full validation should pass
          const validation = validateQuestionCounts(afterData);
          expect(validation.valid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain count accuracy after cascade delete of project', () => {
      fc.assert(
        fc.property(hierarchyWithFullDepthArbitrary, (data) => {
          // Skip if no projects exist
          if (data.projects.length === 0) return;
          
          // Update counts first
          const beforeData = updateHierarchyCounts(data);
          
          // Pick a project to delete
          const projectToDelete = beforeData.projects[0];
          const parentCourse = beforeData.courses.find(c => c.course_id === projectToDelete.course_id);
          if (!parentCourse) return;
          
          // Count questions that will be deleted (all questions in tasks of this project)
          const projectTaskIds = new Set(
            beforeData.tasks
              .filter(t => t.project_id === projectToDelete.project_id)
              .map(t => t.task_id)
          );
          const questionsToDelete = beforeData.questions.filter(q => projectTaskIds.has(q.task_id)).length;
          const courseCountBefore = parentCourse.question_count;
          
          // Perform cascade delete and update counts
          const afterDelete = cascadeDeleteProject(beforeData, projectToDelete.project_id);
          const afterData = updateHierarchyCounts(afterDelete);
          
          // Course count should decrease by the number of deleted questions
          const courseAfter = afterData.courses.find(c => c.course_id === parentCourse.course_id);
          expect(courseAfter?.question_count).toBe(courseCountBefore - questionsToDelete);
          
          // Full validation should pass
          const validation = validateQuestionCounts(afterData);
          expect(validation.valid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain count accuracy after cascade delete of course', () => {
      fc.assert(
        fc.property(
          hierarchyWithFullDepthArbitrary.filter(data => data.courses.length >= 2),
          (data) => {
            // Update counts first
            const beforeData = updateHierarchyCounts(data);
            
            // Pick a course to delete
            const courseToDelete = beforeData.courses[0];
            const otherCourse = beforeData.courses[1];
            
            // Get other course's count before
            const otherCourseCountBefore = otherCourse.question_count;
            
            // Perform cascade delete and update counts
            const afterDelete = cascadeDeleteCourse(beforeData, courseToDelete.course_id);
            const afterData = updateHierarchyCounts(afterDelete);
            
            // Other course's count should remain unchanged
            const otherCourseAfter = afterData.courses.find(c => c.course_id === otherCourse.course_id);
            expect(otherCourseAfter?.question_count).toBe(otherCourseCountBefore);
            
            // Full validation should pass
            const validation = validateQuestionCounts(afterData);
            expect(validation.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// Export additional functions for count accuracy
export {
  calculateTaskQuestionCount,
  calculateProjectQuestionCount,
  calculateCourseQuestionCount,
  updateHierarchyCounts,
  validateQuestionCounts,
  addQuestionAndUpdateCounts,
  deleteQuestionAndUpdateCounts,
};
