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

// Export validation functions for use in other modules
export {
  validateProjectCourseReferences,
  validateTaskProjectReferences,
  validateQuestionTaskReferences,
  validateHierarchyIntegrity,
  type Course,
  type Project,
  type Task,
  type Question,
  type HierarchyData,
};
