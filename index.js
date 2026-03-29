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

// ================= SLASH COMMANDS FIXED =================
const commands = [

  new SlashCommandBuilder().setName("help").setDescription("Ver comandos"),
  new SlashCommandBuilder().setName("ping").setDescription("Ver ping del bot"),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Enviar mensaje")
    .addStringOption(o => o.setName("mensaje").setDescription("Texto").setRequired(true)),

  new SlashCommandBuilder()
    .setName("embedpro")
    .setDescription("Embed personalizado")
    .addStringOption(o => o.setName("nombre").setDescription("Autor"))
    .addStringOption(o => o.setName("titulo").setDescription("Titulo"))
    .addStringOption(o => o.setName("descripcion").setDescription("Descripcion"))
    .addStringOption(o => o.setName("color").setDescription("#HEX o Blue"))
    .addStringOption(o => o.setName("imagen").setDescription("URL imagen")),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Anuncio en el canal")
    .addStringOption(o => o.setName("titulo").setDescription("Titulo").setRequired(true))
    .addStringOption(o => o.setName("mensaje").setDescription("Mensaje").setRequired(true))
    .addStringOption(o => o.setName("imagen").setDescription("Imagen")),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsar usuario")
    .addStringOption(o => o.setName("user").setDescription("Usuario").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banear usuario")
    .addStringOption(o => o.setName("user").setDescription("Usuario").setRequired(true)),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Desbanear usuario")
    .addStringOption(o => o.setName("id").setDescription("ID").setRequired(true)),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Silenciar usuario")
    .addStringOption(o => o.setName("user").setDescription("Usuario").setRequired(true))
    .addIntegerOption(o => o.setName("tiempo").setDescription("Minutos").setRequired(true)),

  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Quitar mute")
    .addStringOption(o => o.setName("user").setDescription("Usuario").setRequired(true)),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Borrar mensajes")
    .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad").setRequired(true)),

  new SlashCommandBuilder().setName("lock").setDescription("Bloquear canal"),
  new SlashCommandBuilder().setName("unlock").setDescription("Desbloquear canal"),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Dar warn")
    .addStringOption(o => o.setName("user").setDescription("Usuario").setRequired(true)),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Ver warns")
    .addStringOption(o => o.setName("user").setDescription("Usuario").setRequired(true)),

  new SlashCommandBuilder()
    .setName("setlogs")
    .setDescription("Set logs channel id")
    .addStringOption(o => o.setName("id").setDescription("ID canal").setRequired(true)),

  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Pregunta al bot")
    .addStringOption(o => o.setName("pregunta").setDescription("Pregunta").setRequired(true)),

  new SlashCommandBuilder().setName("dice").setDescription("Tirar dado"),
  new SlashCommandBuilder().setName("coinflip").setDescription("Cara o cruz"),

  new SlashCommandBuilder().setName("panel").setDescription("Panel de tickets")
];

// ================= REGISTER =================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.log("❌ Faltan variables de entorno");
    return;
  }

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

// ================= BOT =================
client.on("interactionCreate", async (i) => {

  if (i.isChatInputCommand()) {

    const cmd = i.commandName;

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

    if (cmd === "ping") return i.reply(`🏓 ${client.ws.ping}ms`);

    if (cmd === "say") {
      if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator))
        return i.reply({ content: "❌ Sin permisos", ephemeral: true });

      const msg = i.options.getString("mensaje");
      if (!msg) return i.reply("Mensaje vacío");

      await i.channel.send(msg);
      return i.reply({ content: "✅ Enviado", ephemeral: true });
    }

    if (cmd === "embedpro") {

      const nombre = i.options.getString("nombre") ?? "Zyrox";
      const titulo = i.options.getString("titulo") ?? "";
      const descripcion = i.options.getString("descripcion") ?? "";
      const colorInput = i.options.getString("color");
      const imagen = i.options.getString("imagen");

      let color = colorInput ?? "Blue";

      const embed = new EmbedBuilder()
        .setAuthor({ name: nombre })
        .setTitle(titulo)
        .setDescription(descripcion)
        .setColor(color);

      if (typeof imagen === "string" && imagen.startsWith("http")) {
        embed.setImage(imagen);
      }

      return i.reply({ embeds: [embed] });
    }

    if (cmd === "announce") {

      const titulo = i.options.getString("titulo") ?? "";
      const mensaje = i.options.getString("mensaje") ?? "";
      const imagen = i.options.getString("imagen");

      const embed = new EmbedBuilder()
        .setTitle(titulo)
        .setDescription(mensaje)
        .setColor("Gold");

      if (typeof imagen === "string" && imagen.startsWith("http")) {
        embed.setImage(imagen);
      }

      return i.channel.send({ embeds: [embed] });
    }

    if (cmd === "kick") {
      const m = await getUser(i.guild, i.options.getString("user"));
      if (!m) return i.reply("Usuario no encontrado");
      await m.kick();
      return i.reply("Kick");
    }

    if (cmd === "ban") {
      const m = await getUser(i.guild, i.options.getString("user"));
      if (!m) return i.reply("Usuario no encontrado");
      await m.ban();
      return i.reply("Ban");
    }

    if (cmd === "unban") {
      await i.guild.members.unban(i.options.getString("id"));
      return i.reply("Unban");
    }

    if (cmd === "mute") {
      const m = await getUser(i.guild, i.options.getString("user"));
      if (!m) return i.reply("Usuario no encontrado");
      await m.timeout(i.options.getInteger("tiempo") * 60000);
      return i.reply("Mute");
    }

    if (cmd === "unmute") {
      const m = await getUser(i.guild, i.options.getString("user"));
      if (!m) return i.reply("Usuario no encontrado");
      await m.timeout(null);
      return i.reply("Unmute");
    }

    if (cmd === "clear") {
      await i.channel.bulkDelete(i.options.getInteger("cantidad"));
      return i.reply({ content: "Borrado", ephemeral: true });
    }

    if (cmd === "lock") {
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: false });
      return i.reply("Lock");
    }

    if (cmd === "unlock") {
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: true });
      return i.reply("Unlock");
    }

    if (cmd === "warn") {
      const u = i.options.getString("user");
      if (!warns[u]) warns[u] = [];
      warns[u].push("warn");
      return i.reply("Warn");
    }

    if (cmd === "warnings") {
      const u = i.options.getString("user");
      return i.reply(String((warns[u] || []).length));
    }

    if (cmd === "setlogs") {
      logsChannel = i.options.getString("id");
      return i.reply("Logs set");
    }

    if (cmd === "8ball") {
      const r = ["Sí", "No", "Tal vez", "Obvio"];
      return i.reply(r[Math.floor(Math.random() * r.length)]);
    }

    if (cmd === "dice") return i.reply("🎲 " + (Math.floor(Math.random() * 6) + 1));
    if (cmd === "coinflip") return i.reply(Math.random() > 0.5 ? "Cara" : "Cruz");

    if (cmd === "panel") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket")
          .setLabel("Abrir Ticket")
          .setStyle(ButtonStyle.Primary)
      );

      return i.reply({ content: "🎫 Panel de tickets", components: [row] });
    }
  }

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

      return i.reply({ content: `✅ Ticket creado: ${ch}`, ephemeral: true });
    }
  }
});

client.login(TOKEN);
