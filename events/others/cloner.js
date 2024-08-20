const { ModalBuilder, TextInputBuilder, ActionRowBuilder, ChannelType, EmbedBuilder } = require("discord.js");
const { Client } = require('discord.js-selfbot-v13');
const gradient = require('gradient-flag');

const owner = '831304519287046175';

const logger = {
    info: (message) => console.log(gradient.rainbow(`[INFO] ${message}`)),
    error: (message, error) => console.error(gradient.rainbow(`[ERROR] ${message}`), error),
    warn: (message) => console.warn(gradient.rainbow(`[WARN] ${message}`))
};

async function cloneServer(original, target, interaction) {
    const items = {
        text: original.channels.cache.filter(c => c.type === ChannelType.GuildText).sort((a, b) => a.position - b.position),
        voice: original.channels.cache.filter(c => c.type === ChannelType.GuildVoice).sort((a, b) => a.position - b.position),
        category: original.channels.cache.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position),
        roles: original.roles.cache.sort((a, b) => b.position - a.position)
    };

    await interaction.editReply({ content: `<:icons_clock:1261798597842829312> **| Clonando o Servidor \`${original.name}\`**\n- Deletando conteúdo existente...` });
    await Promise.all([
        ...target.channels.cache.map(c => c.delete().catch(() => {})),
        ...target.roles.cache.map(r => r.delete().catch(() => {})),
        ...target.emojis.cache.map(e => e.delete().catch(() => {}))
    ]);

    await target.setIcon(original.iconURL());
    await target.setName(original.name);

    await cloneRoles(items.roles, target, interaction);
    await cloneEmojis(original.emojis.cache, target, interaction);
    const categoryMap = await cloneCategories(items.category, target, interaction);
    await cloneTextChannels(items.text, target, categoryMap, interaction);
    await cloneVoiceChannels(items.voice, target, categoryMap, interaction);

    await cloneServerSettings(original, target);

    await interaction.editReply({ content: `<:icons_Correct:1261798879578558484> Servidor clonado com sucesso` });
}

async function cloneRoles(roles, target, interaction) {
    await interaction.editReply({ content: `<:icons_clock:1261798597842829312> **| Clonando Cargos...**` });
    await Promise.all(roles.map(async role => {
        if (role.managed || role.name === '@everyone') return;
        await target.roles.create({
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            permissions: role.permissions,
            mentionable: role.mentionable,
            position: role.position
        }).catch(logger.error);
    }));
}

async function cloneEmojis(emojis, target, interaction) {
    await interaction.editReply({ content: `<:icons_clock:1261798597842829312> **| Clonando Emojis...**` });
    await Promise.all(emojis.map(async emoji => {
        await target.emojis.create(emoji.url, emoji.name).catch(logger.error);
    }));
}

async function cloneCategories(categories, target, interaction) {
    await interaction.editReply({ content: `<:icons_clock:1261798597842829312> **| Clonando Categorias...**` });
    const categoryMap = new Map();
    await Promise.all(categories.map(async category => {
        const newCategory = await target.channels.create({
            name: category.name,
            type: ChannelType.GuildCategory,
            permissionOverwrites: category.permissionOverwrites.cache
        }).catch(logger.error);
        if (newCategory) categoryMap.set(category.id, newCategory.id);
    }));
    return categoryMap;
}

async function cloneTextChannels(textChannels, target, categoryMap, interaction) {
    await interaction.editReply({ content: `<:icons_clock:1261798597842829312> **| Clonando Canais de Texto...**` });
    await Promise.all(textChannels.map(async channel => {
        const newChannel = await target.channels.create({
            name: channel.name,
            type: ChannelType.GuildText,
            topic: channel.topic,
            nsfw: channel.nsfw,
            parent: categoryMap.get(channel.parentId),
            permissionOverwrites: channel.permissionOverwrites.cache
        }).catch(logger.error);

        if (newChannel) {
            await cloneWebhooks(channel, newChannel);
            await cloneMessages(channel, newChannel, interaction.client);
        }
    }));
}

async function cloneVoiceChannels(voiceChannels, target, categoryMap, interaction) {
    await interaction.editReply({ content: `<:icons_clock:1261798597842829312> **| Clonando Canais de Voz...**` });
    await Promise.all(voiceChannels.map(async channel => {
        await target.channels.create({
            name: channel.name,
            type: ChannelType.GuildVoice,
            bitrate: channel.bitrate,
            userLimit: channel.userLimit,
            parent: categoryMap.get(channel.parentId),
            permissionOverwrites: channel.permissionOverwrites.cache
        }).catch(logger.error);
    }));
}

async function cloneWebhooks(oldChannel, newChannel) {
    const webhooks = await oldChannel.fetchWebhooks();
    webhooks.forEach(async webhook => {
        await newChannel.createWebhook({
            name: webhook.name,
            avatar: webhook.avatarURL(),
        }).catch(logger.error);
    });
}

async function cloneMessages(oldChannel, newChannel, client) {
    const messages = await oldChannel.messages.fetch({ limit: 100 });
    const webhook = await newChannel.createWebhook({
        name: 'Message Cloner',
        avatar: client.user.displayAvatarURL(),
    }).catch(logger.error);

    if (webhook) {
        for (const message of messages.reverse().values()) {
            if (message.content || message.attachments.size > 0) {
                await webhook.send({
                    content: message.content,
                    username: message.author.username,
                    avatarURL: message.author.displayAvatarURL(),
                    files: message.attachments.map(attachment => attachment.url),
                    embeds: message.embeds
                }).catch(logger.error);
            }
        }
        await webhook.delete().catch(logger.error);
    }
}

async function cloneServerSettings(original, target) {
    await target.setVerificationLevel(original.verificationLevel);
    await target.setExplicitContentFilter(original.explicitContentFilter);
    await target.setDefaultMessageNotifications(original.defaultMessageNotifications);
    if (original.banner) await target.setBanner(original.bannerURL());
    if (original.splash) await target.setSplash(original.splashURL());
    await target.setPreferredLocale(original.preferredLocale);
    if (original.description) await target.setDescription(original.description);
    // Adicione mais configurações conforme necessário
}

module.exports = {
    name: "interactionCreate",
    run: async (interaction) => {
        const { customId, user, client } = interaction;
        if (!customId) return;

        if (customId === "panelcloner") {
            const modal = new ModalBuilder()
                .setCustomId(`panelclonermodal`)
                .setTitle("ToolBot Murizada")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("original")
                            .setLabel("SERVIDOR ORIGINAL")
                            .setPlaceholder("ID DO SERVIDOR QUE QUER COPIAR")
                            .setStyle(1)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("token")
                            .setLabel("TOKEN")
                            .setPlaceholder("TOKEN QUE ESTEJA EM AMBOS SERVIDORES")
                            .setStyle(1)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("alvo")
                            .setLabel("SERVIDOR CÓPIA")
                            .setPlaceholder("ID DO SEU SERVIDOR PADRÃO")
                            .setStyle(1)
                            .setRequired(true)
                    )
                );

            return interaction.showModal(modal);
        }

        if (customId === "panelclonermodal") {
            const original = interaction.fields.getTextInputValue("original");
            const token = interaction.fields.getTextInputValue("token");
            const target = interaction.fields.getTextInputValue("alvo");
            
            await interaction.reply({ content: `<:icons_clock:1261798597842829312> Verificando as informações...`, ephemeral: true });
            logger.info('Verificando as informações...');

            const self = new Client();
            try {
                await self.login(token);
            } catch (error) {
                logger.error('Erro ao fazer login', error);
                return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> Token inválido`, ephemeral: true });
            }

            const originalGuild = self.guilds.cache.get(original);
            const targetGuild = self.guilds.cache.get(target);

            if (!originalGuild || !targetGuild) {
                return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> A conta não está nos dois servidores`, ephemeral: true });
            }

            try {
                await cloneServer(originalGuild, targetGuild, interaction);
            } catch (error) {
                logger.error('Erro durante a clonagem', error);
                await interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> Ocorreu um erro durante a clonagem`, ephemeral: true });
            } finally {
                self.destroy();
            }
        }
    }
};