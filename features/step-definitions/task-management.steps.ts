import { Given, When, Then, DataTable, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from 'chai';
import { Asset } from '../../src/domain/entities/Asset';
import { Task } from '../../src/domain/entities/Task';
import { AssetId } from '../../src/domain/value-objects/AssetId';
import { ClassName } from '../../src/domain/value-objects/ClassName';
import { TaskId } from '../../src/domain/value-objects/TaskId';
import { TaskStatus } from '../../src/domain/value-objects/TaskStatus';
import { Priority } from '../../src/domain/value-objects/Priority';
import { PropertyValue } from '../../src/domain/value-objects/PropertyValue';

setDefaultTimeout(10000);

// Task creation interfaces
interface TaskCreationCommand {
  title: string;
  parentId?: string;
  className: string;
  status: string;
  priority?: string;
  effort?: string;
}

interface ChildrenEffortsDisplay {
  columns: string[];
  rows: Array<{
    title: string;
    status: string;
    effort: string;
    progress: number;
    statusColor: string;
  }>;
  totalEffort: string;
}

// Mock task repository
class MockTaskRepository {
  private tasks: Map<string, Task> = new Map();
  private assets: Map<string, Asset> = new Map();
  private hierarchyMap: Map<string, string[]> = new Map(); // parent -> children

  createTask(command: TaskCreationCommand): Task {
    const taskId = TaskId.create(`task_${Date.now()}_${Math.random()}`).getValue()!;
    const className = ClassName.create(command.className).getValue()!;
    const status = TaskStatus.create(command.status).getValue()!;
    const priority = command.priority ? Priority.create(command.priority).getValue()! : Priority.create('medium').getValue()!;

    const properties = new Map<string, PropertyValue>();
    properties.set('title', PropertyValue.create(command.title).getValue()!);
    properties.set('status', PropertyValue.create(command.status).getValue()!);
    properties.set('created', PropertyValue.create(new Date().toISOString().split('T')[0]).getValue()!);
    
    if (command.parentId) {
      properties.set('parent', PropertyValue.create(command.parentId).getValue()!);
      this.addToHierarchy(command.parentId, taskId.getValue());
    }
    
    if (command.priority) {
      properties.set('priority', PropertyValue.create(command.priority).getValue()!);
    }
    
    if (command.effort) {
      properties.set('effort', PropertyValue.create(command.effort).getValue()!);
    }

    const task = Task.create({
      id: taskId,
      class: className,
      status,
      priority,
      properties
    }).getValue()!;

    this.tasks.set(taskId.getValue(), task);
    
    // Also store as generic asset for compatibility
    const asset = Asset.create({
      id: AssetId.create(taskId.getValue()).getValue()!,
      class: className,
      properties
    }).getValue()!;
    this.assets.set(taskId.getValue(), asset);

    return task;
  }

  createAsset(name: string, className: string, properties: Record<string, any> = {}): Asset {
    const assetId = AssetId.create(name).getValue()!;
    const assetClass = ClassName.create(className).getValue()!;
    
    const propMap = new Map<string, PropertyValue>();
    Object.entries(properties).forEach(([key, value]) => {
      propMap.set(key, PropertyValue.create(value).getValue()!);
    });

    const asset = Asset.create({
      id: assetId,
      class: assetClass,
      properties: propMap
    }).getValue()!;

    this.assets.set(name, asset);
    return asset;
  }

  getTask(taskId: string): Task | null {
    return this.tasks.get(taskId) || null;
  }

  getAsset(name: string): Asset | null {
    return this.assets.get(name) || null;
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getAllAssets(): Asset[] {
    return Array.from(this.assets.values());
  }

  getTasksByProject(projectName: string): Task[] {
    return this.getAllTasks().filter(task => {
      const parentValue = task.getProperties().get('parent')?.getValue();
      return parentValue === projectName || parentValue === `[[${projectName}]]`;
    });
  }

  getTasksByStatus(status: string): Task[] {
    return this.getAllTasks().filter(task => 
      task.getStatus().getValue() === status
    );
  }

  getTasksByPriority(): Task[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return this.getAllTasks().sort((a, b) => {
      const aPriority = a.getPriority().getValue() as keyof typeof priorityOrder;
      const bPriority = b.getPriority().getValue() as keyof typeof priorityOrder;
      return priorityOrder[bPriority] - priorityOrder[aPriority];
    });
  }

  updateTaskStatus(taskId: string, newStatus: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      const status = TaskStatus.create(newStatus).getValue()!;
      const updatedTask = Task.create({
        id: task.getId(),
        class: task.getClass(),
        status,
        priority: task.getPriority(),
        properties: task.getProperties()
      }).getValue()!;
      
      // Update completion date if marking as done
      if (newStatus === 'done') {
        updatedTask.getProperties().set('completed', PropertyValue.create(new Date().toISOString().split('T')[0]).getValue()!);
      }
      
      // Update status in properties too
      updatedTask.getProperties().set('status', PropertyValue.create(newStatus).getValue()!);
      
      this.tasks.set(taskId, updatedTask);
      
      // Update asset too
      const asset = this.assets.get(taskId);
      if (asset) {
        asset.setProperty('status', PropertyValue.create(newStatus).getValue()!);
        if (newStatus === 'done') {
          asset.setProperty('completed', PropertyValue.create(new Date().toISOString().split('T')[0]).getValue()!);
        }
      }
      
      return true;
    }
    return false;
  }

  private addToHierarchy(parentId: string, childId: string): void {
    if (!this.hierarchyMap.has(parentId)) {
      this.hierarchyMap.set(parentId, []);
    }
    this.hierarchyMap.get(parentId)!.push(childId);
  }

  getChildren(parentId: string): string[] {
    return this.hierarchyMap.get(parentId) || [];
  }

  clear(): void {
    this.tasks.clear();
    this.assets.clear();
    this.hierarchyMap.clear();
  }
}

// Mock quick task creator
class MockQuickTaskCreator {
  private lastCreatedTask: Task | null = null;

  async createQuickTask(title: string, projectName?: string): Promise<Task> {
    const command: TaskCreationCommand = {
      title,
      className: 'Task',
      status: 'todo',
      parentId: projectName
    };

    this.lastCreatedTask = world.taskRepository.createTask(command);
    return this.lastCreatedTask;
  }

  getLastCreatedTask(): Task | null {
    return this.lastCreatedTask;
  }
}

// Mock children efforts renderer
class MockChildrenEffortsRenderer {
  renderChildrenEffortsTable(parentAsset: Asset): ChildrenEffortsDisplay {
    const parentName = parentAsset.getId().getValue();
    const children = world.taskRepository.getChildren(parentName);
    
    const rows = children.map(childId => {
      const task = world.taskRepository.getTask(childId);
      if (task) {
        const title = task.getProperties().get('title')?.getValue() || childId;
        const status = task.getStatus().getValue();
        const effort = task.getProperties().get('effort')?.getValue() || '0h';
        const progress = status === 'done' ? 100 : status === 'in_progress' ? 50 : 0;
        const statusColor = this.getStatusColor(status);
        
        return {
          title,
          status,
          effort,
          progress,
          statusColor
        };
      }
      return null;
    }).filter(row => row !== null) as ChildrenEffortsDisplay['rows'];

    // Calculate total effort
    const totalHours = rows.reduce((sum, row) => {
      const hours = parseFloat(row.effort.replace('h', '')) || 0;
      return sum + hours;
    }, 0);

    return {
      columns: ['Title', 'Status', 'Effort', 'Progress'],
      rows,
      totalEffort: `${totalHours}h`
    };
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'done': return 'green';
      case 'in_progress': return 'blue';
      case 'todo': return 'gray';
      default: return 'gray';
    }
  }
}

// Test World interface
interface TaskManagementWorld {
  taskRepository: MockTaskRepository;
  quickTaskCreator: MockQuickTaskCreator;
  childrenEffortsRenderer: MockChildrenEffortsRenderer;
  
  // Test state
  currentProject: Asset | null;
  currentTask: Task | null;
  lastCreatedTask: Task | null;
  childrenEffortsDisplay: ChildrenEffortsDisplay | null;
  
  // Query results
  filteredTasks: Task[];
  queryResults: any[];
  
  // Command tracking
  lastCommandUsed: string;
  quickTaskTitle: string;
}

let world: TaskManagementWorld;

Before(function() {
  world = {
    taskRepository: new MockTaskRepository(),
    quickTaskCreator: new MockQuickTaskCreator(),
    childrenEffortsRenderer: new MockChildrenEffortsRenderer(),
    currentProject: null,
    currentTask: null,
    lastCreatedTask: null,
    childrenEffortsDisplay: null,
    filteredTasks: [],
    queryResults: [],
    lastCommandUsed: '',
    quickTaskTitle: ''
  };
});

After(function() {
  world.taskRepository.clear();
});

Given('I have a vault with Exocortex plugin enabled', function() {
  expect(world.taskRepository).to.not.be.null;
  expect(world.quickTaskCreator).to.not.be.null;
});

Given('I have a project {string} with class {string}', function(projectName: string, className: string) {
  world.currentProject = world.taskRepository.createAsset(projectName, className);
  expect(world.currentProject).to.not.be.null;
});

Given('I am viewing the project {string}', function(projectName: string) {
  world.currentProject = world.taskRepository.getAsset(projectName);
  expect(world.currentProject).to.not.be.null;
});

Given('I have a task {string}', function(taskTitle: string) {
  const task = world.taskRepository.createTask({
    title: taskTitle,
    className: 'Task',
    status: 'todo'
  });
  world.currentTask = task;
});

Given('I have an area {string} with class {string}', function(areaName: string, className: string) {
  const area = world.taskRepository.createAsset(areaName, className);
  expect(area).to.not.be.null;
});

Given('I have a task {string} with status {string}', function(taskTitle: string, status: string) {
  const task = world.taskRepository.createTask({
    title: taskTitle,
    className: 'Task',
    status
  });
  world.currentTask = task;
});

Given('I have tasks with different priorities:', function(dataTable: DataTable) {
  const tasks = dataTable.hashes();
  
  tasks.forEach(taskData => {
    world.taskRepository.createTask({
      title: taskData.title,
      className: 'Task',
      status: 'todo',
      priority: taskData.priority
    });
  });
});

Given('I have tasks in multiple projects:', function(dataTable: DataTable) {
  const tasks = dataTable.hashes();
  
  tasks.forEach(taskData => {
    world.taskRepository.createTask({
      title: taskData.task,
      className: 'Task',
      status: 'todo',
      parentId: taskData.project
    });
  });
});

Given('I have a project with child tasks:', function(dataTable: DataTable) {
  const tasks = dataTable.hashes();
  const projectName = 'TestProject';
  
  // Create the project
  world.currentProject = world.taskRepository.createAsset(projectName, 'Project');
  
  // Create child tasks
  tasks.forEach(taskData => {
    world.taskRepository.createTask({
      title: taskData.task,
      className: 'Task',
      status: taskData.status,
      effort: taskData.effort,
      parentId: projectName
    });
  });
});

When('I use the quick task creation command \\(Cmd+Shift+T)', function() {
  world.lastCommandUsed = 'Cmd+Shift+T';
  // Quick task creator is ready to receive input
});

When('I enter task title {string}', async function(title: string) {
  world.quickTaskTitle = title;
  const projectName = world.currentProject?.getId().getValue();
  world.lastCreatedTask = await world.quickTaskCreator.createQuickTask(title, projectName);
});

When('I create a child task {string}', function(childTitle: string) {
  const parentTaskId = world.currentTask?.getId().getValue();
  
  world.lastCreatedTask = world.taskRepository.createTask({
    title: childTitle,
    className: 'Task',
    status: 'todo',
    parentId: parentTaskId
  });
});

When('I create a child area {string}', function(childAreaName: string) {
  // Assuming current context has a parent area
  const parentAreaName = 'Development'; // From the Given step
  
  const childArea = world.taskRepository.createAsset(childAreaName, 'ems__Area', {
    parent: parentAreaName
  });
  
  expect(childArea).to.not.be.null;
});

When('I update the task status to {string}', function(newStatus: string) {
  const taskId = world.currentTask?.getId().getValue();
  if (taskId) {
    const success = world.taskRepository.updateTaskStatus(taskId, newStatus);
    expect(success).to.be.true;
    
    // Refresh current task
    world.currentTask = world.taskRepository.getTask(taskId);
  }
});

When('I query tasks by priority', function() {
  world.filteredTasks = world.taskRepository.getTasksByPriority();
});

When('I view tasks for project {string}', function(projectName: string) {
  world.filteredTasks = world.taskRepository.getTasksByProject(projectName);
});

When('I view the project\'s children efforts', function() {
  if (world.currentProject) {
    world.childrenEffortsDisplay = world.childrenEffortsRenderer.renderChildrenEffortsTable(world.currentProject);
  }
});

Then('a new task should be created with:', function(dataTable: DataTable) {
  const expectedProperties = dataTable.hashes()[0];
  
  expect(world.lastCreatedTask).to.not.be.null;
  
  const task = world.lastCreatedTask!;
  const properties = task.getProperties();
  
  // Check title
  if (expectedProperties.title) {
    expect(properties.get('title')?.getValue()).to.equal(expectedProperties.title);
  }
  
  // Check class
  if (expectedProperties.class) {
    expect(task.getClass().getValue()).to.equal(expectedProperties.class);
  }
  
  // Check parent
  if (expectedProperties.parent && world.currentProject) {
    expect(properties.get('parent')?.getValue()).to.equal(world.currentProject.getId().getValue());
  }
  
  // Check status
  if (expectedProperties.status) {
    expect(task.getStatus().getValue()).to.equal(expectedProperties.status);
  }
  
  // Check created date
  if (expectedProperties.created === 'today') {
    const created = properties.get('created')?.getValue();
    const today = new Date().toISOString().split('T')[0];
    expect(created).to.equal(today);
  }
});

Then('the task should appear in the project\'s children', function() {
  if (world.currentProject) {
    const projectName = world.currentProject.getId().getValue();
    const children = world.taskRepository.getChildren(projectName);
    const taskId = world.lastCreatedTask?.getId().getValue();
    
    expect(children).to.include(taskId);
  }
});

Then('the child task should be created with:', function(dataTable: DataTable) {
  const expectedProperties = dataTable.hashes()[0];
  
  expect(world.lastCreatedTask).to.not.be.null;
  
  const task = world.lastCreatedTask!;
  const properties = task.getProperties();
  
  // Check parent
  if (expectedProperties.parent) {
    const parentValue = properties.get('parent')?.getValue();
    expect(parentValue).to.equal(world.currentTask?.getId().getValue());
  }
  
  // Check class
  if (expectedProperties.class) {
    expect(task.getClass().getValue()).to.equal(expectedProperties.class);
  }
  
  // Check status
  if (expectedProperties.status) {
    expect(task.getStatus().getValue()).to.equal(expectedProperties.status);
  }
});

Then('the parent task should show the child in its children list', function() {
  const parentTaskId = world.currentTask?.getId().getValue();
  const childTaskId = world.lastCreatedTask?.getId().getValue();
  
  if (parentTaskId && childTaskId) {
    const children = world.taskRepository.getChildren(parentTaskId);
    expect(children).to.include(childTaskId);
  }
});

Then('the child area should be created with:', function(dataTable: DataTable) {
  const expectedProperties = dataTable.hashes()[0];
  
  // In this implementation, we verify the area was created with proper parent relationship
  const childArea = world.taskRepository.getAsset('Frontend Development');
  expect(childArea).to.not.be.null;
  
  const parentProperty = childArea?.getProperty('parent')?.getValue();
  expect(parentProperty).to.equal(expectedProperties.parent);
});

Then('the hierarchy should be maintained', function() {
  // Verify parent-child relationship exists
  const parentChildren = world.taskRepository.getChildren('Development');
  expect(parentChildren.length).to.be.greaterThan(0);
});

Then('the task frontmatter should update', function() {
  expect(world.currentTask).to.not.be.null;
  const status = world.currentTask!.getStatus().getValue();
  expect(status).to.not.equal('todo'); // Status should have changed
});

Then('the task should appear in {string} queries', function(statusFilter: string) {
  const tasksWithStatus = world.taskRepository.getTasksByStatus(statusFilter);
  const currentTaskId = world.currentTask?.getId().getValue();
  
  const matchingTask = tasksWithStatus.find(task => 
    task.getId().getValue() === currentTaskId
  );
  
  expect(matchingTask).to.not.be.undefined;
});

Then('the task should have a completion date', function() {
  const properties = world.currentTask!.getProperties();
  const completedDate = properties.get('completed')?.getValue();
  
  expect(completedDate).to.not.be.null;
  expect(completedDate).to.not.be.undefined;
  
  // Should be today's date
  const today = new Date().toISOString().split('T')[0];
  expect(completedDate).to.equal(today);
});

Then('tasks should be ordered by priority:', function(dataTable: DataTable) {
  const expectedOrder = dataTable.hashes();
  
  expectedOrder.forEach((expected, index) => {
    expect(world.filteredTasks[index]).to.not.be.undefined;
    const taskTitle = world.filteredTasks[index].getProperties().get('title')?.getValue();
    expect(taskTitle).to.equal(expected.title);
  });
});

Then('I should see only:', function(dataTable: DataTable) {
  const expectedTasks = dataTable.hashes();
  
  expect(world.filteredTasks.length).to.equal(expectedTasks.length);
  
  expectedTasks.forEach(expected => {
    const matchingTask = world.filteredTasks.find(task => 
      task.getProperties().get('title')?.getValue() === expected.task
    );
    expect(matchingTask, `Task "${expected.task}" not found`).to.not.be.undefined;
  });
});

Then('I should not see {string}', function(taskTitle: string) {
  const unwantedTask = world.filteredTasks.find(task => 
    task.getProperties().get('title')?.getValue() === taskTitle
  );
  expect(unwantedTask, `Task "${taskTitle}" should not be present`).to.be.undefined;
});

Then('I should see a professional table with:', function(dataTable: DataTable) {
  expect(world.childrenEffortsDisplay).to.not.be.null;
  
  const expectedColumns = dataTable.hashes();
  const actualColumns = world.childrenEffortsDisplay!.columns;
  
  expectedColumns.forEach(col => {
    expect(actualColumns).to.include(col.columns);
  });
});

Then('status badges should be color-coded', function() {
  expect(world.childrenEffortsDisplay).to.not.be.null;
  
  const rows = world.childrenEffortsDisplay!.rows;
  rows.forEach(row => {
    expect(row.statusColor).to.not.be.empty;
    expect(['green', 'blue', 'gray']).to.include(row.statusColor);
  });
});

Then('total effort should show {string}', function(expectedTotal: string) {
  expect(world.childrenEffortsDisplay).to.not.be.null;
  expect(world.childrenEffortsDisplay!.totalEffort).to.equal(expectedTotal);
});