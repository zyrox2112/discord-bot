const express = require("express");
const fetch = require("node-fetch");

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
let aiMemory = {}; // 🧠 memoria IA

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
      .setDescription("Presiona el botón para abrir un ticket con el staff.");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_ticket")
        .setLabel("Abrir Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ================= COMMANDS =================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // ================= IA CON MEMORIA =================
  if (cmd === "ai") {

    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Escribe algo");

    const userId = message.author.id;

    if (!aiMemory[userId]) {
      aiMemory[userId] = [
        {
          role: "system",
          content: "Eres un bot gamer latino, hablas como bro, usas humor xd."
        }
      ];
    }

    aiMemory[userId].push({
      role: "user",
      content: prompt
    });

    // 🔥 limitar memoria (últimos 10 mensajes)
    if (aiMemory[userId].length > 10) {
      aiMemory[userId].splice(1, 1);
    }

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: aiMemory[userId]
        })
      });

      const data = await res.json();

      if (!data.choices) {
        console.log(data);
        return message.reply("❌ Error IA");
      }

      const reply = data.choices[0].message.content;

      aiMemory[userId].push({
        role: "assistant",
        content: reply
      });

      message.reply(reply);

    } catch (err) {
      console.error(err);
      message.reply("❌ Error IA");
    }
  }

  // ================= OTROS COMANDOS =================
  if (cmd === "ping") return message.reply(`🏓 Pong! ${client.ws.ping}ms`);

  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setTitle("📜 Zyrox System")
      .setDescription("Comandos disponibles:\n\nz!ai\nz!ping\nz!panel");

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "8ball") {
    const r = ["Sí", "No", "Tal vez"];
    message.reply(r[Math.floor(Math.random() * r.length)]);
  }

  if (cmd === "dice") {
    message.reply(`🎲 ${Math.floor(Math.random() * 6) + 1}`);
  }

  if (cmd === "coinflip") {
    message.reply(Math.random() < 0.5 ? "Cara" : "Cruz");
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
      .setLabel("Describe tu problema")
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(new ActionRowBuilder().addComponents(reason));

    return i.showModal(modal);
  }

  if (i.customId === "close_ticket") {
    await i.reply({ content: "🔒 Cerrando...", ephemeral: true });
    setTimeout(() => i.channel.delete(), 2000);
  }
});

client.on("interactionCreate", async (i) => {
  if (!i.isModalSubmit()) return;
  if (i.customId !== "ticket_form") return;

  const reason = i.fields.getTextInputValue("reason");

  const channel = await i.guild.channels.create({
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

  const embed = new EmbedBuilder()
    .setTitle("🎫 Ticket")
    .setDescription(`Motivo: ${reason}`);

  channel.send({
    content: `<@${i.user.id}> <@&${STAFF_ROLES[0]}>`,
    embeds: [embed]
  });

  i.reply({ content: "✅ Ticket creado", ephemeral: true });
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
