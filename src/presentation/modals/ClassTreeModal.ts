import { App, Modal, Setting, TextComponent } from "obsidian";

interface TreeNode {
  className: string;
  label: string;
  ontology: string;
  children: TreeNode[];
  isExpanded: boolean;
  isSelected: boolean;
  isRecursion: boolean;
  hasMultipleParents: boolean;
  level: number;
}

export class ClassTreeModal extends Modal {
  private treeData: TreeNode[];
  private expandedNodes: Set<string> = new Set();
  private selectedClass: string;
  private onSelect: (className: string) => void;
  private searchInput: TextComponent;
  private treeContainer: HTMLElement;
  private filteredTree: TreeNode[] | null = null;
  private searchTerm: string = "";

  constructor(
    app: App,
    treeData: any[],
    currentClass: string,
    onSelect: (className: string) => void,
  ) {
    super(app);
    this.selectedClass = currentClass;
    this.onSelect = onSelect;
    this.treeData = this.convertToTreeNodes(treeData);

    // Add CSS class for styling
    this.modalEl.addClass("class-tree-modal");

    // Set initial expanded state for selected class
    this.expandToSelected(currentClass);
  }

  private convertToTreeNodes(data: any[], level: number = 0): TreeNode[] {
    return data.map((item) => ({
      className: item.className,
      label: item.label,
      ontology: item.ontology,
      children: item.children
        ? this.convertToTreeNodes(item.children, level + 1)
        : [],
      isExpanded: this.expandedNodes.has(item.className),
      isSelected: item.className === this.selectedClass,
      isRecursion: item.isRecursion || false,
      hasMultipleParents: false, // Will be calculated separately
      level: level,
    }));
  }

  private expandToSelected(className: string) {
    // Find path to selected class and expand all parents
    const findPath = (
      nodes: any[],
      target: string,
      path: string[] = [],
    ): string[] | null => {
      for (const node of nodes) {
        if (node.className === target) {
          return path;
        }
        if (node.children && node.children.length > 0) {
          const childPath = findPath(node.children, target, [
            ...path,
            node.className,
          ]);
          if (childPath) {
            return childPath;
          }
        }
      }
      return null;
    };

    const path = findPath(this.treeData, className);
    if (path) {
      path.forEach((nodeClass) => this.expandedNodes.add(nodeClass));
    }
  }

  async onOpen() {
    const { contentEl } = this;

    // Header
    const headerEl = contentEl.createEl("div", { cls: "class-tree-header" });
    headerEl.createEl("h2", { text: "Select Class", cls: "class-tree-title" });

    // Search bar
    const searchContainer = contentEl.createEl("div", {
      cls: "class-tree-search",
    });
    new Setting(searchContainer)
      .setName("Search")
      .setDesc("Filter classes by name")
      .addText((text) => {
        this.searchInput = text;
        text.setPlaceholder("Type to search...").onChange((value) => {
          this.searchTerm = value;
          this.filterTree(value);
        });
      });

    // Tree container
    this.treeContainer = contentEl.createEl("div", {
      cls: "class-tree-container",
    });
    this.renderTree();

    // Footer with buttons
    const footerEl = contentEl.createEl("div", { cls: "class-tree-footer" });
    new Setting(footerEl).addButton((btn) =>
      btn.setButtonText("Cancel").onClick(() => this.close()),
    );

    // Focus search input
    this.searchInput.inputEl.focus();
  }

  private filterTree(searchTerm: string) {
    if (!searchTerm) {
      this.filteredTree = null;
      this.renderTree();
      return;
    }

    const term = searchTerm.toLowerCase();

    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = [];

      for (const node of nodes) {
        const matchesSearch =
          node.className.toLowerCase().includes(term) ||
          node.label.toLowerCase().includes(term);

        const filteredChildren = node.children
          ? filterNodes(node.children)
          : [];

        if (matchesSearch || filteredChildren.length > 0) {
          result.push({
            ...node,
            children: filteredChildren,
            isExpanded: true, // Auto-expand when searching
          });
        }
      }

      return result;
    };

    this.filteredTree = filterNodes(this.treeData);
    this.renderTree();
  }

  private renderTree() {
    this.treeContainer.empty();

    const nodes = this.filteredTree || this.treeData;

    if (nodes.length === 0) {
      this.treeContainer.createEl("div", {
        text: "No classes found",
        cls: "class-tree-empty",
      });
      return;
    }

    const treeEl = this.treeContainer.createEl("div", { cls: "class-tree" });
    this.renderNodes(nodes, treeEl);
  }

  private renderNodes(nodes: TreeNode[], container: HTMLElement) {
    nodes.forEach((node) => {
      if (node.isRecursion) {
        this.renderRecursionNode(node, container);
      } else {
        this.renderTreeNode(node, container);
      }
    });
  }

  private renderRecursionNode(node: TreeNode, container: HTMLElement) {
    const nodeEl = container.createEl("div", {
      cls: "class-tree-node class-tree-recursion",
    });

    const contentEl = nodeEl.createEl("div", {
      cls: "class-tree-node-content",
      attr: {
        style: `padding-left: ${node.level * 20 + 20}px`,
      },
    });

    contentEl.createEl("span", {
      text: "⚠️ " + node.className,
      cls: "class-tree-recursion-text",
    });
  }

  private renderTreeNode(node: TreeNode, container: HTMLElement) {
    const nodeEl = container.createEl("div", {
      cls: `class-tree-node ${node.isSelected ? "is-selected" : ""}`,
    });

    const contentEl = nodeEl.createEl("div", {
      cls: "class-tree-node-content",
      attr: {
        style: `padding-left: ${node.level * 20}px`,
      },
    });

    // Expand/collapse icon
    if (node.children && node.children.length > 0) {
      const expandIcon = contentEl.createEl("span", {
        cls: "class-tree-expand-icon",
        text: node.isExpanded ? "▼" : "▶",
      });

      expandIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleExpand(node);
      });
    } else {
      contentEl.createEl("span", { cls: "class-tree-expand-spacer" });
    }

    // Class icon
    contentEl.createEl("span", {
      cls: "class-tree-icon",
      text: "📦",
    });

    // Class name and label
    const textEl = contentEl.createEl("span", {
      cls: "class-tree-text",
    });

    const nameEl = textEl.createEl("span", {
      cls: "class-tree-name",
      text: node.className,
    });

    if (this.searchTerm) {
      this.highlightSearchTerm(nameEl, node.className);
    }

    textEl.createEl("span", {
      cls: "class-tree-label",
      text: ` - ${node.label}`,
    });

    // Ontology badge
    contentEl.createEl("span", {
      cls: "class-tree-ontology",
      text: node.ontology,
    });

    // Click handler for selection
    contentEl.addEventListener("click", () => {
      if (!node.isRecursion) {
        this.selectClass(node.className);
      }
    });

    // Render children if expanded
    if (node.isExpanded && node.children && node.children.length > 0) {
      const childContainer = nodeEl.createEl("div", {
        cls: "class-tree-children",
      });
      this.renderNodes(node.children, childContainer);
    }
  }

  private highlightSearchTerm(element: HTMLElement, text: string) {
    if (!this.searchTerm) return;

    // Clear existing content safely
    element.textContent = "";

    // Escape special regex characters in search term
    const escapedTerm = this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");

    // Split text and create elements safely
    const parts = text.split(regex);
    parts.forEach((part, index) => {
      if (
        index % 2 === 1 &&
        part.toLowerCase() === this.searchTerm.toLowerCase()
      ) {
        // Create mark element safely
        const mark = document.createElement("mark");
        mark.textContent = part;
        element.appendChild(mark);
      } else if (part) {
        // Add text node
        element.appendChild(document.createTextNode(part));
      }
    });
  }

  private toggleExpand(node: TreeNode) {
    node.isExpanded = !node.isExpanded;

    if (node.isExpanded) {
      this.expandedNodes.add(node.className);
    } else {
      this.expandedNodes.delete(node.className);
    }

    // Update tree data
    this.updateNodeInTree(this.treeData, node.className, node.isExpanded);
    this.renderTree();
  }

  private updateNodeInTree(
    nodes: TreeNode[],
    className: string,
    isExpanded: boolean,
  ): boolean {
    for (const node of nodes) {
      if (node.className === className) {
        node.isExpanded = isExpanded;
        return true;
      }
      if (
        node.children &&
        this.updateNodeInTree(node.children, className, isExpanded)
      ) {
        return true;
      }
    }
    return false;
  }

  private selectClass(className: string) {
    this.selectedClass = className;
    this.onSelect(className);
    this.close();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
