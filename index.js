const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();

// 🌐 WEB (para uptime)
app.get("/", (req, res) => {
  res.send("Bot activo 😎");
});

// 🔥 IMPORTANTE: puerto correcto en Replit
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Web encendida 🚀");
});

// 🤖 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log("BOT ONLINE 😎");
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content === "z!ping") {
    message.reply("🏓 Pong!");
  }
});

// 🔐 TOKEN desde Secrets
if (process.env.REPLIT_DEPLOYMENT) {
  console.log("Modo deploy (solo web)");
} else {
  client.login(process.env.TOKEN);
}
