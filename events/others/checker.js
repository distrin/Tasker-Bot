const { ModalBuilder, TextInputBuilder, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const { Client: SelfbotClient } = require("discord.js-selfbot-v13");
const gradient = require('gradient-flag');

const owner = '831304519287046175';

module.exports = {
    name: "interactionCreate",
    run: async (interaction) => {
        const { customId, user } = interaction;
        if (!customId || user.id !== owner) return;

        if (customId === "panelchecker") {
            const modal = new ModalBuilder()
                .setCustomId("panelcheckermodal")
                .setTitle("Checker de Token Inovador")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("token")
                            .setLabel("TOKEN")
                            .setStyle(1)
                            .setPlaceholder("TOKEN QUE DESEJA VERIFICAR")
                            .setRequired(true)
                    )
                );

            return interaction.showModal(modal);
        }

        if (customId === "panelcheckermodal") {
            const token = interaction.fields.getTextInputValue("token");
            await interaction.reply({ content: `<:icons_fingerprint:1261366785848901652> Verificando o token...`, ephemeral: true });
            console.log(gradient.rainbow('Verificando o token...'));

            const self = new SelfbotClient();
            let isInvalidToken = false;
            try {
                await self.login(token).catch(() => isInvalidToken = true);
            } catch {
                isInvalidToken = true;
            }

            if (isInvalidToken) {
                console.log(gradient.rainbow('Token inválido'));
                return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> Token inválido`, ephemeral: true });
            }

            const ownedGuilds = self.guilds.cache
                .filter(guild => guild.ownerId === self.user.id)
                .map(guild => `${guild.name} (${guild.memberCount} membros)`)
                .join("\n");

            const totalServers = self.guilds.cache.size;
            const totalFriends = self.relationships.friendCache.size;
            const nitroType = self.user.nitroType ? self.user.nitroType : 'Nenhum';

            const embed = new EmbedBuilder()
                .setTitle("Informações do Token")
                .setDescription(`Usuário: ${self.user.tag}`)
                .addFields(
                    { name: 'Servidores Próprios', value: ownedGuilds || 'Nenhum servidor encontrado', inline: false },
                    { name: 'Total de Servidores', value: totalServers.toString(), inline: true },
                    { name: 'Total de Amigos', value: totalFriends.toString(), inline: true },
                    { name: 'Tipo de Nitro', value: nitroType, inline: true }
                )
                .setColor(0x00FF00)
                .setTimestamp();

            if (self.user.avatarURL()) {
                embed.setThumbnail(self.user.avatarURL());
            }

            console.log(gradient.rainbow(`Token válido para o usuário ${self.user.tag}`));
            await interaction.editReply({
                content: `<:icons_Correct:1261798879578558484> Token válido!`,
                embeds: [embed],
                ephemeral: true
            });

            self.destroy();
        }
    }
}