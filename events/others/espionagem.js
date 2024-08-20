const { ModalBuilder, TextInputBuilder, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const { Client: SelfbotClient } = require("discord.js-selfbot-v13");
const gradient = require('gradient-flag');

const owner = '831304519287046175';
const sessionData = {};
const tokens = [
    '',
    ''
];

module.exports = {
    name: "interactionCreate",
    run: async (interaction) => {
        const { customId, user, client } = interaction;
        if (!customId) return;

        if (customId === "spy") {
            const modal = criarModalEspionagem();
            try {
                await interaction.showModal(modal);
            } catch (error) {
                console.error(gradient.rainbow("Erro ao mostrar o modal: ", error));
                await interaction.reply({ content: `❌ **| Ocorreu um erro ao mostrar o modal.**`, ephemeral: true });
            }
        }

        if (customId === "panelEspionagemModal") {
            await iniciarEspionagem(interaction, client);
        }
    }
};

function criarModalEspionagem() {
    const modal = new ModalBuilder()
        .setCustomId(`panelEspionagemModal`)
        .setTitle("Espionagem");

    const userId = new TextInputBuilder()
        .setCustomId("user_id_espionagem")
        .setLabel("ID DO USUÁRIO")
        .setStyle(1)
        .setPlaceholder("ID DO USUÁRIO QUE DESEJA ESPIONAR")
        .setRequired(true);

    const logChannelId = new TextInputBuilder()
        .setCustomId("log_channel_id")
        .setLabel("ID DO CANAL DE LOGS")
        .setStyle(1)
        .setPlaceholder("ID DO CANAL ONDE DESEJA RECEBER AS LOGS")
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(userId),
        new ActionRowBuilder().addComponents(logChannelId)
    );

    return modal;
}

async function iniciarEspionagem(interaction, client) {
    const targetUserId = interaction.fields.getTextInputValue("user_id_espionagem");
    const logChannelId = interaction.fields.getTextInputValue("log_channel_id");
    sessionData[interaction.user.id] = { targetUserId, logChannelId };
    await interaction.reply({ content: `<:icons_fingerprint:1261366785848901652> Verificando as informações...`, ephemeral: true });

    const self = await autenticarSelfbot();
    if (!self) {
        return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> Todos os tokens são inválidos`, ephemeral: true });
    }

    const targetUser = await self.users.fetch(targetUserId).catch(() => null);
    if (!targetUser) {
        return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> Usuário não encontrado`, ephemeral: true });
    }

    const logChannel = client.channels.cache.get(logChannelId);
    if (!logChannel) {
        return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> Canal de logs não encontrado`, ephemeral: true });
    }

    configurarEventos(client, targetUserId, targetUser, logChannel);

    await interaction.editReply({ content: `<:icons_Correct:1261798879578558484> Espionagem configurada com sucesso!`, ephemeral: true });
}

async function autenticarSelfbot() {
    for (const token of tokens) {
        const self = new SelfbotClient();
        try {
            await self.login(token);
            return self;
        } catch {
            console.warn(gradient.rainbow(`Token inválido: ${token}`));
        }
    }
    return null;
}

function configurarEventos(client, targetUserId, targetUser, logChannel) {
    client.on('voiceStateUpdate', (oldState, newState) => handleVoiceStateUpdate(oldState, newState, targetUserId, targetUser, logChannel));
    client.on('messageUpdate', (oldMessage, newMessage) => handleMessageUpdate(oldMessage, newMessage, targetUserId, targetUser, logChannel));
    client.on('messageDelete', (message) => handleMessageDelete(message, targetUserId, targetUser, logChannel));
    client.on('presenceUpdate', (oldPresence, newPresence) => handlePresenceUpdate(oldPresence, newPresence, targetUserId, targetUser, logChannel));
}

async function handleVoiceStateUpdate(oldState, newState, targetUserId, targetUser, logChannel) {
    if (oldState.member.id === targetUserId || newState.member.id === targetUserId) {
        if (oldState.channelId !== newState.channelId) {
            const embed = new EmbedBuilder()
                .setTitle("Atualização de Canal de Voz")
                .setDescription(`O usuário ${targetUser.tag} mudou de canal de voz.`)
                .addFields(
                    { name: "Canal Anterior", value: oldState.channel ? oldState.channel.name : "Nenhum", inline: true },
                    { name: "Novo Canal", value: newState.channel ? newState.channel.name : "Nenhum", inline: true }
                )
                .setColor("#FFA500")
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
    }
}

async function handleMessageUpdate(oldMessage, newMessage, targetUserId, targetUser, logChannel) {
    if (oldMessage.author.id === targetUserId && oldMessage.content !== newMessage.content) {
        const embed = new EmbedBuilder()
            .setTitle("Mensagem Editada")
            .setDescription(`O usuário ${targetUser.tag} editou uma mensagem.`)
            .addFields(
                { name: "Conteúdo Original", value: oldMessage.content || "Não disponível", inline: false },
                { name: "Novo Conteúdo", value: newMessage.content || "Não disponível", inline: false }
            )
            .setColor("#FFD700")
            .setTimestamp();
        await logChannel.send({ embeds: [embed] });
    }
}

async function handleMessageDelete(message, targetUserId, targetUser, logChannel) {
    if (message.author.id === targetUserId) {
        const embed = new EmbedBuilder()
            .setTitle("Mensagem Apagada")
            .setDescription(`O usuário ${targetUser.tag} apagou uma mensagem.`)
            .addFields(
                { name: "Conteúdo", value: message.content || "Não disponível", inline: false },
                { name: "Canal", value: message.channel.name, inline: true }
            )
            .setColor("#FF0000")
            .setTimestamp();
        await logChannel.send({ embeds: [embed] });
    }
}

async function handlePresenceUpdate(oldPresence, newPresence, targetUserId, targetUser, logChannel) {
    if (newPresence.userId === targetUserId) {
        const oldStatus = oldPresence?.status || "offline";
        const newStatus = newPresence.status;
        if (oldStatus !== newStatus) {
            const embed = new EmbedBuilder()
                .setTitle("Atualização de Status")
                .setDescription(`O status de ${targetUser.tag} mudou.`)
                .addFields(
                    { name: "Status Anterior", value: oldStatus, inline: true },
                    { name: "Novo Status", value: newStatus, inline: true }
                )
                .setColor("#1E90FF")
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
    }
}