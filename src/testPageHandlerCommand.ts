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
    // Create new embed
    let embed = new Discord.RichEmbed();

    // Set title and description
    embed.setTitle("React to this message");
    embed.setDescription("This is an example with the page handler");

    // Send embed
    msgObject.channel
      .send("React to this message")
      .then(async msg => {
        // Get message (ts fix)
        let message = msg as Discord.Message;
        // Create new handler
        let handler = new GenericRichEmbedPageHandler<string>(
          // Set data
          ["melon", "apple", "pear", "banana", "fifth", "sixth"],
          // Set per page
          5,
          // Set show page (function to show the data in embed)
          (embed: any, data: string[]) => {
            // Add field that shows all fruits
            embed.addField("Fruit: ", data);

            // Return updated embed (Do not edit it yourself, the handler will do that for you)
            return embed;
          },

          // Set embed to work with
          embed,

          // Set message that needs to be edited
          message
        );

        // Show the first page
        handler.showPage();

        // And start collecting using the original messages user id (command user id)
        handler.startCollecting(msgObject.author.id);
      })
      .catch(console.error);
  }
}
