import { App } from "obsidian";
import { ICommand } from "./ICommand";
import type { ExocortexPluginInterface } from "../../types";
import { SPARQLQueryBuilderModal } from "../../presentation/modals/SPARQLQueryBuilderModal";

export class OpenQueryBuilderCommand implements ICommand {
  id = "open-sparql-query-builder";
  name = "open sparql query builder";

  constructor(
    private app: App,
    private plugin: ExocortexPluginInterface,
  ) {}

  callback = async (): Promise<void> => {
    const modal = new SPARQLQueryBuilderModal(this.app, this.plugin as any);
    modal.open();
  };
}
