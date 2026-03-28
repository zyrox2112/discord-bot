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

// 🌐 WEB
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Zyrox System activo 😈");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Web encendida");
});

// 💀 ANTI-CRASH
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = "z!";

client.once("ready", () => {
  console.log(`🤖 BOT ONLINE COMO ${client.user.tag}`);
});

// ---------------- PANEL TICKETS ----------------
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "z!panel") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Sistema de Tickets")
      .setDescription("Presiona el botón para abrir un ticket")
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("crear_ticket")
        .setLabel("🎫 Crear Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ---------------- BOTONES ----------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "crear_ticket") {
    const canal = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket abierto")
      .setDescription("Un staff te ayudará pronto")
      .setColor("Green");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cerrar_ticket")
        .setLabel("🔒 Cerrar Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    canal.send({
      content: `<@${interaction.user.id}>`,
      embeds: [embed],
      components: [row],
      allowedMentions: { parse: [] }
    });

    interaction.reply({ content: `✅ Ticket creado: ${canal}`, ephemeral: true });
  }

  if (interaction.customId === "cerrar_ticket") {
    if (!interaction.channel.name.startsWith("ticket-")) return;

    await interaction.reply("🔒 Cerrando ticket...");
    setTimeout(() => interaction.channel.delete(), 3000);
  }
});

// ---------------- COMANDOS ----------------
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // 🏓 ping
  if (cmd === "ping") return message.reply("🏓 Pong!");

  // 📜 help
  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Zyrox Help")
      .setColor("Blue")
      .setDescription(`
🏓 **z!ping** → ver si el bot responde

🎫 **z!panel** → crear panel de tickets (todos)

💬 **z!say** → enviar mensaje (staff)
🎨 **z!embed** → mensaje embed (staff)

🔒 **z!lock** → bloquear canal (admin)
🔓 **z!unlock** → desbloquear canal (admin)

📝 **z!nick @user nombre** → cambiar apodo (admin)
      `);

    return message.reply({ embeds: [embed] });
  }

  // 💬 say (PRIVADO)
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

  // 🎨 embed (PRIVADO)
  if (cmd === "embed") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply("❌ Sin permisos");

    const texto = args.join(" ");
    if (!texto) return message.reply("❌ Escribe algo");

    const embed = new EmbedBuilder()
      .setTitle("📢 Zyrox System")
      .setDescription(texto)
      .setColor("Blue")
      .setFooter({ text: `Por ${message.author.username}` });

    message.delete().catch(() => {});
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

    message.channel.send("🔒 Canal bloqueado");
  }

  // 🔓 unlock
  if (cmd === "unlock") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Solo admins");

    await message.channel.permissionOverwrites.edit(message.guild.id, {
      SendMessages: true
    });

    message.channel.send("🔓 Canal desbloqueado");
  }

  // 📝 nick
  if (cmd === "nick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Solo admins");

    const user = message.mentions.members.first();
    if (!user) return message.reply("❌ Menciona un usuario");

    const nuevo = args.slice(1).join(" ");
    if (!nuevo) return message.reply("❌ Escribe el nuevo nombre");

    user.setNickname(nuevo);
    message.channel.send(`📝 Apodo cambiado a ${nuevo}`);
  }
});

// 🔑 LOGIN
client.login(process.env.TOKEN);
