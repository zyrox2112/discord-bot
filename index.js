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

// 🌐 WEB (Render + UptimeRobot)
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

// ---------------- PANEL DE TICKETS ----------------
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

  // CREAR TICKET
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
      components: [row]
    });

    interaction.reply({ content: `✅ Ticket creado: ${canal}`, ephemeral: true });
  }

  // CERRAR TICKET
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

  // ping
  if (cmd === "ping") {
    return message.reply("🏓 Pong!");
  }

  // say
  if (cmd === "say") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply("❌ Sin permisos");

    const texto = args.join(" ");
    if (!texto) return message.reply("❌ Escribe algo");

    message.delete().catch(() => {});
    message.channel.send(texto);
  }

  // embed
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
    message.channel.send({ embeds: [embed] });
  }
});

// 🔑 LOGIN (SIEMPRE EN RENDER)
client.login(process.env.TOKEN);
