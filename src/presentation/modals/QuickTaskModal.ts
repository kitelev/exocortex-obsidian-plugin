import { App, Modal, Setting, Notice } from 'obsidian';
import { CreateTaskFromProjectUseCase } from '../../application/use-cases/CreateTaskFromProjectUseCase';
import { GetCurrentProjectUseCase } from '../../application/use-cases/GetCurrentProjectUseCase';
import { CreateTaskRequest, GetCurrentProjectResponse } from '../../application/dtos/CreateTaskRequest';

/**
 * Modal for quick task creation with project context
 * Provides streamlined UI for creating tasks linked to current project
 */
export class QuickTaskModal extends Modal {
  private taskTitle: string = '';
  private taskDescription: string = '';
  private taskPriority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  private taskStatus: 'todo' | 'in-progress' | 'done' | 'cancelled' = 'todo';
  private taskDueDate: string = '';
  private taskEstimatedHours: number | undefined;
  private taskTags: string[] = [];
  private currentProject: GetCurrentProjectResponse['currentProject'] | undefined;
  private selectedProjectId: string | undefined;
  private availableProjects: GetCurrentProjectResponse['availableProjects'] = [];

  constructor(
    app: App,
    private readonly createTaskUseCase: CreateTaskFromProjectUseCase,
    private readonly getCurrentProjectUseCase: GetCurrentProjectUseCase,
    private readonly activeFile?: string
  ) {
    super(app);
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // Add modal title
    contentEl.createEl('h2', { text: 'Create New Task' });

    // Load current project context
    await this.loadProjectContext();

    // Project selection
    if (this.currentProject) {
      const projectDiv = contentEl.createDiv({ cls: 'quick-task-project' });
      projectDiv.createEl('div', { 
        text: `Project: ${this.currentProject.title}`,
        cls: 'quick-task-project-current'
      });
      this.selectedProjectId = this.currentProject.id;
    }

    // Show available projects if multiple found
    if (this.availableProjects.length > 1) {
      new Setting(contentEl)
        .setName('Project')
        .setDesc('Select the project for this task')
        .addDropdown(dropdown => {
          // Add empty option
          dropdown.addOption('', 'No project');
          
          // Add all available projects
          this.availableProjects.forEach(project => {
            dropdown.addOption(
              project.id,
              project.title
            );
          });

          // Set current selection
          if (this.currentProject) {
            dropdown.setValue(this.currentProject.id);
          }

          dropdown.onChange(value => {
            this.selectedProjectId = value || undefined;
          });
        });
    }

    // Task title
    new Setting(contentEl)
      .setName('Title')
      .setDesc('Enter the task title (required)')
      .addText(text => {
        text.inputEl.addClass('quick-task-title-input');
        text.setPlaceholder('Task title...');
        text.onChange(value => {
          this.taskTitle = value;
        });
        // Focus on title input
        text.inputEl.focus();
        // Select all text for quick replacement
        text.inputEl.select();
      });

    // Task description
    new Setting(contentEl)
      .setName('Description')
      .setDesc('Optional task description')
      .addTextArea(text => {
        text.inputEl.addClass('quick-task-description-input');
        text.setPlaceholder('Task description...');
        text.inputEl.rows = 3;
        text.onChange(value => {
          this.taskDescription = value;
        });
      });

    // Priority and Status row
    const priorityStatusDiv = contentEl.createDiv({ cls: 'quick-task-row' });

    // Priority
    new Setting(priorityStatusDiv)
      .setName('Priority')
      .addDropdown(dropdown => {
        dropdown
          .addOption('low', '🟢 Low')
          .addOption('medium', '🟡 Medium')
          .addOption('high', '🟠 High')
          .addOption('urgent', '🔴 Urgent')
          .setValue(this.taskPriority)
          .onChange(value => {
            this.taskPriority = value as any;
          });
      });

    // Status
    new Setting(priorityStatusDiv)
      .setName('Status')
      .addDropdown(dropdown => {
        dropdown
          .addOption('todo', '📋 Todo')
          .addOption('in-progress', '🔄 In Progress')
          .addOption('done', '✅ Done')
          .addOption('cancelled', '❌ Cancelled')
          .setValue(this.taskStatus)
          .onChange(value => {
            this.taskStatus = value as any;
          });
      });

    // Due date and estimated hours row
    const dateHoursDiv = contentEl.createDiv({ cls: 'quick-task-row' });

    // Due date
    new Setting(dateHoursDiv)
      .setName('Due Date')
      .addText(text => {
        text.inputEl.type = 'date';
        text.onChange(value => {
          this.taskDueDate = value;
        });
        // Set default to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        text.setValue(tomorrow.toISOString().split('T')[0]);
        this.taskDueDate = tomorrow.toISOString().split('T')[0];
      });

    // Estimated hours
    new Setting(dateHoursDiv)
      .setName('Est. Hours')
      .addText(text => {
        text.inputEl.type = 'number';
        text.inputEl.min = '0';
        text.inputEl.step = '0.5';
        text.setPlaceholder('0');
        text.onChange(value => {
          const hours = parseFloat(value);
          this.taskEstimatedHours = isNaN(hours) ? undefined : hours;
        });
      });

    // Tags
    new Setting(contentEl)
      .setName('Tags')
      .setDesc('Enter tags separated by commas')
      .addText(text => {
        text.inputEl.addClass('quick-task-tags-input');
        text.setPlaceholder('tag1, tag2, tag3');
        text.onChange(value => {
          this.taskTags = value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        });
      });

    // Action buttons
    const buttonDiv = contentEl.createDiv({ cls: 'quick-task-buttons' });

    // Create button
    const createBtn = buttonDiv.createEl('button', {
      text: 'Create Task',
      cls: 'mod-cta'
    });
    createBtn.addEventListener('click', async () => {
      await this.createTask();
    });

    // Create and continue button
    const createContinueBtn = buttonDiv.createEl('button', {
      text: 'Create & Continue',
      cls: 'mod-primary'
    });
    createContinueBtn.addEventListener('click', async () => {
      const success = await this.createTask();
      if (success) {
        // Clear form for next task
        this.resetForm();
        // Reopen modal
        this.onOpen();
      }
    });

    // Cancel button
    const cancelBtn = buttonDiv.createEl('button', {
      text: 'Cancel'
    });
    cancelBtn.addEventListener('click', () => {
      this.close();
    });

    // Add styles
    this.addStyles();

    // Handle Enter key to create task
    contentEl.addEventListener('keydown', async (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        await this.createTask();
      }
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Load current project context
   */
  private async loadProjectContext() {
    try {
      const response = await this.getCurrentProjectUseCase.execute({
        activeFile: this.activeFile,
        preferences: {
          includeCompleted: false,
          maxResults: 10,
          selectionStrategy: 'context'
        }
      });

      if (response.success && response.currentProject) {
        this.currentProject = response.currentProject;
      }

      if (response.availableProjects && response.availableProjects.length > 0) {
        this.availableProjects = response.availableProjects;
      }
    } catch (error) {
      console.error('Failed to load project context:', error);
    }
  }

  /**
   * Create the task
   */
  private async createTask(): Promise<boolean> {
    // Validate required fields
    if (!this.taskTitle || this.taskTitle.trim().length === 0) {
      new Notice('Task title is required');
      return false;
    }

    try {
      // Build request
      const request: CreateTaskRequest = {
        title: this.taskTitle.trim(),
        description: this.taskDescription.trim() || undefined,
        priority: this.taskPriority,
        status: this.taskStatus,
        projectId: this.selectedProjectId,
        dueDate: this.taskDueDate || undefined,
        estimatedHours: this.taskEstimatedHours,
        tags: this.taskTags,
        context: {
          activeFile: this.activeFile
        }
      };

      // Execute use case
      const response = await this.createTaskUseCase.execute(request);

      if (response.success) {
        new Notice(`Task "${response.task?.title}" created successfully`);
        this.close();
        return true;
      } else {
        new Notice(`Failed to create task: ${response.message}`);
        console.error('Task creation failed:', response.errors);
        return false;
      }
    } catch (error) {
      new Notice(`Error creating task: ${error.message}`);
      console.error('Task creation error:', error);
      return false;
    }
  }

  /**
   * Reset form fields
   */
  private resetForm() {
    this.taskTitle = '';
    this.taskDescription = '';
    this.taskPriority = 'medium';
    this.taskStatus = 'todo';
    this.taskDueDate = '';
    this.taskEstimatedHours = undefined;
    this.taskTags = [];
    // Keep project context
  }

  /**
   * Add custom styles
   */
  private addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .quick-task-project {
        padding: 10px;
        margin-bottom: 15px;
        background: var(--background-secondary);
        border-radius: 5px;
      }

      .quick-task-project-current {
        font-weight: bold;
        color: var(--text-accent);
      }

      .quick-task-row {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
      }

      .quick-task-row .setting-item {
        flex: 1;
        margin-bottom: 0;
      }

      .quick-task-title-input {
        font-size: 1.1em;
        font-weight: bold;
      }

      .quick-task-description-input {
        font-family: var(--font-monospace);
        min-height: 60px;
      }

      .quick-task-tags-input {
        font-family: var(--font-monospace);
      }

      .quick-task-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid var(--background-modifier-border);
      }

      .quick-task-buttons button {
        padding: 8px 16px;
      }
    `;
    document.head.appendChild(style);
  }
}