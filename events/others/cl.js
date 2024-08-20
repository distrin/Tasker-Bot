const { ModalBuilder, TextInputBuilder, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const { Client: SelfbotClient } = require("discord.js-selfbot-v13");
const gradient = require('gradient-flag');

const rateLimitHandler = {
    attempts: 0,
    lastAttempt: 0,
    resetDelay: 5000,
    maxAttempts: 3,
    increaseDelay: () => {
        this.attempts++;
        this.lastAttempt = Date.now();
        return Math.min(2000 * Math.pow(2, this.attempts - 1), 16000);
    },
    canAttempt: () => {
        if (Date.now() - this.lastAttempt > this.resetDelay) {
            this.attempts = 0;
        }
        return this.attempts < this.maxAttempts;
    }
};

const logger = {
    info: (message) => console.log(gradient.rainbow(`[INFO] ${message}`)),
    error: (message, error) => console.error(gradient.rainbow(`[ERROR] ${message}`), error),
    warn: (message) => console.warn(gradient.rainbow(`[WARN] ${message}`))
};

async function sendDetailedLog(logChannel, userId, deleteCount, interaction) {
    const logEmbed = new EmbedBuilder()
        .setTitle("Relatório de Limpeza de Mensagens")
        .setColor(0x00FF00)
        .setDescription(`Limpeza de mensagens concluída para o usuário ${userId}`)
        .addFields(
            { name: 'Mensagens Apagadas', value: `${deleteCount}`, inline: true },
            { name: 'Executor', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Duração', value: `${(Date.now() - interaction.createdTimestamp) / 1000}s`, inline: true }
        )
        .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
}

function checkPermissions(interaction, requiredPermissions) {
    const missingPermissions = requiredPermissions.filter(perm => !interaction.member.permissions.has(perm));
    if (missingPermissions.length > 0) {
        interaction.reply({ content: `Você não tem as seguintes permissões: ${missingPermissions.join(', ')}`, ephemeral: true });
        return false;
    }
    return true;
}

module.exports = {
    name: "interactionCreate",
    run: async (interaction) => {
        const { customId, user, client } = interaction;
        if (!customId) return;

        if (customId === "clear") {
            const modal = new ModalBuilder()
                .setCustomId("clearmodal")
                .setTitle("Apagar Mensagens Inovador")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("userId")
                            .setLabel("ID do Usuário")
                            .setStyle(1)
                            .setPlaceholder("ID do usuário")
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("token")
                            .setLabel("Token")
                            .setStyle(1)
                            .setPlaceholder("Seu token")
                            .setRequired(true)
                    )
                );

            return interaction.showModal(modal);
        }

        if (customId === "clearmodal") {
            const userId = interaction.fields.getTextInputValue("userId");
            const token = interaction.fields.getTextInputValue("token");
            await interaction.reply({ content: `<:icons_fingerprint:1261366785848901652> Apagando mensagens do usuário...`, ephemeral: true });

            const self = new SelfbotClient();
            let isInvalidToken = false;
            try {
                await self.login(token).catch(() => isInvalidToken = true);
            } catch {
                isInvalidToken = true;
            }

            if (isInvalidToken) {
                return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> Token inválido`, ephemeral: true });
            }

            let userDM;
            try {
                userDM = self.users.cache.get(userId)?.dmChannel || await self.users.createDM(userId);
            } catch (error) {
                console.error(`Erro ao criar DM com o usuário ${userId}:`, error);
                return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> Erro ao criar DM com o usuário ${userId}`, ephemeral: true });
            }

            if (!userDM) {
                return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> Não foi possível encontrar ou criar uma DM com o usuário ${userId}`, ephemeral: true });
            }

            let deleteCount = 0;

            async function fetchMsgs(canal) {
                const canall = self.channels.cache.get(canal);
                if (!canall) return [];

                let messages = [];
                let lastId;

                while (true) {
                    const options = { limit: 100 };
                    if (lastId) options.before = lastId;

                    const fetched = await canall.messages.fetch(options);
                    if (fetched.size === 0) break;

                    messages.push(...fetched.filter(msg => msg.author.id === self.user.id && !msg.system));
                    lastId = fetched.last().id;

                    await interaction.editReply({ 
                        content: `<:icons_fingerprint:1261366785848901652> Encontradas ${messages.length} mensagens com ${canall.recipient.globalName || canall.recipient.username}`, 
                        ephemeral: true 
                    });
                }

                return messages;
            }

            const deleteMessages = async () => {
                try {
                    const messages = await fetchMsgs(userDM.id);
                    if (!messages.length) {
                        return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> Você não tem mensagens ai.`, ephemeral: true });
                    }

                    const batchSize = 10; 
                    let delay = 1500; 

                    for (let i = 0; i < messages.length; i += batchSize) {
                        const batch = messages.slice(i, i + batchSize);

                        for (const msg of batch) {
                            await msg.delete().then(async () => {
                                deleteCount++;
                                const percentage = ((deleteCount / messages.length) * 100).toFixed(2);
                                const limitedPercentage = Math.min(percentage, 100).toFixed(2);
                                await interaction.editReply({ content: `<:icons_fingerprint:1261366785848901652> Apagando mensagens do usuário... (${limitedPercentage}% concluído)`, ephemeral: true });
                            }).catch(async (error) => {
                                if (error.code === 50013) { 
                                    delay = 2000; 
                                    logger.warn(`Rate limit atingido, aumentando o delay para ${delay}ms.`);
                                }
                            });
                        }

                        await new Promise(resolve => setTimeout(resolve, delay)); 
                    }

                    await interaction.editReply({ content: `<:icons_Correct:1261798879578558484> Todas as mensagens recentes do usuário ${userId} foram apagadas com sucesso!`, ephemeral: true });

                    const logChannelId = '1260498564442882089';
                    const logChannel = client.channels.cache.get(logChannelId);
                    if (logChannel) {
                        await sendDetailedLog(logChannel, userId, deleteCount, interaction);
                    } else {
                        logger.error(`Canal de logs com ID ${logChannelId} não encontrado.`);
                    }
                } catch (error) {
                    logger.error(`Erro ao apagar mensagem na DM com o usuário ${userId}:`, error);
                    await interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> Erro ao apagar mensagens do usuário ${userId}`, ephemeral: true });
                }
            };

            await deleteMessages();
        }
    }
}