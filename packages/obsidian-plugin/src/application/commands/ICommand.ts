import { TFile } from "obsidian";
import { CommandVisibilityContext } from "@exocortex/core";

export interface ICommand {
  id: string;
  name: string;

  checkCallback?: (
    checking: boolean,
    file: TFile,
    context: CommandVisibilityContext | null,
  ) => boolean | void;

  callback?: () => void | Promise<void>;
}
