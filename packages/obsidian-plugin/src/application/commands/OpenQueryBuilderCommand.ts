import { App } from "obsidian";
import { ICommand } from "./ICommand";
import type ExocortexPlugin from "../../ExocortexPlugin";
import { SPARQLQueryBuilderModal } from "../../presentation/modals/SPARQLQueryBuilderModal";

export class OpenQueryBuilderCommand implements ICommand {
  id = "open-sparql-query-builder";
  name = "open sparql query builder";

  constructor(
    private app: App,
    private plugin: ExocortexPlugin,
  ) {}

  callback = async (): Promise<void> => {
    const modal = new SPARQLQueryBuilderModal(this.app, this.plugin);
    modal.open();
  };
}
