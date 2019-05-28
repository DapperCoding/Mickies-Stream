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
    let embed = new Discord.RichEmbed();

    embed.setTitle("React to this message");
    embed.setDescription("This is an example with the page handler");

    msgObject.channel
      .send("React to this message")
      .then(async msg => {
        let message = msg as Discord.Message;
        let handler = new GenericRichEmbedPageHandler<string>(
          ["melon", "apple", "pear", "banana", "fifth", "sixth"],
          5,
          (embed: any, data: string[]) => {
            embed.addField("Fruit: ", data);

            return embed;
          },
          embed,
          message
        );
      })
      .catch(console.error);
  }
}
