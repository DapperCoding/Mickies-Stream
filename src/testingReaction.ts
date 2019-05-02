import * as Discord from "discord.js";
import { IBotCommand } from "../api";

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
    msgObject.channel
      .send("React to this message")
      .then(async msg => {
        if (Array.isArray(msg)) {
          msg = msg[0];
        }

        await msg.react("😛");
        await msg.react("👍");
        await msg.react("🤔");

        const emojis = ["😛", "👍", "🤔"];

        const filter = (
          reaction: Discord.MessageReaction,
          user: Discord.User
        ) =>
          emojis.includes(reaction.emoji.name) &&
          user.id === msgObject.author.id;

        let collector = msg.createReactionCollector(filter, { time: 10000 });

        collector.on("collect", (element: Discord.MessageReaction) =>
          console.log("collected")
        );

        collector.on(
          "end",
          (
            collected: Discord.Collection<string, Discord.MessageReaction>,
            reason: string
          ) => {
            console.log(collected.size);
          }
        );
      })
      .catch(console.error);
  }
}
