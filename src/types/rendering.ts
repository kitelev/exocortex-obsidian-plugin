/**
 * TypeScript type definitions for rendering and UI systems
 */

import { ObsidianFile, DataviewApi } from './obsidian';
import { PropertyValue, FrontmatterData, ConfigData } from './properties';

export interface RenderContext {
  file: ObsidianFile;
  frontmatter: FrontmatterData;
  config: ConfigData;
  dataviewApi?: DataviewApi;
  container: HTMLElement;
}

export interface BlockRenderer {
  render(context: RenderContext): Promise<void> | void;
  canRender?(context: RenderContext): boolean;
  priority?: number;
}

export interface LegacyRenderer {
  render(
    container: HTMLElement, 
    config: ConfigData, 
    file: ObsidianFile, 
    dv?: DataviewApi
  ): Promise<void> | void;
}

export interface ButtonContext {
  file?: ObsidianFile;
  properties?: Record<string, PropertyValue>;
  metadata?: FrontmatterData;
  [key: string]: unknown;
}

export interface ButtonCommand {
  id: string;
  label: string;
  action: string;
  parameters?: Record<string, PropertyValue>;
  condition?: string;
  icon?: string;
  tooltip?: string;
}

export interface TreeNode {
  id: string;
  label: string;
  children: TreeNode[];
  data?: Record<string, unknown>;
  expanded?: boolean;
  selected?: boolean;
}

export interface ModalOptions {
  title: string;
  width?: number;
  height?: number;
  closable?: boolean;
  className?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date' | 'array';
  required?: boolean;
  defaultValue?: PropertyValue;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

export interface FormSubmissionHandler {
  (values: Record<string, PropertyValue>): void | Promise<void>;
}

export interface PropertyInputElement extends HTMLElement {
  value: string;
  checked?: boolean;
  selectedOptions?: HTMLOptionElement[];
}

export type RenderingStrategy = 'default' | 'custom' | 'legacy';

export interface LayoutBlock {
  type: string;
  config: ConfigData;
  content?: string;
  children?: LayoutBlock[];
}

export interface QueryContext {
  currentFile?: ObsidianFile;
  variables?: Record<string, PropertyValue>;
  options?: {
    limit?: number;
    sort?: string;
    filter?: string;
  };
}