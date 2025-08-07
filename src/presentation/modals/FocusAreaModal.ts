import { App, FuzzySuggestModal } from 'obsidian';

export interface AreaOption {
    fileName: string;
    label: string;
}

// Fallback base class for environments where FuzzySuggestModal is undefined
const BaseModal: any = (FuzzySuggestModal as any) ?? class {};

export class FocusAreaModal extends BaseModal {
    constructor(
        app: App,
        private areas: AreaOption[],
        private onChoose: (area: AreaOption) => void
    ) {
        super(app);
    }

    getItems(): AreaOption[] {
        return this.areas;
    }

    getItemText(item: AreaOption): string {
        return item.label;
    }

    onChooseItem(item: AreaOption): void {
        this.onChoose(item);
    }
}
