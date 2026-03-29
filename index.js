const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

// ======================
// CONFIG
// ======================
const TOKEN = "TU_TOKEN";
const CLIENT_ID = "TU_CLIENT_ID";
const GUILD_ID = "TU_GUILD_ID";
const PREFIX = "z!";

// ======================
// CLIENT
// ======================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// ======================
// WARN SYSTEM (simple)
// ======================
const warns = new Map();

// ======================
// SLASH COMMANDS
// ======================
const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Ver ping"),
  new SlashCommandBuilder().setName("help").setDescription("Ver ayuda"),
  new SlashCommandBuilder().setName("say").setDescription("Decir algo").addStringOption(o =>
    o.setName("text").setDescription("texto").setRequired(true)
  ),
  new SlashCommandBuilder().setName("8ball").setDescription("Pregunta"),
  new SlashCommandBuilder().setName("dice").setDescription("Dado"),
  new SlashCommandBuilder().setName("coinflip").setDescription("Cara o cruz"),
  new SlashCommandBuilder().setName("kick").setDescription("Kick user").addUserOption(o =>
    o.setName("user").setDescription("usuario").setRequired(true)
  ),
  new SlashCommandBuilder().setName("ban").setDescription("Ban user").addUserOption(o =>
    o.setName("user").setDescription("usuario").setRequired(true)
  )
].map(c => c.toJSON());

// ======================
// READY
// ======================
client.once("ready", async () => {
  console.log(`🟢 Logged as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("⚡ Slash commands listos");
});

// ======================
// PREFIX COMMANDS
// ======================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  if (!cmd) return;

  // ⚡ UTILIDAD
  if (cmd === "ping") {
    return message.reply(`🏓 ${client.ws.ping}ms`);
  }

  if (cmd === "say") {
    const text = args.join(" ");
    if (!text) return message.reply("Escribe algo");
    await message.delete().catch(() => {});
    return message.channel.send(text);
  }

  if (cmd === "8ball") {
    const r = ["sí", "no", "tal vez", "obvio", "ni idea"];
    return message.reply(r[Math.floor(Math.random() * r.length)]);
  }

  if (cmd === "dice") {
    return message.reply(`🎲 ${Math.floor(Math.random() * 6) + 1}`);
  }

  if (cmd === "coinflip") {
    return message.reply(Math.random() < 0.5 ? "cara" : "cruz");
  }

  // 🛡️ MOD
  if (cmd === "kick") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("Menciona alguien");
    await user.kick();
    return message.reply("Kick hecho");
  }

  if (cmd === "ban") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("Menciona alguien");
    await user.ban();
    return message.reply("Ban hecho");
  }

  if (cmd === "lock") {
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false
    });
    return message.reply("🔒 locked");
  }

  if (cmd === "unlock") {
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: true
    });
    return message.reply("🔓 unlocked");
  }

  if (cmd === "warn") {
    const user = message.mentions.user?.id;
    if (!user) return message.reply("Menciona alguien");

    if (!warns.has(user)) warns.set(user, []);
    warns.get(user).push("warn");

    return message.reply("Warn dado");
  }

  if (cmd === "warnings") {
    const user = message.mentions.user?.id;
    if (!user) return message.reply("Menciona alguien");

    return message.reply(`Warns: ${(warns.get(user) || []).length}`);
  }

  // 📜 HELP PREFIX
  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Zyrox System | Help")
      .setColor("Blue")
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription("Comandos prefix `z!` 🚀")
      .addFields(
        {
          name: "⚡ Utilidad",
          value: "`z!ping`\n`z!say`\n`z!8ball`\n`z!dice`\n`z!coinflip`"
        },
        {
          name: "🛡️ Moderación",
          value: "`z!kick`\n`z!ban`\n`z!warn`\n`z!warnings`\n`z!lock`\n`z!unlock`"
        }
      )
      .setFooter({ text: "Zyrox System 😈" });

    return message.reply({ embeds: [embed] });
  }
});

// ======================
// SLASH COMMANDS
// ======================
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  const cmd = i.commandName;

  if (cmd === "ping") {
    return i.reply({ content: `🏓 ${client.ws.ping}ms`, ephemeral: true });
  }

  if (cmd === "say") {
    const text = i.options.getString("text");
    return i.reply({ content: text });
  }

  if (cmd === "8ball") {
    const r = ["sí", "no", "tal vez", "obvio", "ni idea"];
    return i.reply({ content: r[Math.floor(Math.random() * r.length)], ephemeral: true });
  }

  if (cmd === "dice") {
    return i.reply({ content: `🎲 ${Math.floor(Math.random() * 6) + 1}`, ephemeral: true });
  }

  if (cmd === "coinflip") {
    return i.reply({ content: Math.random() < 0.5 ? "cara" : "cruz", ephemeral: true });
  }

  if (cmd === "kick") {
    const user = i.options.getMember("user");
    await user.kick();
    return i.reply({ content: "Kick hecho", ephemeral: true });
  }

  if (cmd === "ban") {
    const user = i.options.getMember("user");
    await user.ban();
    return i.reply({ content: "Ban hecho", ephemeral: true });
  }

  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Zyrox System | Help")
      .setColor("Blue")
      .setDescription("Comandos slash 🚀")
      .addFields(
        {
          name: "⚡ Utilidad",
          value: "`/ping` `/say` `/8ball` `/dice` `/coinflip`"
        },
        {
          name: "🛡️ Moderación",
          value: "`/kick` `/ban`"
        }
      );

    return i.reply({ embeds: [embed], ephemeral: true });
  }
});

// ======================
client.login(TOKEN);
