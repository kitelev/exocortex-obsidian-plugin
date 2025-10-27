import { TFile, Notice } from "obsidian";
import { ICommand } from "./ICommand";
import {
  CommandVisibilityContext,
  canVoteOnEffort,
  EffortVotingService,
  LoggingService,
} from "@exocortex/core";

export class VoteOnEffortCommand implements ICommand {
  id = "vote-on-effort";
  name = "Vote on effort";

  constructor(private effortVotingService: EffortVotingService) {}

  checkCallback = (checking: boolean, file: TFile, context: CommandVisibilityContext | null): boolean => {
    if (!context || !canVoteOnEffort(context)) return false;

    if (!checking) {
      this.execute(file).catch((error) => {
        new Notice(`Failed to vote: ${error.message}`);
        LoggingService.error("Vote on effort error", error);
      });
    }

    return true;
  };

  private async execute(file: TFile): Promise<void> {
    const newVoteCount = await this.effortVotingService.incrementEffortVotes(file);
    new Notice(`Voted! New vote count: ${newVoteCount}`);
  }
}
