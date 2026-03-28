// ================= IMPORTS =================
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

require("dotenv").config(); // 👈 IMPORTANTE PARA .ENV

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

// ================= CHECK TOKEN =================
console.log("🔑 TOKEN LOADED:", !!process.env.TOKEN);

// ================= CONFIG =================
const PREFIX = "z!";

const STAFF_ROLES = ["1475150139797667842"];
const CATEGORY_ID = "1478407828849819854";
const EMOJI = "<:ticket:1478797985633796257>";

// ================= MEMORY =================
let ticketsCount = {};
let ticketOwner = {};
let logsChannel = null;

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

*Para abrir un ticket, presiona el botón y proporciona la información solicitada por el equipo del staff.*

**¿Cómo funciona?**

${EMOJI} Abres tu ticket  
${EMOJI} Un moderador te atenderá  
${EMOJI} Se resolverá tu caso  
${EMOJI} El ticket será cerrado  

**¿Para qué sirve?**

${EMOJI} Resolver dudas  
${EMOJI} Reportar usuarios o estafadores  
${EMOJI} Alianzas y Afiliaciones  
${EMOJI} Reclamar recompensas  
${EMOJI} Comprar Promoción  

Gracias por usar Zyrox Gang 😈`
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

  // 🏓 ping
  if (cmd === "ping") {
    return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
  }

  // 💬 say (staff)
  if (cmd === "say") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    const text = args.join(" ");
    message.channel.send(text);
    message.delete();
  }

  // 🎨 embed (staff)
  if (cmd === "embed") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    const text = args.join(" ");
    message.channel.send({
      embeds: [new EmbedBuilder().setDescription(text).setColor("Random")]
    });

    message.delete();
  }

  // 🔒 lock
  if (cmd === "lock") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false
    });

    message.reply("🔒 Canal bloqueado");
  }

  // 🔓 unlock
  if (cmd === "unlock") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: true
    });

    message.reply("🔓 Canal desbloqueado");
  }

  // 📝 nick
  if (cmd === "nick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    const user = message.mentions.members.first();
    const name = args.slice(1).join(" ");

    if (!user || !name) return message.reply("Uso: z!nick @user nombre");

    user.setNickname(name);
    message.reply("📝 Nick cambiado");
  }

  // ⚙️ setlogs
  if (cmd === "setlogs") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    logsChannel = args[0];
    message.reply("⚙️ Logs guardados");
  }

  // 🎮 juegos
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

// ================= TICKETS =================
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
    content: `<@&${STAFF_ROLES[0]}> | <@${i.user.id}>`,
    embeds: [
      new EmbedBuilder()
        .setTitle("🎫 Ticket Abierto")
        .setDescription(`**Motivo:** ${reason}`)
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

// ================= LOGIN (FIX RENDER) =================
client.login(process.env.TOKEN);
