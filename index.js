const express = require("express");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// ================= WEB =================
const app = express();
app.get("/", (req, res) => res.send("Zyrox FINAL 😈"));
app.listen(process.env.PORT || 3000);

// ================= BOT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const PREFIX = "z!";
const CATEGORY_ID = "1478407828849819854";

let warns = {};
let logsChannel = null;
let tickets = {};

// ================= SLASH COMMANDS =================
const commands = [

  new SlashCommandBuilder().setName("help").setDescription("Ver comandos"),
  new SlashCommandBuilder().setName("ping").setDescription("Ping"),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Enviar mensaje")
    .addStringOption(o => o.setName("mensaje").setDescription("Texto").setRequired(true)),

  new SlashCommandBuilder().setName("panel").setDescription("Ticket panel"),

  new SlashCommandBuilder().setName("kick").setDescription("Kick user")
    .addStringOption(o => o.setName("user").setDescription("Usuario").setRequired(true)),

  new SlashCommandBuilder().setName("ban").setDescription("Ban user")
    .addStringOption(o => o.setName("user").setDescription("Usuario").setRequired(true)),

  new SlashCommandBuilder().setName("8ball").setDescription("Ask bot")
    .addStringOption(o => o.setName("pregunta").setDescription("Pregunta").setRequired(true)),

  new SlashCommandBuilder().setName("dice").setDescription("Roll dice"),
  new SlashCommandBuilder().setName("coinflip").setDescription("Coin flip")
];

// ================= REGISTER =================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  if (!TOKEN || !CLIENT_ID || !GUILD_ID) return;

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
})();

// ================= READY =================
client.once("ready", () => {
  console.log(`🟢 ${client.user.tag} ONLINE`);
});

// ================= UTILS =================
const getUser = async (guild, input) => {
  const id = input.replace(/[<@!>]/g, "");
  return await guild.members.fetch(id).catch(() => null);
};

// ================= SLASH =================
client.on("interactionCreate", async (i) => {

  if (i.isChatInputCommand()) {

    const cmd = i.commandName;

    if (cmd === "ping") {
      return i.reply(`🏓 ${client.ws.ping}ms`);
    }

    // 💎 HELP SLASH (NUEVO PRO)
    if (cmd === "help") {
      const embed = new EmbedBuilder()
        .setTitle("📜 Zyrox System | Help")
        .setColor("Blue")
        .setThumbnail(i.client.user.displayAvatarURL())
        .setDescription("Todos los comandos disponibles del bot 🚀")
        .addFields(
          {
            name: "⚡ Utilidad",
            value: "`/ping` - Ver latencia\n`/say` - Enviar mensaje\n`/8ball` - Pregunta al bot\n`/dice` - Tirar dado\n`/coinflip` - Cara o cruz"
          },
          {
            name: "🛡️ Moderación",
            value: "`/kick` - Expulsar usuario\n`/ban` - Banear usuario"
          },
          {
            name: "🎫 Sistema",
            value: "`/panel` - Panel de tickets"
          }
        )
        .setFooter({ text: "Zyrox System 😈 | Slash Commands" });

      return i.reply({ embeds: [embed], ephemeral: true });
    }

    if (cmd === "say") {
      const msg = i.options.getString("mensaje");
      return i.reply(msg);
    }

    if (cmd === "kick") {
      const m = await getUser(i.guild, i.options.getString("user"));
      if (!m) return i.reply("No user");
      await m.kick();
      return i.reply("Kick");
    }

    if (cmd === "ban") {
      const m = await getUser(i.guild, i.options.getString("user"));
      if (!m) return i.reply("No user");
      await m.ban();
      return i.reply("Ban");
    }

    if (cmd === "panel") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket")
          .setLabel("Ticket")
          .setStyle(ButtonStyle.Primary)
      );

      return i.reply({ content: "Panel", components: [row] });
    }

    if (cmd === "8ball") {
      const r = ["sí", "no", "tal vez", "obvio", "ni idea"];
      return i.reply(r[Math.floor(Math.random() * r.length)]);
    }

    if (cmd === "dice") {
      return i.reply(`🎲 ${Math.floor(Math.random() * 6) + 1}`);
    }

    if (cmd === "coinflip") {
      return i.reply(Math.random() < 0.5 ? "cara" : "cruz");
    }
  }

  if (i.isButton()) {

    if (i.customId === "ticket") {

      if (!tickets[i.user.id]) tickets[i.user.id] = 0;

      if (tickets[i.user.id] >= 3) {
        return i.reply({ content: "Max 3 tickets", ephemeral: true });
      }

      const ch = await i.guild.channels.create({
        name: `ticket-${i.user.username}`,
        parent: CATEGORY_ID
      });

      tickets[i.user.id]++;

      ch.send(`<@${i.user.id}>`);

      return i.reply({ content: `Created ${ch}`, ephemeral: true });
    }
  }
});

// ================= PREFIX =================
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  if (!cmd) return;

  if (cmd === "ping") {
    return message.reply(`🏓 ${client.ws.ping}ms`);
  }

  if (cmd === "say") {
    const text = args.join(" ");
    if (!text) return message.reply("Escribe algo");
    return message.channel.send(text);
  }

  if (cmd === "kick") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("Menciona alguien");
    await user.kick();
    return message.reply("Kick");
  }

  if (cmd === "ban") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("Menciona alguien");
    await user.ban();
    return message.reply("Ban");
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

  // 💎 HELP PREFIX (NUEVO PRO)
  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Zyrox System | Help")
      .setColor("Blue")
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription("Comandos con prefix `z!` 🚀")
      .addFields(
        {
          name: "⚡ Utilidad",
          value: "`z!ping`\n`z!say`\n`z!8ball`\n`z!dice`\n`z!coinflip`"
        },
        {
          name: "🛡️ Moderación",
          value: "`z!kick`\n`z!ban`"
        },
        {
          name: "🎫 Sistema",
          value: "`z!panel`"
        }
      )
      .setFooter({ text: "Zyrox System 😈 | Prefix Commands" });

    return message.reply({ embeds: [embed] });
  }
});

client.login(TOKEN);
