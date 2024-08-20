const fs = require("fs").promises;
const path = require("path");

module.exports = async (client) => {
  const SlashsArray = [];
  const commandsFolder = path.join(__dirname, "../commands");

  try {
    const folders = await fs.readdir(commandsFolder);
    
    for (const subfolder of folders) {
      const subfolderPath = path.join(commandsFolder, subfolder);
      const files = await fs.readdir(subfolderPath);
      
      for (const file of files) {
        if (!file.endsWith(".js")) continue;

        const filePath = path.join(subfolderPath, file);
        const command = require(filePath);

        if (!command?.name) continue;

        client.slashCommands.set(command.name, command);
        SlashsArray.push(command);
      }
    }

    client.on("ready", () => {
      client.guilds.cache.forEach(guild => guild.commands.set(SlashsArray));
    });

    client.on("guildCreate", guild => {
      guild.commands.set(SlashsArray);
    });
  } catch (error) {
    console.error("Erro ao carregar comandos:", error);
  }
};