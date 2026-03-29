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
    GatewayIntentBits.MessageContent
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

// ================= SLASH =================
const commands = [

  new SlashCommandBuilder().setName("help").setDescription("Ver comandos"),
  new SlashCommandBuilder().setName("ping").setDescription("Ping"),

  new SlashCommandBuilder().setName("say")
    .addStringOption(o=>o.setName("mensaje").setDescription("Texto").setRequired(true)),

  new SlashCommandBuilder().setName("embedpro")
    .setDescription("Embed editable")
    .addStringOption(o=>o.setName("nombre").setDescription("Autor"))
    .addStringOption(o=>o.setName("titulo").setDescription("Titulo"))
    .addStringOption(o=>o.setName("descripcion").setDescription("Descripcion"))
    .addStringOption(o=>o.setName("color").setDescription("#HEX o Blue"))
    .addStringOption(o=>o.setName("imagen").setDescription("URL imagen")),

  new SlashCommandBuilder().setName("announce")
    .addStringOption(o=>o.setName("titulo").setRequired(true))
    .addStringOption(o=>o.setName("mensaje").setRequired(true))
    .addStringOption(o=>o.setName("imagen")),

  new SlashCommandBuilder().setName("kick").addStringOption(o=>o.setName("user").setRequired(true)),
  new SlashCommandBuilder().setName("ban").addStringOption(o=>o.setName("user").setRequired(true)),
  new SlashCommandBuilder().setName("unban").addStringOption(o=>o.setName("id").setRequired(true)),

  new SlashCommandBuilder().setName("mute")
    .addStringOption(o=>o.setName("user").setRequired(true))
    .addIntegerOption(o=>o.setName("tiempo").setRequired(true)),

  new SlashCommandBuilder().setName("unmute")
    .addStringOption(o=>o.setName("user").setRequired(true)),

  new SlashCommandBuilder().setName("clear")
    .addIntegerOption(o=>o.setName("cantidad").setRequired(true)),

  new SlashCommandBuilder().setName("lock"),
  new SlashCommandBuilder().setName("unlock"),

  new SlashCommandBuilder().setName("warn")
    .addStringOption(o=>o.setName("user").setRequired(true)),

  new SlashCommandBuilder().setName("warnings")
    .addStringOption(o=>o.setName("user").setRequired(true)),

  new SlashCommandBuilder().setName("setlogs")
    .addStringOption(o=>o.setName("id").setRequired(true)),

  new SlashCommandBuilder().setName("8ball")
    .addStringOption(o=>o.setName("pregunta").setRequired(true)),

  new SlashCommandBuilder().setName("dice"),
  new SlashCommandBuilder().setName("coinflip"),

  new SlashCommandBuilder().setName("panel")
];

// ================= REGISTER =================
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
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

// ================= INTERACCIONES =================
client.on("interactionCreate", async (i) => {

  if (i.isChatInputCommand()) {

    const cmd = i.commandName;

    // ===== HELP =====
    if (cmd === "help") {
      const embed = new EmbedBuilder()
        .setTitle("📜 Zyrox System FINAL")
        .setColor("Blue")
        .setDescription(
`📢 /announce /say /embedpro
🔨 /kick /ban /unban
🔇 /mute /unmute
🧹 /clear
🔒 /lock /unlock
👮 /warn /warnings
⚙️ /setlogs
🎮 /8ball /dice /coinflip
🎫 /panel`
        );

      return i.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== PING =====
    if (cmd === "ping") return i.reply(`🏓 ${client.ws.ping}ms`);

    // ===== SAY =====
    if (cmd === "say") {
      if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator))
        return i.reply({ content: "❌ Sin permisos", ephemeral: true });

      const msg = i.options.getString("mensaje") || " ";
      await i.channel.send(msg);
      return i.reply({ content: "✅ Enviado", ephemeral: true });
    }

    // ===== EMBED PRO (FIX) =====
    if (cmd === "embedpro") {

      const nombre = i.options.getString("nombre") || "Zyrox";
      const titulo = i.options.getString("titulo") || " ";
      const descripcion = i.options.getString("descripcion") || " ";
      const colorInput = i.options.getString("color");
      const imagen = i.options.getString("imagen");

      let color = "Blue";
      if (colorInput && colorInput.startsWith("#")) {
        color = colorInput;
      }

      const embed = new EmbedBuilder()
        .setAuthor({ name: nombre })
        .setTitle(titulo)
        .setDescription(descripcion)
        .setColor(color);

      if (imagen) embed.setImage(imagen);

      return i.reply({ embeds: [embed] });
    }

    // ===== ANNOUNCE =====
    if (cmd === "announce") {
      const titulo = i.options.getString("titulo") || " ";
      const mensaje = i.options.getString("mensaje") || " ";
      const imagen = i.options.getString("imagen");

      const embed = new EmbedBuilder()
        .setTitle(titulo)
        .setDescription(mensaje)
        .setColor("Gold");

      if (imagen) embed.setImage(imagen);

      return i.channel.send({ embeds: [embed] });
    }

    // ===== MOD =====
    if (cmd === "kick") {
      const m = await getUser(i.guild, i.options.getString("user"));
      if (!m) return i.reply("Usuario no encontrado");
      await m.kick();
      i.reply("Kick");
    }

    if (cmd === "ban") {
      const m = await getUser(i.guild, i.options.getString("user"));
      if (!m) return i.reply("Usuario no encontrado");
      await m.ban();
      i.reply("Ban");
    }

    if (cmd === "unban") {
      await i.guild.members.unban(i.options.getString("id"));
      i.reply("Unban");
    }

    if (cmd === "mute") {
      const m = await getUser(i.guild, i.options.getString("user"));
      if (!m) return i.reply("Usuario no encontrado");
      await m.timeout(i.options.getInteger("tiempo") * 60000);
      i.reply("Mute");
    }

    if (cmd === "unmute") {
      const m = await getUser(i.guild, i.options.getString("user"));
      if (!m) return i.reply("Usuario no encontrado");
      await m.timeout(null);
      i.reply("Unmute");
    }

    if (cmd === "clear") {
      await i.channel.bulkDelete(i.options.getInteger("cantidad"));
      i.reply({ content: "Borrado", ephemeral: true });
    }

    if (cmd === "lock") {
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: false });
      i.reply("Lock");
    }

    if (cmd === "unlock") {
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: true });
      i.reply("Unlock");
    }

    if (cmd === "warn") {
      const u = i.options.getString("user");
      if (!warns[u]) warns[u] = [];
      warns[u].push("warn");
      i.reply("Warn");
    }

    if (cmd === "warnings") {
      const u = i.options.getString("user");
      i.reply((warns[u] || []).length + " warns");
    }

    if (cmd === "setlogs") {
      logsChannel = i.options.getString("id");
      i.reply("Logs set");
    }

    // ===== FUN =====
    if (cmd === "8ball") {
      const r = ["Sí", "No", "Tal vez", "Obvio"];
      i.reply(r[Math.floor(Math.random() * r.length)]);
    }

    if (cmd === "dice") i.reply("🎲 " + (Math.floor(Math.random() * 6) + 1));
    if (cmd === "coinflip") i.reply(Math.random() > 0.5 ? "Cara" : "Cruz");

    // ===== TICKETS =====
    if (cmd === "panel") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket")
          .setLabel("Abrir Ticket")
          .setStyle(ButtonStyle.Primary)
      );

      i.reply({ content: "🎫 Panel de tickets", components: [row] });
    }
  }

  // ===== BOTÓN =====
  if (i.isButton()) {
    if (i.customId === "ticket") {

      if (!tickets[i.user.id]) tickets[i.user.id] = 0;

      if (tickets[i.user.id] >= 3) {
        return i.reply({ content: "❌ Máximo 3 tickets", ephemeral: true });
      }

      const ch = await i.guild.channels.create({
        name: `ticket-${i.user.username}`,
        parent: CATEGORY_ID
      });

      tickets[i.user.id]++;

      ch.send(`<@${i.user.id}>`);

      i.reply({ content: `✅ Ticket creado: ${ch}`, ephemeral: true });
    }
  }
});

client.login(TOKEN);
