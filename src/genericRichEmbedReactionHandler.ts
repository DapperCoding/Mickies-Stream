import {
  RichEmbed,
  Message,
  MessageReaction,
  User,
  ReactionCollector
} from "discord.js";

export abstract class GenericRichEmbedReactionHandler<
  T extends {
    clickHandler: (data: T) => Promise<{ embed: RichEmbed; category: string }>;
  }
> {
  /**
   *
   */
  categories: // category id
  Map<
    string,
    Map<
      // emoji name
      string,
      T
    >
  > = new Map<
    string,
    Map<
      // emoji name
      string,
      T
    >
  >();

  embed: RichEmbed;
  message: Message;
  authorId: string = "";
  collector: ReactionCollector | null = null;
  currentCategory: Map<
    // emoji name
    string,
    T
  > = new Map();
  constructor(embed: RichEmbed, message: Message) {
    this.embed = embed;
    this.message = message;
  }
  public abstract setCurrentCategory(category: string): void;
  public abstract addCategory(
    categoryName: string,
    category: Map<string, T>
  ): Map<string, T>;
  public abstract addEmoji(
    categoryName: string,
    emojiName: string,
    emoji: T
  ): T;
  public abstract getEmoji(emojiName: string): T;
  public getEmbed(): RichEmbed {
    return this.embed;
  }

  public async handleEmojiClick(emoji: string) {
    // Check if the current category is set, if not, throw error
    if (this.currentCategory == null) throw new Error("Whoops no category");

    // Get current emoji data
    let data = this.currentCategory.get(emoji);

    // Throw error if data not present
    if (!data) throw new Error("Whoops no emoji found");

    // Handle click for current emoji
    let result = await data.clickHandler(data);

    // Set current embed to the updated embed
    this.embed = result.embed;

    // Set current category to results category
    this.setCurrentCategory(result.category);

    // Edit the message to the updated embed
    this.message.edit(result.embed);

    // Start collecting again
    this.startCollecting(this.authorId);
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

    // Set the authorId to the authorId from the arguments, if present
    if (authorId && authorId != "") this.authorId = authorId;

    // Create a filter function for reactions
    const filter = (reaction: MessageReaction, user: User) =>
      // Check if emoji is current emoji
      this.currentCategory.get(reaction.emoji.name) != null &&
      // Check if reaction is added by command user
      user.id === authorId;

    // Create a new collector for the message,
    this.collector = this.message.createReactionCollector(filter, {
      time: 60 * 1000
    });

    // Will hit each time a reaction is collected
    this.collector.on("collect", async r => {
      // Handle the emoji click
      this.handleEmojiClick(r.emoji.name);

      // Loop over all users for this reaction
      r.users.forEach(user => {
        // Check if user isn't a bot
        if (!user.bot) {
          // remove reaction for use
          r.remove(user);
        }
      });

      // Stop collecting
      this.stopCollecting();
    });

    // On collector ended event
    this.collector.on("end", (collected, reason) => {
      // If the reason isn't one of the preset reasons
      if (
        reason != "collected everything" &&
        reason != "Stopped by using stop collecting"
      )
        // Delete the message
        this.message.delete(0);
    });

    // Get all keys from current category (emoji names) from the
    let keys = Array.from(this.currentCategory.keys());

    // Loop over all keys and react them
    for (let i = 0; i < keys.length; i++) {
      // Add reaction
      await this.message.react(keys[i]);
    }
  }
}

export class RichEmbedReactionHandler<
  T extends {
    clickHandler: (data: T) => Promise<{ embed: RichEmbed; category: string }>;
  }
> extends GenericRichEmbedReactionHandler<T> {
  public getEmoji(emojiName: string): T {
    // Check if current category is set
    if (!this.currentCategory) {
      // Throw error if not
      throw new Error("Cannot find category");
    }

    // Get emoji data from current category
    let emoji = this.currentCategory.get(emojiName);

    // Check if emoji data is present
    if (!emoji) {
      // If not, throw error
      throw new Error("Cannot find emoji");
    }

    // Return the found emoji
    return emoji;
  }
  public setCurrentCategory(category: string) {
    // Check if there are categories
    if (!this.categories || this.categories.size < 0) {
      // If not, throw error
      throw new Error("no categories");
    }

    // Get current category from all categories
    let cat = this.categories.get(category);

    // If no category is found, throw error
    if (!cat) throw new Error("no category");

    // Set current category to the found category
    this.currentCategory = cat;
  }

  public getCurrentCategory() {
    // Return current category
    return this.currentCategory;
  }

  constructor(embed: RichEmbed, message: Message) {
    super(embed, message);
  }

  public addCategory(categoryName: string, category: Map<string, T>) {
    // Get category that you want to add
    let cat = this.categories.get(categoryName);

    // If category is found, throw error
    if (cat) throw new Error("Category already exists");

    // Set category
    this.categories.set(categoryName, category);

    // Return the added category
    return category;
  }

  public addEmoji(categoryName: string, emojiName: string, emoji: T) {
    // Check if there are categories
    if (this.categories && this.categories.size > 0) {
      // Get category by name
      let cat = this.categories.get(categoryName);

      // If the category cannot be found, throw error
      if (!cat) throw new Error("Category not found");

      // Get emoji data from the category
      let dbEmoji = cat.get(emojiName);

      // If no emoji is found, throw error
      if (dbEmoji) throw new Error("Emoji found");

      // Set emoji
      cat.set(emojiName, emoji);

      // Return added emoji
      return emoji;

      // If no categories are found, throw error
    } else throw new Error("No categories found");
  }

  public removeEmoji(categoryName: string, emojiName: string, emoji: T) {
    // Check if categories are found
    if (this.categories && this.categories.size > 0) {
      // Get category from list of categories
      let cat = this.categories.get(categoryName);

      // If not found, throw error
      if (!cat) throw new Error("Category not found");

      // Get emoji data
      let dbEmoji = cat.get(emojiName);

      // If not found, throw error
      if (!dbEmoji) throw new Error("Emoji not found");

      // Delete emoji data by name
      cat.delete(emojiName);

      // Return removed emoji
      return emoji;

      // If no categories are found, throw error
    } else throw new Error("No categories found");
  }

  public removeIfExistsEmoji(categoryName: string, emojiName: string) {
    // Check if categories are present
    if (this.categories && this.categories.size > 0) {
      // Get category from list of categories
      let cat = this.categories.get(categoryName);

      // If not found, throw error
      if (!cat) throw new Error("Category not found");

      // Get emoji data
      let dbEmoji = cat.get(emojiName);

      // If found
      if (dbEmoji) {
        // Delete emoji
        cat.delete(emojiName);
      }

      // Return removed/non existant emojis name
      return emojiName;

      // If not, throw error
    } else throw new Error("No categories found");
  }
}
