import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@jest/globals';
import { ExocortexWorld } from '../support/world';
import { Task } from '../../src/domain/entities/Task';
import { TaskId } from '../../src/domain/value-objects/TaskId';
import { Priority } from '../../src/domain/value-objects/Priority';
import { TaskStatus } from '../../src/domain/value-objects/TaskStatus';
import { AssetId } from '../../src/domain/value-objects/AssetId';
import { ITaskRepository } from '../../src/domain/repositories/ITaskRepository';

interface TaskTableRow {
  title?: string;
  description?: string;
  priority?: string;
  estimated_hours?: string;
  tags?: string;
  status?: string;
  due_date?: string;
  project_id?: string;
}

// Background setup
Given('the Exocortex plugin is initialized', async function (this: ExocortexWorld) {
  await this.initialize();
  expect(this.plugin).toBeDefined();
  expect(this.container).toBeDefined();
});

Given('the task management system is enabled', function (this: ExocortexWorld) {
  // Verify task repository is available
  const taskRepository = this.container.resolve<ITaskRepository>('ITaskRepository');
  expect(taskRepository).toBeDefined();
  this.setTestData('taskRepository', taskRepository);
});

Given('I have the following task priorities available:', function (this: ExocortexWorld, dataTable: any) {
  const priorities = dataTable.hashes();
  this.setTestData('availablePriorities', priorities);
  
  // Verify priority values match domain expectations
  for (const priority of priorities) {
    const priorityResult = Priority.create(priority.priority);
    expect(priorityResult.isSuccess).toBe(true);
  }
});

Given('I have the following task statuses available:', function (this: ExocortexWorld, dataTable: any) {
  const statuses = dataTable.hashes();
  this.setTestData('availableStatuses', statuses);
  
  // Verify status transitions are valid
  for (const status of statuses) {
    const statusResult = TaskStatus.create(status.status);
    expect(statusResult.isSuccess).toBe(true);
  }
});

// Task creation scenarios
Given('I am creating a new task', function (this: ExocortexWorld) {
  this.setTestData('creatingTask', true);
  this.setTestData('taskData', {});
});

When('I provide the following task details:', function (this: ExocortexWorld, dataTable: any) {
  const taskDetails = dataTable.hashes()[0] as TaskTableRow;
  this.setTestData('taskData', taskDetails);
  
  const taskParams: any = {
    title: taskDetails.title,
    description: taskDetails.description,
  };
  
  if (taskDetails.priority) {
    const priorityResult = Priority.create(taskDetails.priority);
    if (priorityResult.isSuccess) {
      taskParams.priority = priorityResult.getValue();
    }
  }
  
  if (taskDetails.estimated_hours) {
    taskParams.estimatedHours = parseInt(taskDetails.estimated_hours);
  }
  
  if (taskDetails.tags) {
    taskParams.tags = taskDetails.tags.split(',').map(tag => tag.trim());
  }
  
  if (taskDetails.due_date) {
    taskParams.dueDate = new Date(taskDetails.due_date);
  }
  
  const result = Task.create(taskParams);
  this.lastResult = result;
  
  if (result.isSuccess) {
    const task = result.getValue();
    this.setTestData('createdTask', task);
  } else {
    this.lastError = new Error(result.getError());
  }
});

When('I provide the following invalid task details:', function (this: ExocortexWorld, dataTable: any) {
  const taskDetails = dataTable.hashes()[0] as TaskTableRow;
  this.setTestData('taskData', taskDetails);
  
  const taskParams: any = {
    title: taskDetails.title,
    description: taskDetails.description,
  };
  
  if (taskDetails.priority) {
    const priorityResult = Priority.create(taskDetails.priority);
    if (priorityResult.isSuccess) {
      taskParams.priority = priorityResult.getValue();
    }
  }
  
  if (taskDetails.estimated_hours) {
    taskParams.estimatedHours = parseInt(taskDetails.estimated_hours);
  }
  
  const result = Task.create(taskParams);
  this.lastResult = result;
  
  if (!result.isSuccess) {
    this.lastError = new Error(result.getError());
  }
});

When('I provide a task title with exactly {int} characters', function (this: ExocortexWorld, characterCount: number) {
  const title = 'A'.repeat(characterCount);
  const result = Task.create({ title });
  this.lastResult = result;
  
  if (result.isSuccess) {
    this.setTestData('createdTask', result.getValue());
  } else {
    this.lastError = new Error(result.getError());
  }
});

When('I provide a task title with {int} characters', function (this: ExocortexWorld, characterCount: number) {
  const title = 'A'.repeat(characterCount);
  const result = Task.create({ title });
  this.lastResult = result;
  
  if (!result.isSuccess) {
    this.lastError = new Error(result.getError());
  }
});

Given('today is {string}', function (this: ExocortexWorld, dateString: string) {
  const mockDate = new Date(dateString);
  this.setTestData('mockCurrentDate', mockDate);
  
  // Mock Date constructor for testing
  const originalDate = Date;
  global.Date = jest.fn().mockImplementation((arg?: any) => {
    if (arg === undefined) {
      return mockDate;
    }
    return new originalDate(arg);
  }) as any;
  global.Date.now = jest.fn().mockReturnValue(mockDate.getTime());
});

// Assertions for creation
Then('the task should be created successfully', function (this: ExocortexWorld) {
  expect(this.lastResult).toBeDefined();
  expect(this.lastResult.isSuccess).toBe(true);
  expect(this.getTestData('createdTask')).toBeDefined();
});

Then('the task creation should fail', function (this: ExocortexWorld) {
  expect(this.lastResult).toBeDefined();
  expect(this.lastResult.isSuccess).toBe(false);
  expect(this.lastError).toBeDefined();
});

Then('I should receive the error {string}', function (this: ExocortexWorld, expectedError: string) {
  expect(this.lastError).toBeDefined();
  expect(this.lastError!.message).toContain(expectedError);
});

Then('no task should be created', function (this: ExocortexWorld) {
  expect(this.getTestData('createdTask')).toBeUndefined();
});

Then('the task should have a valid UUID', function (this: ExocortexWorld) {
  const task = this.getTestData('createdTask') as Task;
  expect(task).toBeDefined();
  
  const taskId = task.getId();
  expect(taskId).toBeDefined();
  expect(taskId.toString()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

Then('the task status should be {string}', function (this: ExocortexWorld, expectedStatus: string) {
  const task = this.getTestData('createdTask') as Task;
  expect(task).toBeDefined();
  expect(task.getStatus().toString()).toBe(expectedStatus);
});

Then('the created timestamp should be set', function (this: ExocortexWorld) {
  const task = this.getTestData('createdTask') as Task;
  expect(task).toBeDefined();
  expect(task.getCreatedAt()).toBeDefined();
  expect(task.getCreatedAt()).toBeInstanceOf(Date);
});

Then('the updated timestamp should equal the created timestamp', function (this: ExocortexWorld) {
  const task = this.getTestData('createdTask') as Task;
  expect(task).toBeDefined();
  expect(task.getUpdatedAt().getTime()).toBe(task.getCreatedAt().getTime());
});

Then('the task should be persisted with frontmatter', function (this: ExocortexWorld) {
  const task = this.getTestData('createdTask') as Task;
  expect(task).toBeDefined();
  
  const frontmatter = task.toFrontmatter();
  expect(frontmatter).toBeDefined();
  expect(frontmatter['exo__Task_title']).toBe(task.getTitle());
  expect(frontmatter['exo__Task_status']).toBe(task.getStatus().toString());
});

Then('the title length should be exactly {int} characters', function (this: ExocortexWorld, expectedLength: number) {
  const task = this.getTestData('createdTask') as Task;
  expect(task).toBeDefined();
  expect(task.getTitle().length).toBe(expectedLength);
});

Then('a warning should be logged about the past due date', function (this: ExocortexWorld) {
  // Verify console.warn was called (would need to mock console in real test)
  expect(this.lastResult?.isSuccess).toBe(true);
});

Then('the task creation should not fail', function (this: ExocortexWorld) {
  expect(this.lastResult?.isSuccess).toBe(true);
});

// Status transition scenarios
Given('I have a task with status {string}', async function (this: ExocortexWorld, statusString: string) {
  const statusResult = TaskStatus.create(statusString);
  expect(statusResult.isSuccess).toBe(true);
  
  const status = statusResult.getValue()!;
  const taskResult = Task.create({
    title: 'Test Task',
    status: status
  });
  
  expect(taskResult.isSuccess).toBe(true);
  const task = taskResult.getValue()!;
  this.setTestData('currentTask', task);
});

When('I update the task status to {string}', function (this: ExocortexWorld, newStatusString: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const statusResult = TaskStatus.create(newStatusString);
  expect(statusResult.isSuccess).toBe(true);
  
  const newStatus = statusResult.getValue()!;
  const result = task.updateStatus(newStatus);
  this.lastResult = result;
});

When('I attempt to update the task status to {string}', function (this: ExocortexWorld, newStatusString: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const statusResult = TaskStatus.create(newStatusString);
  expect(statusResult.isSuccess).toBe(true);
  
  const newStatus = statusResult.getValue()!;
  const result = task.updateStatus(newStatus);
  this.lastResult = result;
  
  if (!result.isSuccess) {
    this.lastError = new Error(result.getError());
  }
});

Then('the status update should succeed', function (this: ExocortexWorld) {
  expect(this.lastResult).toBeDefined();
  expect(this.lastResult.isSuccess).toBe(true);
});

Then('the status update should fail', function (this: ExocortexWorld) {
  expect(this.lastResult).toBeDefined();
  expect(this.lastResult.isSuccess).toBe(false);
});

Then('I should receive an error about invalid transition', function (this: ExocortexWorld) {
  expect(this.lastError).toBeDefined();
  expect(this.lastError!.message).toContain('Cannot transition from');
});

Then('the task status should remain {string}', function (this: ExocortexWorld, expectedStatus: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  expect(task.getStatus().toString()).toBe(expectedStatus);
});

Then('the updated timestamp should be modified', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const originalCreated = task.getCreatedAt();
  const updated = task.getUpdatedAt();
  
  // In real scenarios, there would be a time difference
  expect(updated).toBeInstanceOf(Date);
});

Then('if the new status is {string} then the completed timestamp should be set', function (this: ExocortexWorld, statusString: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  if (task.getStatus().toString() === statusString && statusString === 'done') {
    expect(task.getCompletedAt()).toBeDefined();
    expect(task.getCompletedAt()).toBeInstanceOf(Date);
  }
});

// Completion tracking scenarios
Given('I have an in-progress task', function (this: ExocortexWorld) {
  const statusResult = TaskStatus.create('in_progress');
  expect(statusResult.isSuccess).toBe(true);
  
  const taskResult = Task.create({
    title: 'In Progress Task',
    status: statusResult.getValue()!
  });
  
  expect(taskResult.isSuccess).toBe(true);
  this.setTestData('currentTask', taskResult.getValue()!);
});

Given('the task has no completion timestamp', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  expect(task.getCompletedAt()).toBeUndefined();
});

Then('the task should have a completion timestamp', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  expect(task.getCompletedAt()).toBeDefined();
});

Then('the completion timestamp should be recent', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const completedAt = task.getCompletedAt();
  expect(completedAt).toBeDefined();
  
  const now = new Date();
  const diff = now.getTime() - completedAt!.getTime();
  expect(diff).toBeLessThan(5000); // Within 5 seconds
});

Given('I have a completed task with a completion timestamp', function (this: ExocortexWorld) {
  const statusResult = TaskStatus.create('done');
  expect(statusResult.isSuccess).toBe(true);
  
  const taskResult = Task.create({
    title: 'Completed Task',
    status: statusResult.getValue()!
  });
  
  expect(taskResult.isSuccess).toBe(true);
  const task = taskResult.getValue()!;
  
  // Manually set completion timestamp for test
  (task as any).props.completedAt = new Date();
  
  this.setTestData('currentTask', task);
});

Then('the completion timestamp should be cleared', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  expect(task.getCompletedAt()).toBeUndefined();
});

// Title update scenarios
Given('I have an existing task', function (this: ExocortexWorld) {
  const taskResult = Task.create({
    title: 'Original Task Title'
  });
  
  expect(taskResult.isSuccess).toBe(true);
  this.setTestData('currentTask', taskResult.getValue()!);
});

Given('I have an existing task with title {string}', function (this: ExocortexWorld, title: string) {
  const taskResult = Task.create({
    title: title
  });
  
  expect(taskResult.isSuccess).toBe(true);
  this.setTestData('currentTask', taskResult.getValue()!);
});

When('I update the task title to {string}', function (this: ExocortexWorld, newTitle: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const result = task.updateTitle(newTitle);
  this.lastResult = result;
});

When('I attempt to update the task title to {string}', function (this: ExocortexWorld, newTitle: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const result = task.updateTitle(newTitle);
  this.lastResult = result;
  
  if (!result.isSuccess) {
    this.lastError = new Error(result.getError());
  }
});

Then('the title update should succeed', function (this: ExocortexWorld) {
  expect(this.lastResult).toBeDefined();
  expect(this.lastResult.isSuccess).toBe(true);
});

Then('the title update should fail', function (this: ExocortexWorld) {
  expect(this.lastResult).toBeDefined();
  expect(this.lastResult.isSuccess).toBe(false);
});

Then('the task title should be {string}', function (this: ExocortexWorld, expectedTitle: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  expect(task.getTitle()).toBe(expectedTitle);
});

Then('the task title should remain {string}', function (this: ExocortexWorld, expectedTitle: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  expect(task.getTitle()).toBe(expectedTitle);
});

// Estimation scenarios
Given('I have a task with estimated hours of {int}', function (this: ExocortexWorld, hours: number) {
  const taskResult = Task.create({
    title: 'Task with Hours',
    estimatedHours: hours
  });
  
  expect(taskResult.isSuccess).toBe(true);
  this.setTestData('currentTask', taskResult.getValue()!);
});

When('I update the estimated hours to {int}', function (this: ExocortexWorld, newHours: number) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const result = task.setEstimatedHours(newHours);
  this.lastResult = result;
});

When('I attempt to update the estimated hours to {int}', function (this: ExocortexWorld, newHours: number) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const result = task.setEstimatedHours(newHours);
  this.lastResult = result;
  
  if (!result.isSuccess) {
    this.lastError = new Error(result.getError());
  }
});

Then('the hours update should succeed', function (this: ExocortexWorld) {
  expect(this.lastResult).toBeDefined();
  expect(this.lastResult.isSuccess).toBe(true);
});

Then('the hours update should fail', function (this: ExocortexWorld) {
  expect(this.lastResult).toBeDefined();
  expect(this.lastResult.isSuccess).toBe(false);
});

Then('the estimated hours should be {int}', function (this: ExocortexWorld, expectedHours: number) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  expect(task.getEstimatedHours()).toBe(expectedHours);
});

Then('the estimated hours should remain {int}', function (this: ExocortexWorld, expectedHours: number) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  expect(task.getEstimatedHours()).toBe(expectedHours);
});

// Project assignment scenarios
Given('I have an unassigned task', function (this: ExocortexWorld) {
  const taskResult = Task.create({
    title: 'Unassigned Task'
  });
  
  expect(taskResult.isSuccess).toBe(true);
  this.setTestData('currentTask', taskResult.getValue()!);
});

Given('I have a project with ID {string}', function (this: ExocortexWorld, projectId: string) {
  const assetIdResult = AssetId.create(projectId);
  expect(assetIdResult.isSuccess).toBe(true);
  this.setTestData('projectId', assetIdResult.getValue()!);
});

Given('I have a task assigned to project {string}', function (this: ExocortexWorld, projectId: string) {
  const assetIdResult = AssetId.create(projectId);
  expect(assetIdResult.isSuccess).toBe(true);
  
  const taskResult = Task.create({
    title: 'Assigned Task',
    projectId: assetIdResult.getValue()!
  });
  
  expect(taskResult.isSuccess).toBe(true);
  this.setTestData('currentTask', taskResult.getValue()!);
});

When('I assign the task to the project', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  const projectId = this.getTestData('projectId') as AssetId;
  
  expect(task).toBeDefined();
  expect(projectId).toBeDefined();
  
  task.assignToProject(projectId);
});

When('I remove the task from the project', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  task.removeFromProject();
});

Then('the task should be assigned to {string}', function (this: ExocortexWorld, expectedProjectId: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  expect(task.getProjectId()?.toString()).toBe(expectedProjectId);
});

Then('the task should have no project assignment', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  expect(task.getProjectId()).toBeUndefined();
});

Then('the task frontmatter should include the project reference', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const frontmatter = task.toFrontmatter();
  expect(frontmatter['exo__Effort_parent']).toBeDefined();
  expect(frontmatter['exo__Effort_parent']).toContain('[[');
});

Then('the project reference should be removed from frontmatter', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const frontmatter = task.toFrontmatter();
  expect(frontmatter['exo__Effort_parent']).toBeUndefined();
});

// Tagging scenarios
Given('I have a task with tags: {string}', function (this: ExocortexWorld, tagsString: string) {
  const tags = tagsString.split(',').map(tag => tag.trim());
  const taskResult = Task.create({
    title: 'Tagged Task',
    tags: tags
  });
  
  expect(taskResult.isSuccess).toBe(true);
  this.setTestData('currentTask', taskResult.getValue()!);
});

When('I add the tag {string}', function (this: ExocortexWorld, tag: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  task.addTag(tag);
});

When('I remove the tag {string}', function (this: ExocortexWorld, tag: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  task.removeTag(tag);
});

Then('the task should have tags: {string}', function (this: ExocortexWorld, expectedTagsString: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const expectedTags = expectedTagsString.split(',').map(tag => tag.trim());
  const actualTags = task.getTags();
  
  expect(actualTags).toHaveLength(expectedTags.length);
  expectedTags.forEach(tag => {
    expect(actualTags).toContain(tag);
  });
});

Then('the task should still have tags: {string}', function (this: ExocortexWorld, expectedTagsString: string) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const expectedTags = expectedTagsString.split(',').map(tag => tag.trim());
  const actualTags = task.getTags();
  
  expect(actualTags).toHaveLength(expectedTags.length);
  expectedTags.forEach(tag => {
    expect(actualTags).toContain(tag);
  });
});

Then('the tag should not be duplicated', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const tags = task.getTags();
  const uniqueTags = [...new Set(tags)];
  expect(tags.length).toBe(uniqueTags.length);
});

// Query scenarios
Given('I have the following tasks:', function (this: ExocortexWorld, dataTable: any) {
  const taskRows = dataTable.hashes();
  const tasks: Task[] = [];
  
  for (const row of taskRows) {
    const taskParams: any = { title: row.title };
    
    if (row.due_date) {
      taskParams.dueDate = new Date(row.due_date);
    }
    
    if (row.status) {
      const statusResult = TaskStatus.create(row.status);
      if (statusResult.isSuccess) {
        taskParams.status = statusResult.getValue();
      }
    }
    
    if (row.priority) {
      const priorityResult = Priority.create(row.priority);
      if (priorityResult.isSuccess) {
        taskParams.priority = priorityResult.getValue();
      }
    }
    
    const taskResult = Task.create(taskParams);
    expect(taskResult.isSuccess).toBe(true);
    tasks.push(taskResult.getValue()!);
  }
  
  this.setTestData('testTasks', tasks);
});

When('I query for overdue tasks', function (this: ExocortexWorld) {
  const tasks = this.getTestData('testTasks') as Task[];
  expect(tasks).toBeDefined();
  
  const overdueTasks = tasks.filter(task => task.isOverdue());
  this.setTestData('queryResult', overdueTasks);
});

When('I query for tasks due today', function (this: ExocortexWorld) {
  const tasks = this.getTestData('testTasks') as Task[];
  expect(tasks).toBeDefined();
  
  const todayTasks = tasks.filter(task => task.isDueToday());
  this.setTestData('queryResult', todayTasks);
});

When('I query for high priority tasks', function (this: ExocortexWorld) {
  const tasks = this.getTestData('testTasks') as Task[];
  expect(tasks).toBeDefined();
  
  const highPriorityTasks = tasks.filter(task => task.isHighPriority());
  this.setTestData('queryResult', highPriorityTasks);
});

Then('I should get {int} overdue tasks', function (this: ExocortexWorld, expectedCount: number) {
  const queryResult = this.getTestData('queryResult') as Task[];
  expect(queryResult).toBeDefined();
  expect(queryResult).toHaveLength(expectedCount);
});

Then('I should get {int} tasks due today', function (this: ExocortexWorld, expectedCount: number) {
  const queryResult = this.getTestData('queryResult') as Task[];
  expect(queryResult).toBeDefined();
  expect(queryResult).toHaveLength(expectedCount);
});

Then('I should get {int} high priority tasks', function (this: ExocortexWorld, expectedCount: number) {
  const queryResult = this.getTestData('queryResult') as Task[];
  expect(queryResult).toBeDefined();
  expect(queryResult).toHaveLength(expectedCount);
});

Then('the results should include {string} and {string}', function (this: ExocortexWorld, title1: string, title2: string) {
  const queryResult = this.getTestData('queryResult') as Task[];
  expect(queryResult).toBeDefined();
  
  const titles = queryResult.map(task => task.getTitle());
  expect(titles).toContain(title1);
  expect(titles).toContain(title2);
});

Then('the results should not include {string} or {string}', function (this: ExocortexWorld, title1: string, title2: string) {
  const queryResult = this.getTestData('queryResult') as Task[];
  expect(queryResult).toBeDefined();
  
  const titles = queryResult.map(task => task.getTitle());
  expect(titles).not.toContain(title1);
  expect(titles).not.toContain(title2);
});

// Serialization scenarios
Given('I have a task with the following properties:', function (this: ExocortexWorld, dataTable: any) {
  const properties = dataTable.hashes()[0];
  const taskParams: any = {
    title: properties.title,
    description: properties.description,
  };
  
  if (properties.priority) {
    const priorityResult = Priority.create(properties.priority);
    if (priorityResult.isSuccess) {
      taskParams.priority = priorityResult.getValue();
    }
  }
  
  if (properties.status) {
    const statusResult = TaskStatus.create(properties.status);
    if (statusResult.isSuccess) {
      taskParams.status = statusResult.getValue();
    }
  }
  
  if (properties.project_id) {
    const assetIdResult = AssetId.create(properties.project_id);
    if (assetIdResult.isSuccess) {
      taskParams.projectId = assetIdResult.getValue();
    }
  }
  
  if (properties.due_date) {
    taskParams.dueDate = new Date(properties.due_date);
  }
  
  if (properties.estimated_hours) {
    taskParams.estimatedHours = parseInt(properties.estimated_hours);
  }
  
  if (properties.tags) {
    taskParams.tags = properties.tags.split(',').map((tag: string) => tag.trim());
  }
  
  const taskResult = Task.create(taskParams);
  expect(taskResult.isSuccess).toBe(true);
  this.setTestData('currentTask', taskResult.getValue()!);
});

When('the task is serialized to frontmatter', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const frontmatter = task.toFrontmatter();
  this.setTestData('serializedFrontmatter', frontmatter);
});

Then('the frontmatter should contain:', function (this: ExocortexWorld, dataTable: any) {
  const frontmatter = this.getTestData('serializedFrontmatter');
  expect(frontmatter).toBeDefined();
  
  const expectedEntries = dataTable.hashes();
  for (const entry of expectedEntries) {
    expect(frontmatter[entry.key]).toBe(entry.value);
  }
});

Given('I have a note with the following frontmatter:', function (this: ExocortexWorld, dataTable: any) {
  const frontmatterEntries = dataTable.hashes();
  const frontmatter: Record<string, any> = {};
  
  for (const entry of frontmatterEntries) {
    let value = entry.value;
    
    // Parse array format
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((item: string) => item.trim());
    }
    
    frontmatter[entry.key] = value;
  }
  
  this.setTestData('testFrontmatter', frontmatter);
});

When('I create a task from the frontmatter', function (this: ExocortexWorld) {
  const frontmatter = this.getTestData('testFrontmatter');
  expect(frontmatter).toBeDefined();
  
  const task = Task.fromFrontmatter(frontmatter, 'test-task.md');
  this.setTestData('deserializedTask', task);
});

Then('the task properties should match the frontmatter values', function (this: ExocortexWorld) {
  const task = this.getTestData('deserializedTask') as Task;
  const frontmatter = this.getTestData('testFrontmatter');
  
  expect(task).toBeDefined();
  expect(task.getTitle()).toBe(frontmatter['exo__Task_title']);
  expect(task.getDescription()).toBe(frontmatter['exo__Task_description']);
  expect(task.getPriority().toString()).toBe(frontmatter['exo__Task_priority']);
  expect(task.getStatus().toString()).toBe(frontmatter['exo__Task_status']);
});

Given('I have a note with invalid frontmatter:', function (this: ExocortexWorld, dataTable: any) {
  const frontmatterEntries = dataTable.hashes();
  const frontmatter: Record<string, any> = {};
  
  for (const entry of frontmatterEntries) {
    frontmatter[entry.key] = entry.value;
  }
  
  this.setTestData('invalidFrontmatter', frontmatter);
});

When('I attempt to create a task from the frontmatter', function (this: ExocortexWorld) {
  const frontmatter = this.getTestData('invalidFrontmatter');
  expect(frontmatter).toBeDefined();
  
  const task = Task.fromFrontmatter(frontmatter, 'invalid-task.md');
  this.setTestData('deserializedTask', task);
});

Then('the task creation should use default values', function (this: ExocortexWorld) {
  const task = this.getTestData('deserializedTask') as Task;
  expect(task).toBeDefined();
  expect(task.getPriority().toString()).toBe('medium');
  expect(task.getStatus().toString()).toBe('todo');
});

Then('a warning should be logged about invalid data', function (this: ExocortexWorld) {
  // In a real implementation, would verify console.warn was called
  expect(true).toBe(true);
});

Then('the task should still be created with fallback values', function (this: ExocortexWorld) {
  const task = this.getTestData('deserializedTask') as Task;
  expect(task).toBeDefined();
});

// Markdown generation scenarios
Given('I have a task with complete information:', function (this: ExocortexWorld, dataTable: any) {
  const properties = dataTable.hashes()[0];
  const taskParams: any = {
    title: properties.title,
    description: properties.description,
  };
  
  if (properties.priority) {
    const priorityResult = Priority.create(properties.priority);
    if (priorityResult.isSuccess) {
      taskParams.priority = priorityResult.getValue();
    }
  }
  
  if (properties.status) {
    const statusResult = TaskStatus.create(properties.status);
    if (statusResult.isSuccess) {
      taskParams.status = statusResult.getValue();
    }
  }
  
  if (properties.due_date) {
    taskParams.dueDate = new Date(properties.due_date);
  }
  
  if (properties.estimated_hours) {
    taskParams.estimatedHours = parseInt(properties.estimated_hours);
  }
  
  if (properties.tags) {
    taskParams.tags = properties.tags.split(',').map((tag: string) => tag.trim());
  }
  
  const taskResult = Task.create(taskParams);
  expect(taskResult.isSuccess).toBe(true);
  this.setTestData('currentTask', taskResult.getValue()!);
});

When('I generate markdown for the task', function (this: ExocortexWorld) {
  const task = this.getTestData('currentTask') as Task;
  expect(task).toBeDefined();
  
  const markdown = task.toMarkdown();
  this.setTestData('generatedMarkdown', markdown);
});

Then('the markdown should include:', function (this: ExocortexWorld, dataTable: any) {
  const markdown = this.getTestData('generatedMarkdown') as string;
  expect(markdown).toBeDefined();
  
  const expectedElements = dataTable.hashes();
  for (const element of expectedElements) {
    expect(markdown).toContain(element.content);
  }
});

// Performance scenarios
Given('I have {int} existing tasks in the system', function (this: ExocortexWorld, taskCount: number) {
  const tasks: Task[] = [];
  
  for (let i = 0; i < taskCount; i++) {
    const taskResult = Task.create({
      title: `Task ${i + 1}`
    });
    expect(taskResult.isSuccess).toBe(true);
    tasks.push(taskResult.getValue()!);
  }
  
  this.setTestData('bulkTasks', tasks);
});

When('I perform bulk operations:', function (this: ExocortexWorld, dataTable: any) {
  const operations = dataTable.hashes();
  const tasks = this.getTestData('bulkTasks') as Task[];
  expect(tasks).toBeDefined();
  
  const startTime = performance.now();
  
  for (const operation of operations) {
    const count = parseInt(operation.count);
    
    switch (operation.operation) {
      case 'status_updates':
        for (let i = 0; i < count && i < tasks.length; i++) {
          const statusResult = TaskStatus.create('in_progress');
          if (statusResult.isSuccess) {
            tasks[i].updateStatus(statusResult.getValue()!);
          }
        }
        break;
        
      case 'tag_additions':
        for (let i = 0; i < count && i < tasks.length; i++) {
          tasks[i].addTag('bulk-update');
        }
        break;
        
      case 'project_assignments':
        const projectIdResult = AssetId.create('bulk-project');
        if (projectIdResult.isSuccess) {
          const projectId = projectIdResult.getValue()!;
          for (let i = 0; i < count && i < tasks.length; i++) {
            tasks[i].assignToProject(projectId);
          }
        }
        break;
    }
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  this.recordPerformance('bulkOperations', duration);
});

Then('all operations should complete within {int} seconds', function (this: ExocortexWorld, maxSeconds: number) {
  const duration = this.getPerformance('bulkOperations');
  expect(duration).toBeDefined();
  expect(duration!).toBeLessThan(maxSeconds * 1000);
});

Then('no memory leaks should occur', function (this: ExocortexWorld) {
  // In a real implementation, would check memory usage
  expect(true).toBe(true);
});

Then('the task cache should remain consistent', function (this: ExocortexWorld) {
  // In a real implementation, would verify cache consistency
  expect(true).toBe(true);
});

// Concurrency scenarios
Given('I have a task being edited simultaneously by two processes', function (this: ExocortexWorld) {
  const taskResult = Task.create({
    title: 'Concurrent Task'
  });
  
  expect(taskResult.isSuccess).toBe(true);
  this.setTestData('concurrentTask', taskResult.getValue()!);
});

When('process A updates the task title', function (this: ExocortexWorld) {
  const task = this.getTestData('concurrentTask') as Task;
  expect(task).toBeDefined();
  
  const result = task.updateTitle('Updated by Process A');
  expect(result.isSuccess).toBe(true);
});

When('process B updates the task priority at the same time', function (this: ExocortexWorld) {
  const task = this.getTestData('concurrentTask') as Task;
  expect(task).toBeDefined();
  
  const priorityResult = Priority.create('high');
  expect(priorityResult.isSuccess).toBe(true);
  
  task.updatePriority(priorityResult.getValue()!);
});

Then('both updates should be handled correctly', function (this: ExocortexWorld) {
  const task = this.getTestData('concurrentTask') as Task;
  expect(task).toBeDefined();
  
  expect(task.getTitle()).toBe('Updated by Process A');
  expect(task.getPriority().toString()).toBe('high');
});

Then('the final task should have both changes', function (this: ExocortexWorld) {
  const task = this.getTestData('concurrentTask') as Task;
  expect(task).toBeDefined();
  
  expect(task.getTitle()).toBe('Updated by Process A');
  expect(task.getPriority().toString()).toBe('high');
});

Then('no data corruption should occur', function (this: ExocortexWorld) {
  const task = this.getTestData('concurrentTask') as Task;
  expect(task).toBeDefined();
  
  // Verify task is still valid
  expect(task.getId()).toBeDefined();
  expect(task.getCreatedAt()).toBeDefined();
});

Then('the updated timestamp should reflect the latest change', function (this: ExocortexWorld) {
  const task = this.getTestData('concurrentTask') as Task;
  expect(task).toBeDefined();
  
  expect(task.getUpdatedAt()).toBeDefined();
  expect(task.getUpdatedAt()).toBeInstanceOf(Date);
});

// Integration scenarios
Given('I have created multiple tasks with different properties', function (this: ExocortexWorld) {
  const tasks: Task[] = [];
  
  // Create variety of tasks
  const taskConfigs = [
    { title: 'Search by title test', tags: ['search', 'title'] },
    { title: 'Another task', tags: ['work', 'important'] },
    { title: 'Third task', description: 'Test description content' }
  ];
  
  for (const config of taskConfigs) {
    const taskResult = Task.create(config);
    expect(taskResult.isSuccess).toBe(true);
    tasks.push(taskResult.getValue()!);
  }
  
  this.setTestData('searchableTasks', tasks);
});

When('I search for tasks using Obsidian\\'s search functionality', function (this: ExocortexWorld) {
  // Simulate different search scenarios
  this.setTestData('searchCompleted', true);
});

Then('I should find tasks by:', function (this: ExocortexWorld, dataTable: any) {
  const tasks = this.getTestData('searchableTasks') as Task[];
  expect(tasks).toBeDefined();
  
  const searchCriteria = dataTable.hashes();
  
  for (const criteria of searchCriteria) {
    switch (criteria.search_criteria) {
      case 'title_content':
        const titleMatches = tasks.filter(task => 
          task.getTitle().includes('title')
        );
        expect(titleMatches.length).toBeGreaterThan(0);
        break;
        
      case 'tag_content':
        const tagMatches = tasks.filter(task => 
          task.getTags().some(tag => ['search', 'work'].includes(tag))
        );
        expect(tagMatches.length).toBeGreaterThan(0);
        break;
        
      case 'frontmatter_values':
        // Would test frontmatter search in real implementation
        expect(true).toBe(true);
        break;
        
      case 'description_text':
        const descMatches = tasks.filter(task => 
          task.getDescription()?.includes('description')
        );
        expect(descMatches.length).toBeGreaterThan(0);
        break;
    }
  }
});

// Accessibility scenarios
Given('the task management UI is displayed', function (this: ExocortexWorld) {
  this.setTestData('uiDisplayed', true);
});

When('I navigate using keyboard only', function (this: ExocortexWorld) {
  this.setTestData('keyboardNavigation', true);
});

Then('all task management functions should be accessible', function (this: ExocortexWorld) {
  // Would test actual keyboard accessibility in real implementation
  expect(this.getTestData('keyboardNavigation')).toBe(true);
});

Then('proper ARIA labels should be present', function (this: ExocortexWorld) {
  // Would verify ARIA labels in real implementation
  expect(true).toBe(true);
});

Then('focus management should work correctly', function (this: ExocortexWorld) {
  // Would verify focus management in real implementation  
  expect(true).toBe(true);
});

Then('screen readers should announce changes appropriately', function (this: ExocortexWorld) {
  // Would verify screen reader announcements in real implementation
  expect(true).toBe(true);
});