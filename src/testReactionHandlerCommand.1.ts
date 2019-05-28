import * as Discord from "discord.js";
import { IBotCommand } from "../api";
import { GenericRichEmbedPageHandler } from "./genericRichEmbedPageHandler";

export default class testingReaction implements IBotCommand {
  private readonly _command = "testingreaction";

  help(): string {
    return "Testing the createReactionCollector";
  }

  isThisCommand(command: string): boolean {
    return command === this._command;
  }

  async runCommand(
    args: string[],
    msgObject: Discord.Message,
    client: Discord.Client
  ): Promise<void> {
    // SOON TO BE ADDED
  }
}
