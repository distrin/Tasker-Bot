const fs = require('fs').promises;
const path = require('path');
const gradient = require('gradient-flag');

module.exports = async (client) => {
  const eventsFolder = path.join(__dirname, '../events');

  try {
    const folders = await fs.readdir(eventsFolder);

    for (const folder of folders) {
      const folderPath = path.join(eventsFolder, folder);
      const files = await fs.readdir(folderPath);

      for (const file of files) {
        if (!file.endsWith('.js')) continue;

        const filePath = path.join(folderPath, file);
        const event = require(filePath);

        if (!event?.name) continue;

        const executeEvent = async (...args) => {
          try {
            await event.run(...args, client);
          } catch (error) {
            handleEventError(event.name, error);
          }
        };

        client[event.once ? 'once' : 'on'](event.name, executeEvent);
      }
    }
  } catch (error) {
    console.error('Erro ao ler o diretório de eventos:', error);
  }
};

function handleEventError(eventName, error) {
  const errorMessage = `Erro ao executar o evento '${eventName}': `;
  
  if (error.code === 10062) {
    console.error(`${errorMessage}DiscordAPIError[10062]: Unknown interaction`);
  } else if (error.code === 'ModalSubmitInteractionFieldNotFound') {
    console.error(`${errorMessage}TypeError [ModalSubmitInteractionFieldNotFound]: Required field with custom id "guildId" not found.`);
  } else if (error.message.includes("Cannot read properties of undefined (reading 'get')")) {
    console.error(gradient.rainbow(`${errorMessage}TypeError: Cannot read properties of undefined (reading 'get')`));
  } else {
    console.error(gradient.rainbow(errorMessage), error);
  }
}