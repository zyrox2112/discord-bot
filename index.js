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

// ================= CONFIG =================
const STAFF_ROLES = [
  "1475150139797667842",
  "1475150139026051084",
  "1475150138036064376",
  "1475150133384446165",
  "1475150132147388477",
  "1475150130381328414",
  "1474997256833863793",
  "1475150129412706477",
  "1475150128011808870"
];

const TICKET_CATEGORY_ID = "1478407828849819854";

// ================= DB SIMPLE =================
let logsChannel = null;
let warns = {};
let ticketsAbiertos = {};
let ticketOwners = {};

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
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "z!panel") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Tickets | Zyrox Gang")
      .setDescription("Selecciona el tipo de ticket que necesitas")
      .setColor("Purple");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_dudas").setLabel("Dudas").setStyle(ButtonStyle.Success).setEmoji("1478798028407046377"),
      new ButtonBuilder().setCustomId("ticket_reporte").setLabel("Reportes").setStyle(ButtonStyle.Danger).setEmoji("1478797948979515637"),
      new ButtonBuilder().setCustomId("ticket_alianza").setLabel("Alianzas").setStyle(ButtonStyle.Secondary).setEmoji("1475869218938556450"),
      new ButtonBuilder().setCustomId("ticket_recompensa").setLabel("Recompensas").setStyle(ButtonStyle.Primary).setEmoji("1478798192773435532"),
      new ButtonBuilder().setCustomId("ticket_compra").setLabel("Compra").setStyle(ButtonStyle.Danger).setEmoji("1478798028407046377")
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ================= INTERACCIONES =================
client.on("interactionCreate", async (i) => {

  try {

    // ===== BOTONES =====
    if (i.isButton()) {

      if (i.customId.startsWith("ticket_")) {
        const tipo = i.customId.split("_")[1];

        const modal = new ModalBuilder()
          .setCustomId(`form_${tipo}`)
          .setTitle(`Formulario - ${tipo}`);

        const p1 = new TextInputBuilder()
          .setCustomId("p1")
          .setLabel("¿Cuál es tu problema?")
          .setStyle(TextInputStyle.Paragraph);

        const p2 = new TextInputBuilder()
          .setCustomId("p2")
          .setLabel("Explica con detalle")
          .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(
          new ActionRowBuilder().addComponents(p1),
          new ActionRowBuilder().addComponents(p2)
        );

        return i.showModal(modal);
      }

      if (i.customId === "ticket_close") {
        const ownerId = ticketOwners[i.channel.id];

        if (ownerId && ticketsAbiertos[ownerId] > 0) {
          ticketsAbiertos[ownerId]--;
        }

        await i.reply({ content: "🔒 Cerrando...", ephemeral: true });
        setTimeout(() => i.channel.delete(), 3000);
      }

      if (i.customId === "ticket_claim") {
        return i.reply(`📌 ${i.user.tag} tomó el ticket`);
      }
    }

    // ===== FORMULARIO =====
    if (i.isModalSubmit()) {

      const tipo = i.customId.split("_")[1];
      const userId = i.user.id;

      if (!ticketsAbiertos[userId]) ticketsAbiertos[userId] = 0;

      if (ticketsAbiertos[userId] >= 3) {
        return i.reply({
          content: "❌ Ya tienes 3 tickets abiertos",
          ephemeral: true
        });
      }

      const r1 = i.fields.getTextInputValue("p1");
      const r2 = i.fields.getTextInputValue("p2");

      // 🔥 PERMISOS CORRECTOS
      let perms = [
        {
          id: i.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: userId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        }
      ];

      STAFF_ROLES.forEach(role => {
        perms.push({
          id: role,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        });
      });

      const ch = await i.guild.channels.create({
        name: `🎫-${tipo}-${i.user.username}`,
        parent: TICKET_CATEGORY_ID,
        permissionOverwrites: perms
      });

      ticketOwners[ch.id] = userId;
      ticketsAbiertos[userId]++;

      let textos = {
        dudas: "Bienvenido a tu ticket de dudas",
        reporte: "Bienvenido a tu ticket de reportes",
        alianza: "Bienvenido a tu ticket de alianzas",
        recompensa: "Bienvenido a tu ticket de recompensas",
        compra: "Bienvenido a tu ticket de compra"
      };

      const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket Abierto")
        .setColor("Gold")
        .setDescription(`
${textos[tipo]}, <@${userId}>

Un staff te atenderá pronto.

**📌 Problema:**
${r1}

**📌 Detalles:**
${r2}
        `);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Cerrar Ticket").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("ticket_claim").setLabel("📌 Reclamar Ticket").setStyle(ButtonStyle.Secondary)
      );

      await ch.send({
        content: `<@${userId}>`,
        embeds: [embed],
        components: [row]
      });

      return i.reply({
        content: `✅ Ticket creado: ${ch}`,
        ephemeral: true
      });
    }

  } catch (err) {
    console.error(err);

    if (!i.replied) {
      i.reply({
        content: "❌ Error al procesar el ticket",
        ephemeral: true
      });
    }
  }
});

// ================= COMANDOS =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if (cmd === "ping") return message.reply("🏓 Pong!");
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
