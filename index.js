// ================= IMPORTS =================
const express = require("express");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// ================= WEB =================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Zyrox GOD 😈"));
app.listen(PORT, "0.0.0.0");

// ================= ANTI-CRASH =================
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ================= BOT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = "z!";

// ================= DB SIMPLE =================
let logsChannel = null;
let warns = {};

// ================= READY =================
client.once("ready", () => {
  console.log(`🔥 ${client.user.tag} ONLINE`);
});

// ================= LOG =================
function sendLog(guild, msg) {
  if (!logsChannel) return;
  const channel = guild.channels.cache.get(logsChannel);
  if (channel) channel.send(msg);
}

// ================= PANEL =================
client.on("messageCreate", async (m) => {
  if (m.author.bot) return;

  if (m.content === "z!panel") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Sistema de Tickets")
      .setDescription("Presiona el botón para abrir un ticket")
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_open")
        .setLabel("🎫 Crear Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    m.channel.send({ embeds: [embed], components: [row] });
  }
});

// ================= BOTONES =================
client.on("interactionCreate", async (i) => {
  if (!i.isButton()) return;

  if (i.customId === "ticket_open") {
    const ch = await i.guild.channels.create({
      name: `ticket-${i.user.username}`,
      permissionOverwrites: [
        { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Cerrar").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("ticket_claim").setLabel("📌 Reclamar").setStyle(ButtonStyle.Secondary)
    );

    ch.send({
      content: `<@${i.user.id}>`,
      components: [row],
      allowedMentions: { parse: [] }
    });

    sendLog(i.guild, `🎫 Ticket creado por ${i.user.tag}`);
    i.reply({ content: `Ticket: ${ch}`, ephemeral: true });
  }

  if (i.customId === "ticket_close") {
    sendLog(i.guild, "🔒 Ticket cerrado");
    i.reply("Cerrando...");
    setTimeout(() => i.channel.delete(), 3000);
  }

  if (i.customId === "ticket_claim") {
    i.reply(`📌 ${i.user.tag} tomó el ticket`);
  }
});

// ================= COMANDOS =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // 🏓 ping
  if (cmd === "ping") return message.reply("🏓 Pong!");

  // 📜 HELP PRO
  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Zyrox System Help")
      .setColor("Blue")
      .setDescription(`
🏓 **z!ping**
→ Ver si el bot responde

🎫 **z!panel**
→ Crear panel de tickets (todos)

💬 **z!say**
→ Enviar mensaje como bot (staff)

🎨 **z!embed**
→ Enviar embed (staff)

🔒 **z!lock / z!unlock**
→ Bloquear o desbloquear canal (admin)

📝 **z!nick @user nombre**
→ Cambiar apodo (admin)

👮 **z!warn @user motivo**
→ Dar advertencia

📄 **z!warnings @user**
→ Ver advertencias

⚙️ **z!setlogs ID**
→ Configurar canal de logs (admin)

🎮 **z!8ball / z!dice / z!coinflip**
→ Comandos divertidos
      `);

    return message.reply({ embeds: [embed] });
  }

  // ⚙️ setlogs
  if (cmd === "setlogs") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Solo admins");

    logsChannel = args[0];
    return message.reply("✅ Canal de logs configurado");
  }

  // 💬 say
  if (cmd === "say") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply("❌ Sin permisos");

    const texto = args.join(" ");
    if (!texto) return message.reply("❌ Escribe algo");

    message.delete().catch(() => {});
    message.channel.send({
      content: texto,
      allowedMentions: { parse: [] }
    });
  }

  // 🎨 embed
  if (cmd === "embed") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply("❌ Sin permisos");

    const texto = args.join(" ");
    if (!texto) return message.reply("❌ Escribe algo");

    const embed = new EmbedBuilder()
      .setTitle("📢 Zyrox System")
      .setDescription(texto)
      .setColor("Blue");

    message.channel.send({
      embeds: [embed],
      allowedMentions: { parse: [] }
    });
  }

  // 🔒 lock
  if (cmd === "lock") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Solo admins");

    await message.channel.permissionOverwrites.edit(message.guild.id, {
      SendMessages: false
    });

    sendLog(message.guild, `🔒 ${message.author.tag} bloqueó canal`);
    message.channel.send("🔒 Canal bloqueado");
  }

  // 🔓 unlock
  if (cmd === "unlock") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Solo admins");

    await message.channel.permissionOverwrites.edit(message.guild.id, {
      SendMessages: true
    });

    sendLog(message.guild, `🔓 ${message.author.tag} desbloqueó canal`);
    message.channel.send("🔓 Canal desbloqueado");
  }

  // 📝 nick
  if (cmd === "nick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Solo admins");

    const user = message.mentions.members.first();
    if (!user) return message.reply("❌ Menciona un usuario");

    const nuevo = args.slice(1).join(" ");
    if (!nuevo) return message.reply("❌ Escribe el nombre");

    await user.setNickname(nuevo);
    message.channel.send(`📝 Apodo cambiado a ${nuevo}`);
  }

  // 👮 warn
  if (cmd === "warn") {
    const user = message.mentions.users.first();
    if (!user) return message.reply("❌ Menciona un usuario");

    if (!warns[user.id]) warns[user.id] = [];
    warns[user.id].push(args.slice(1).join(" ") || "Sin razón");

    sendLog(message.guild, `⚠️ ${user.tag} fue advertido`);
    message.reply("⚠️ Warn aplicado");
  }

  // 📄 warnings
  if (cmd === "warnings") {
    const user = message.mentions.users.first();
    if (!user) return message.reply("❌ Menciona un usuario");

    const lista = warns[user.id] || [];
    message.reply(lista.length ? lista.join("\n") : "Sin warns");
  }

  // 🎮 fun
  if (cmd === "8ball") {
    const respuestas = ["Sí", "No", "Tal vez", "Obvio", "Nunca"];
    message.reply(respuestas[Math.floor(Math.random() * respuestas.length)]);
  }

  if (cmd === "dice") {
    message.reply(`🎲 ${Math.floor(Math.random() * 6) + 1}`);
  }

  if (cmd === "coinflip") {
    message.reply(Math.random() > 0.5 ? "Cara" : "Cruz");
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
