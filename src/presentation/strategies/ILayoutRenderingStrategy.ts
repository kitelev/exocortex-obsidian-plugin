import { Result } from '../../domain/core/Result';
import { ClassLayout } from '../../domain/entities/ClassLayout';
import { TFile } from 'obsidian';

export interface LayoutRenderingContext {
    readonly container: HTMLElement;
    readonly file: TFile;
    readonly metadata: any;
    readonly dataviewApi?: any;
}

export interface ILayoutRenderingStrategy {
    canHandle(layout: ClassLayout | null): boolean;
    render(context: LayoutRenderingContext, layout?: ClassLayout): Promise<Result<void>>;
}