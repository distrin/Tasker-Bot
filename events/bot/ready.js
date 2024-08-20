const gradient = require('gradient-flag');

module.exports = {
    name: "ready",
    run: async (client) => {
        console.clear();
        console.log("\n");

        const username = client.user.username;
        const userId = client.user.id;
        const version = "1.0.0";

        console.log(gradient.rainbow(`> Estou online em ${username} (${userId}) <`));
        console.log(gradient.rainbow(`Versão: ${version}`));
        console.log(gradient.rainbow(`Comandos carregados:`));

        client.slashCommands.forEach(({ name, description }) => {
            console.log(gradient.rainbow(`- ${name}: ${description}`));
        });

        console.log(gradient.rainbow(`> Pronto para receber comandos! <`));

        process.on('unhandledRejection', (reason, promise) => {
            console.error(gradient.rainbow('🚫 Erro Detectado (Unhandled Rejection):'), reason);
        });

        process.on('uncaughtException', (error, origin) => {
            console.error(gradient.rainbow('🚫 Erro Detectado (Uncaught Exception):'), error, origin);
        });

        client.guilds.cache.forEach(guild => {
            const botMember = guild.members.cache.get(client.user.id);
            if (!botMember.permissions.has("Administrator")) {
                console.warn(gradient.rainbow(`Aviso: O bot não tem permissões de administrador no servidor ${guild.name}`));
            }
        });
    }
}