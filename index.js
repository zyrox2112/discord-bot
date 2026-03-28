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

// ================= WEB (Render keep alive) =================
const app = express();
app.get("/", (req, res) => res.send("Zyrox ONLINE 😈"));
app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Web server listo");
});

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
const EMOJI = "🎫";

// ================= MEMORY =================
let ticketsCount = {};
let ticketOwner = {};

// ================= READY =================
client.once("ready", () => {
  console.log(`🟢 ${client.user.tag} ONLINE`);
});

// ================= PANEL =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "z!panel") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Sistema de Tickets - Zyrox Gang")
      .setColor("Blue")
      .setDescription(
`En este sistema podrás reportar dudas, usuarios, problemas, etc. ${EMOJI}

Abre un ticket y el staff te atenderá 😈`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_ticket")
        .setLabel("Abrir Ticket")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("👑")
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ================= COMMANDS =================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

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

    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(args.join(" "))
          .setColor("Random")
      ]
    });

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

// ================= INTERACTIONS =================
client.on("interactionCreate", async (i) => {
  if (!i.isButton()) return;

  if (i.customId === "open_ticket") {
    const modal = new ModalBuilder()
      .setCustomId("ticket_form")
      .setTitle("Crear Ticket");

    const reason = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("¿Qué necesitas?")
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(new ActionRowBuilder().addComponents(reason));

    return i.showModal(modal);
  }

  if (i.customId === "close_ticket") {
    i.reply({ content: "🔒 Cerrando ticket...", ephemeral: true });
    setTimeout(() => i.channel.delete(), 2000);
  }
});

// ================= FORM =================
client.on("interactionCreate", async (i) => {
  if (!i.isModalSubmit()) return;
  if (i.customId !== "ticket_form") return;

  const reason = i.fields.getTextInputValue("reason");

  if (!ticketsCount[i.user.id]) ticketsCount[i.user.id] = 0;
  if (ticketsCount[i.user.id] >= 3)
    return i.reply({ content: "❌ Máx 3 tickets", ephemeral: true });

  const ch = await i.guild.channels.create({
    name: `ticket-${i.user.username}`,
    parent: CATEGORY_ID,
    permissionOverwrites: [
      { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ...STAFF_ROLES.map(r => ({
        id: r,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
      }))
    ]
  });

  ticketOwner[ch.id] = i.user.id;
  ticketsCount[i.user.id]++;

  ch.send({
    content: `<@${i.user.id}> | Staff`,
    embeds: [
      new EmbedBuilder()
        .setTitle("🎫 Ticket Abierto")
        .setDescription(`Motivo: ${reason}`)
        .setColor("Green")
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Cerrar Ticket")
          .setStyle(ButtonStyle.Danger)
      )
    ]
  });

  i.reply({ content: `✅ Ticket creado: ${ch}`, ephemeral: true });
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
