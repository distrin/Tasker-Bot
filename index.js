const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
const { token } = require("./config.json");
const eventsHandler = require("./handler/Events");
const commandHandler = require("./handler/index");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction
  ]
});

client.slashCommands = new Collection();

async function initializeBot() {
  try {
    await client.login(token);
    console.log('Bot logado com sucesso!');

    eventsHandler(client);
    commandHandler(client);

    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚫 Promessa não tratada rejeitada:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('🚫 Exceção não capturada:', error);
    });
  } catch (error) {
    console.error('Erro ao inicializar o bot:', error);
  }
}

initializeBot();

module.exports = client;