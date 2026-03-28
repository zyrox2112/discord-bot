const express = require("express");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

// ================= WEB =================
const app = express();
app.get("/", (req, res) => res.send("Zyrox ONLINE 😈"));
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
const PREFIX = "z!";
const STAFF_ROLES = ["1475150139797667842"];
const CATEGORY_ID = "1478407828849819854";

// ================= DATA =================
let ticketsCount = {};

// ================= READY =================
client.once("ready", () => {
  console.log(`🟢 ${client.user.tag} ONLINE`);
});

// ================= PANEL =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "z!panel") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Sistema de Tickets")
      .setColor("#2b2d31")
      .setDescription(
        "Presiona el botón para abrir un ticket con el staff.\n\n⚡ Respuesta rápida\n🔒 Soporte privado\n🎯 Atención directa"
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_ticket")
        .setLabel("Abrir Ticket")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🎫")
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ================= COMMANDS =================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // ================= HELP PRO =================
  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Zyrox System - Help Menu")
      .setColor("#5865F2")
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription("Lista completa de comandos del bot 😈")
      .addFields(
        {
          name: "⚙️ General",
          value:
            "`z!ping` → ver latencia del bot\n" +
            "`z!help` → muestra este menú",
        },
        {
          name: "🎮 Diversión",
          value:
            "`z!8ball` → pregunta mágica\n" +
            "`z!dice` → lanzar dado\n" +
            "`z!coinflip` → cara o cruz",
        },
        {
          name: "🛠 Moderación",
          value:
            "`z!say` → repetir mensaje (admin)\n" +
            "`z!embed` → mensaje embed (admin)\n" +
            "`z!lock` → bloquear canal\n" +
            "`z!unlock` → desbloquear canal",
        },
        {
          name: "🎫 Tickets",
          value:
            "`z!panel` → abrir sistema de tickets\n" +
            "Botón → crear ticket privado"
        }
      )
      .setFooter({ text: "Zyrox System • Made for your server 😈" });

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "ping") {
    return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
  }

  if (cmd === "say") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    message.channel.send(args.join(" "));
    message.delete();
  }

  if (cmd === "embed") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const embed = new EmbedBuilder()
      .setDescription(args.join(" "))
      .setColor("#2b2d31");

    message.channel.send({ embeds: [embed] });
    message.delete();
  }

  if (cmd === "lock") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false
    });

    message.reply("🔒 Canal bloqueado");
  }

  if (cmd === "unlock") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: true
    });

    message.reply("🔓 Canal desbloqueado");
  }

  if (cmd === "8ball") {
    const r = ["Sí", "No", "Tal vez", "Obvio", "xd"];
    message.reply(r[Math.floor(Math.random() * r.length)]);
  }

  if (cmd === "dice") {
    message.reply(`🎲 ${Math.floor(Math.random() * 6) + 1}`);
  }

  if (cmd === "coinflip") {
    message.reply(Math.random() < 0.5 ? "🪙 Cara" : "🪙 Cruz");
  }
});

// ================= TICKETS FIXED =================
client.on("interactionCreate", async (i) => {
  if (!i.isButton()) return;

  if (i.customId === "open_ticket") {
    const modal = new ModalBuilder()
      .setCustomId("ticket_form")
      .setTitle("Crear Ticket");

    const reason = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Describe tu problema")
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(new ActionRowBuilder().addComponents(reason));

    return i.showModal(modal);
  }

  if (i.customId === "close_ticket") {
    await i.reply({ content: "🔒 Cerrando ticket...", ephemeral: true });
    setTimeout(() => i.channel.delete().catch(() => {}), 2000);
  }
});

// ================= FORM FIXED =================
client.on("interactionCreate", async (i) => {
  if (!i.isModalSubmit()) return;
  if (i.customId !== "ticket_form") return;

  const reason = i.fields.getTextInputValue("reason");

  if (!ticketsCount[i.user.id]) ticketsCount[i.user.id] = 0;
  if (ticketsCount[i.user.id] >= 3)
    return i.reply({ content: "❌ Máximo 3 tickets activos", ephemeral: true });

  const channel = await i.guild.channels.create({
    name: `ticket-${i.user.username}`,
    parent: CATEGORY_ID,
    permissionOverwrites: [
      {
        id: i.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: i.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      },
      ...STAFF_ROLES.map(r => ({
        id: r,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }))
    ]
  });

  ticketsCount[i.user.id]++;

  const embed = new EmbedBuilder()
    .setTitle("🎫 Ticket Abierto")
    .setColor("#57F287")
    .setDescription(`**Usuario:** <@${i.user.id}>\n**Motivo:** ${reason}`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Cerrar Ticket")
      .setStyle(ButtonStyle.Danger)
  );

  channel.send({
    content: `<@${i.user.id}> <@&${STAFF_ROLES[0]}>`,
    embeds: [embed],
    components: [row]
  });

  i.reply({ content: `✅ Ticket creado: ${channel}`, ephemeral: true });
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
