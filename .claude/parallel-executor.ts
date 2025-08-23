/**
 * Intelligent Parallel Execution Engine for Claude Code
 * Implements dependency-aware task scheduling and load balancing
 */

interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  estimatedDuration: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  resourceRequirements: {
    cpu: number;
    memory: number;
    io: boolean;
  };
}

interface ExecutionNode {
  id: string;
  agent: string;
  task: () => Promise<any>;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  result?: any;
  error?: Error;
}

export class IntelligentParallelExecutor {
  private executionGraph = new Map<string, ExecutionNode>();
  private runningTasks = new Map<string, Promise<any>>();
  private completedTasks = new Set<string>();
  private maxConcurrency: number;
  private resourcePool: {
    availableCPU: number;
    availableMemory: number;
    ioSlotsAvailable: number;
  };

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency;
    this.resourcePool = {
      availableCPU: 8, // Assume 8 CPU cores
      availableMemory: 8192, // 8GB memory in MB
      ioSlotsAvailable: 3 // Max 3 concurrent IO operations
    };
  }

  // Optimize task execution order based on dependencies and resources
  async executeTaskGraph(tasks: TaskDependency[]): Promise<Map<string, any>> {
    console.log(`🔄 Executing ${tasks.length} tasks with intelligent scheduling...`);
    
    // Build execution graph
    this.buildExecutionGraph(tasks);
    
    // Execute tasks with dependency resolution
    const results = await this.executeDependencyAwareScheduling();
    
    // Generate performance report
    this.generateExecutionReport();
    
    return results;
  }

  private buildExecutionGraph(tasks: TaskDependency[]): void {
    for (const task of tasks) {
      const node: ExecutionNode = {
        id: task.taskId,
        agent: this.selectOptimalAgent(task),
        task: this.createTaskExecutor(task),
        dependencies: task.dependsOn,
        status: 'pending'
      };
      
      this.executionGraph.set(task.taskId, node);
    }
  }

  private async executeDependencyAwareScheduling(): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    while (this.hasRemainingTasks()) {
      // Find tasks ready to execute (dependencies satisfied)
      const readyTasks = this.findReadyTasks();
      
      // Sort by priority and resource efficiency
      const prioritizedTasks = this.prioritizeTasks(readyTasks);
      
      // Execute tasks within resource constraints
      const executionPromises = this.executeWithResourceConstraints(prioritizedTasks);
      
      // Wait for any task to complete
      if (executionPromises.length > 0) {
        const completed = await Promise.race(executionPromises);
        const completedNode = this.executionGraph.get(completed.taskId)!;
        
        // Update task status and free resources
        this.handleTaskCompletion(completedNode, completed.result);
        results.set(completed.taskId, completed.result);
        
        // Remove from running tasks
        this.runningTasks.delete(completed.taskId);
      }
      
      // Brief yield to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return results;
  }

  private findReadyTasks(): ExecutionNode[] {
    const readyTasks: ExecutionNode[] = [];
    
    for (const [taskId, node] of this.executionGraph) {
      if (node.status === 'pending' && this.areDependenciesSatisfied(node)) {
        readyTasks.push(node);
      }
    }
    
    return readyTasks;
  }

  private areDependenciesSatisfied(node: ExecutionNode): boolean {
    return node.dependencies.every(depId => this.completedTasks.has(depId));
  }

  private prioritizeTasks(tasks: ExecutionNode[]): ExecutionNode[] {
    return tasks.sort((a, b) => {
      // Priority weights: critical=4, high=3, medium=2, low=1
      const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
      
      const taskA = this.getTaskDependency(a.id);
      const taskB = this.getTaskDependency(b.id);
      
      if (!taskA || !taskB) return 0;
      
      // Sort by priority first, then by estimated duration (shorter first)
      const priorityDiff = priorityWeights[taskB.priority] - priorityWeights[taskA.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return taskA.estimatedDuration - taskB.estimatedDuration;
    });
  }

  private executeWithResourceConstraints(tasks: ExecutionNode[]): Promise<{taskId: string, result: any}>[] {
    const executionPromises: Promise<{taskId: string, result: any}>[] = [];
    
    for (const task of tasks) {
      // Check if we have available slots and resources
      if (this.runningTasks.size >= this.maxConcurrency) {
        break;
      }
      
      const taskDep = this.getTaskDependency(task.id);
      if (!taskDep || !this.canAllocateResources(taskDep.resourceRequirements)) {
        continue;
      }
      
      // Allocate resources and start task
      this.allocateResources(taskDep.resourceRequirements);
      task.status = 'running';
      task.startTime = Date.now();
      
      const taskPromise = task.task()
        .then(result => {
          this.freeResources(taskDep.resourceRequirements);
          return { taskId: task.id, result };
        })
        .catch(error => {
          this.freeResources(taskDep.resourceRequirements);
          task.error = error;
          task.status = 'failed';
          throw { taskId: task.id, error };
        });
      
      this.runningTasks.set(task.id, taskPromise);
      executionPromises.push(taskPromise);
    }
    
    return executionPromises;
  }

  private canAllocateResources(requirements: TaskDependency['resourceRequirements']): boolean {
    return (
      this.resourcePool.availableCPU >= requirements.cpu &&
      this.resourcePool.availableMemory >= requirements.memory &&
      (!requirements.io || this.resourcePool.ioSlotsAvailable > 0)
    );
  }

  private allocateResources(requirements: TaskDependency['resourceRequirements']): void {
    this.resourcePool.availableCPU -= requirements.cpu;
    this.resourcePool.availableMemory -= requirements.memory;
    if (requirements.io) {
      this.resourcePool.ioSlotsAvailable--;
    }
  }

  private freeResources(requirements: TaskDependency['resourceRequirements']): void {
    this.resourcePool.availableCPU += requirements.cpu;
    this.resourcePool.availableMemory += requirements.memory;
    if (requirements.io) {
      this.resourcePool.ioSlotsAvailable++;
    }
  }

  private handleTaskCompletion(node: ExecutionNode, result: any): void {
    node.status = 'completed';
    node.endTime = Date.now();
    node.result = result;
    this.completedTasks.add(node.id);
  }

  private hasRemainingTasks(): boolean {
    return Array.from(this.executionGraph.values()).some(
      node => node.status === 'pending' || node.status === 'running'
    );
  }

  private selectOptimalAgent(task: TaskDependency): string {
    // Select agent based on task characteristics
    const taskId = task.taskId.toLowerCase();
    
    if (taskId.includes('search') || taskId.includes('find')) {
      return 'code-searcher';
    }
    if (taskId.includes('test') || taskId.includes('qa')) {
      return 'qa-engineer';
    }
    if (taskId.includes('performance') || taskId.includes('optimize')) {
      return 'performance-agent';
    }
    if (taskId.includes('error') || taskId.includes('debug')) {
      return 'error-handler';
    }
    
    return 'orchestrator'; // Default agent
  }

  private createTaskExecutor(task: TaskDependency): () => Promise<any> {
    return async () => {
      // Simulate agent execution with realistic timing
      const executionTime = task.estimatedDuration + (Math.random() * 100 - 50);
      await new Promise(resolve => setTimeout(resolve, executionTime));
      
      return {
        taskId: task.taskId,
        agent: this.selectOptimalAgent(task),
        executionTime,
        result: `Completed ${task.taskId}`,
        timestamp: new Date().toISOString()
      };
    };
  }

  private getTaskDependency(taskId: string): TaskDependency | undefined {
    // In real implementation, this would retrieve from task registry
    return {
      taskId,
      dependsOn: [],
      estimatedDuration: 500,
      priority: 'medium',
      resourceRequirements: { cpu: 1, memory: 512, io: false }
    };
  }

  private generateExecutionReport(): void {
    const nodes = Array.from(this.executionGraph.values());
    const completedNodes = nodes.filter(n => n.status === 'completed');
    
    const totalTime = Math.max(...completedNodes.map(n => n.endTime! - n.startTime!));
    const parallelEfficiency = completedNodes.length > 1 
      ? (completedNodes.reduce((sum, n) => sum + (n.endTime! - n.startTime!), 0) / totalTime) / completedNodes.length
      : 1.0;
    
    console.log(`📊 Execution Report:`);
    console.log(`   Total tasks: ${nodes.length}`);
    console.log(`   Completed: ${completedNodes.length}`);
    console.log(`   Failed: ${nodes.filter(n => n.status === 'failed').length}`);
    console.log(`   Total execution time: ${totalTime}ms`);
    console.log(`   Parallel efficiency: ${(parallelEfficiency * 100).toFixed(1)}%`);
  }

  // Factory method for common execution patterns
  static createOptimalExecutionPlan(taskType: 'feature' | 'bug' | 'analysis' | 'emergency'): TaskDependency[] {
    switch (taskType) {
      case 'feature':
        return [
          {
            taskId: 'requirements-analysis',
            dependsOn: [],
            estimatedDuration: 800,
            priority: 'high',
            resourceRequirements: { cpu: 1, memory: 256, io: false }
          },
          {
            taskId: 'architecture-design',
            dependsOn: ['requirements-analysis'],
            estimatedDuration: 1200,
            priority: 'high',
            resourceRequirements: { cpu: 2, memory: 512, io: false }
          },
          {
            taskId: 'implementation',
            dependsOn: ['architecture-design'],
            estimatedDuration: 2000,
            priority: 'medium',
            resourceRequirements: { cpu: 2, memory: 1024, io: true }
          },
          {
            taskId: 'testing',
            dependsOn: ['implementation'],
            estimatedDuration: 1500,
            priority: 'medium',
            resourceRequirements: { cpu: 1, memory: 512, io: true }
          }
        ];

      case 'bug':
        return [
          {
            taskId: 'error-analysis',
            dependsOn: [],
            estimatedDuration: 400,
            priority: 'critical',
            resourceRequirements: { cpu: 1, memory: 256, io: false }
          },
          {
            taskId: 'code-search',
            dependsOn: [],
            estimatedDuration: 300,
            priority: 'high',
            resourceRequirements: { cpu: 1, memory: 512, io: true }
          },
          {
            taskId: 'root-cause-analysis',
            dependsOn: ['error-analysis', 'code-search'],
            estimatedDuration: 600,
            priority: 'critical',
            resourceRequirements: { cpu: 2, memory: 512, io: false }
          },
          {
            taskId: 'fix-implementation',
            dependsOn: ['root-cause-analysis'],
            estimatedDuration: 800,
            priority: 'critical',
            resourceRequirements: { cpu: 1, memory: 256, io: true }
          }
        ];

      case 'emergency':
        return [
          {
            taskId: 'system-stabilization',
            dependsOn: [],
            estimatedDuration: 200,
            priority: 'critical',
            resourceRequirements: { cpu: 4, memory: 1024, io: true }
          },
          {
            taskId: 'error-containment',
            dependsOn: [],
            estimatedDuration: 300,
            priority: 'critical',
            resourceRequirements: { cpu: 2, memory: 512, io: false }
          },
          {
            taskId: 'rapid-diagnosis',
            dependsOn: ['system-stabilization'],
            estimatedDuration: 400,
            priority: 'critical',
            resourceRequirements: { cpu: 3, memory: 768, io: true }
          }
        ];

      default:
        return [];
    }
  }
}

// Export singleton
export const parallelExecutor = new IntelligentParallelExecutor();