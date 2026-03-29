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

// ================= IA =================
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// memoria por usuario
let memory = {};

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
let warns = {};
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
      .setTitle("🎫 Sistema de Tickets")
      .setColor("#5865F2")
      .setDescription(`
En este sistema podrás reportar dudas, usuarios, problemas, etc.

*Para abrir un ticket, presiona el botón y completa el formulario.*

**¿Cómo funciona?**
📩 Abres tu ticket  
👨‍💻 Un moderador te atenderá  
✅ Se resolverá tu caso  
🔒 El ticket será cerrado  

**¿Para qué sirve?**
• Resolver dudas  
• Reportar usuarios  
• Alianzas  
• Recompensas  
• Compras  

⚠️ Ten paciencia, el staff responderá pronto.
      `);

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

// ================= COMANDOS =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ================= IA (COMANDO + MENCIÓN) =================
  if (
    message.content.startsWith("z!ai") ||
    message.mentions.has(client.user)
  ) {
    let prompt;

    if (message.content.startsWith("z!ai")) {
      prompt = message.content.slice(4).trim();
    } else {
      prompt = message.content.replace(/<@!?\\d+>/g, "").trim();
    }

    if (!prompt) return message.reply("Habla po 😡");

    try {
      if (!memory[message.author.id]) memory[message.author.id] = [];

      memory[message.author.id].push({
        role: "user",
        content: prompt
      });

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: memory[message.author.id]
      });

      const reply = res.choices[0].message.content;

      memory[message.author.id].push({
        role: "assistant",
        content: reply
      });

      if (memory[message.author.id].length > 10) {
        memory[message.author.id].shift();
      }

      return message.reply(reply);

    } catch (err) {
      console.error(err);
      return message.reply("❌ Error IA (revisa API)");
    }
  }

  // ================= PREFIX =================
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // ================= HELP =================
  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Zyrox System - Help")
      .setColor("#5865F2")
      .addFields(
        {
          name: "⚙️ General",
          value: "`z!ping`\n`z!help`\n`z!ai <mensaje>`"
        },
        {
          name: "🎮 Diversión",
          value: "`z!8ball`\n`z!dice`\n`z!coinflip`"
        },
        {
          name: "🛠 Moderación",
          value: "`z!say`\n`z!embed`\n`z!lock`\n`z!unlock`"
        },
        {
          name: "👮 Moderación 2",
          value: "`z!warn`\n`z!warnings`\n`z!setlogs`"
        },
        {
          name: "🎫 Tickets",
          value: "`z!panel` → abre sistema"
        }
      );

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

  if (cmd === "warn") {
    const user = message.mentions.users.first();
    if (!user) return message.reply("Menciona a alguien");

    if (!warns[user.id]) warns[user.id] = [];
    warns[user.id].push(args.slice(1).join(" ") || "Sin razón");

    message.reply("⚠️ Warn aplicado");
  }

  if (cmd === "warnings") {
    const user = message.mentions.users.first();
    if (!user) return;

    const lista = warns[user.id] || [];
    message.reply(lista.join("\n") || "Sin warns");
  }

  if (cmd === "setlogs") {
    logsChannel = args[0];
    message.reply("Logs configurados");
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

// ================= TICKETS =================
client.on("interactionCreate", async (i) => {

  if (i.isButton()) {
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
      await i.reply({ content: "🔒 Cerrando...", ephemeral: true });
      setTimeout(() => i.channel.delete().catch(() => {}), 2000);
    }
  }

  if (i.isModalSubmit()) {
    if (i.customId !== "ticket_form") return;

    const reason = i.fields.getTextInputValue("reason");

    if (!ticketsCount[i.user.id]) ticketsCount[i.user.id] = 0;
    if (ticketsCount[i.user.id] >= 3)
      return i.reply({ content: "❌ Máximo 3 tickets", ephemeral: true });

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
      content: `<@${i.user.id}>`,
      embeds: [embed],
      components: [row]
    });

    i.reply({ content: `✅ Ticket creado: ${channel}`, ephemeral: true });
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
