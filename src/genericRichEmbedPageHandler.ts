import {
  RichEmbed,
  Message,
  MessageReaction,
  User,
  ReactionCollector
} from "discord.js";

export class GenericRichEmbedPageHandler<T> {
  private data: T[];
  private itemsPerPage: number;
  private itemHandler: (embed: RichEmbed, data: T[]) => RichEmbed;
  private currentPage: number = 1;
  private amountOfPages: number;
  private embed: RichEmbed;
  private message: Message;
  private authorId: any;
  private collector: ReactionCollector | null = null;

  /**
   *
   */
  constructor(
    data: T[],
    itemsPerPage: number,
    itemHandler: (embed: RichEmbed, data: T[]) => RichEmbed,
    embed: RichEmbed,
    message: Message
  ) {
    // Set inner data
    this.data = data;
    // Set items per page
    this.itemsPerPage = itemsPerPage;
    // Set item handler
    this.itemHandler = itemHandler;
    // Set embed
    this.embed = embed;
    // Set sent message
    this.message = message;

    // Calculate amount of pages
    let totalPages = Math.floor(data.length / itemsPerPage);

    // If there's more items, there's one more page
    if (data.length % itemsPerPage != 0) {
      // So add it
      totalPages++;
    }

    // Set amount of pages
    this.amountOfPages = totalPages;
  }

  public NextPage = () => {
    // Go to first page if we're at the last page
    if (this.currentPage == this.amountOfPages) {
      this.currentPage = 1;

      // Go to next page if not
    } else {
      this.currentPage++;
    }

    // But no matter what, show the page
    this.showPage();
  };

  public PreviousPage = () => {
    // Go to last page if we're out of pages to show
    if (this.currentPage == 1) {
      this.currentPage = this.amountOfPages;

      // if not, go to previous page
    } else {
      this.currentPage--;
    }

    // But no matter what, show the page
    this.showPage();
  };

  public showPage() {
    // Get the start index, if page == 1, the index is 0
    let start =
      this.currentPage == 1 ? 0 : (this.currentPage - 1) * this.itemsPerPage;

    // Get the end index
    let end =
      this.itemsPerPage * this.currentPage > this.data.length
        ? this.data.length
        : this.itemsPerPage * this.currentPage;

    // Get the section of the data you want to show
    let data = this.data.slice(start, end);

    // Reset fields
    this.embed.fields = [];

    // Set embed fields
    this.embed = this.itemHandler(this.embed, data);

    // Update the message
    this.message.edit(this.embed);
  }

  public stopCollecting() {
    // If collecting, stop the collector
    if (this.collector) this.collector.stop("Stopped by using stop collecting");
  }

  public async startCollecting(authorId: string = "") {
    // Check if we've got an authorId (from args or because of previous step)
    if (
      (!this.authorId || this.authorId == "") &&
      (!authorId || authorId == "")
    ) {
      // If not, throw an error
      throw new Error("Cannot start collecting if author id isn't available");
    }

    await this.message.react("◀");
    await this.message.react("▶");
    await this.message.react("<:failiure:550070013646733312>");

    const filter = (reaction: MessageReaction, user: User) =>
      // Check if emoji is ◀ or ▶
      (reaction.emoji.name === "◀" ||
        reaction.emoji.name === "▶" ||
        reaction.emoji.id === "550070013646733312") &&
      // Check if reaction is added by command user
      user.id === this.authorId;

    // Create a new collector for the message,
    this.collector = this.message.createReactionCollector(filter, {
      time: 60 * 1000
    });

    // Will hit each time a reaction is collected
    this.collector.on("collect", r => {
      // Check if emoji is prev page emoji
      if (r.emoji.name === "◀") {
        // Go to previous page
        this.PreviousPage();

        // Check if emoji is next page emoji
      } else if (r.emoji.name === "▶") {
        // Show next page
        this.NextPage();

        // If emoji is the X
      } else if (r.emoji.id === "550070013646733312") {
        this.stopCollecting();
      }

      // Loop over all users for this reaction
      r.users.forEach(user => {
        // Check if user isn't a bot
        if (!user.bot) {
          // remove reaction for use
          r.remove(user);
        }
      });
    });

    this.collector.on("end", (collected, reason) => {
      // If the reason isn't one of the preset reasons
      if (
        reason != "collected everything" &&
        reason != "Stopped by using stop collecting"
      )
        // Delete the message
        this.message.delete(0);
    });
  }

  public getCollector() {
    return this.collector;
  }
}
