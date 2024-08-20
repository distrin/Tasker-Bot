const { ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");

module.exports = {
    name: "painel",
    description: "Envie o painel de nuke servidor",
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        console.log("Comando painel executado");

        if (interaction.user.id !== '831304519287046175') {
            return interaction.reply({ content: `<:Red_Cross:1251966007871016970> Permissão inválida.`, ephemeral: true });
        }

        try {
            console.log("Enviando painel...");
            const attachment = new AttachmentBuilder("https://media.discordapp.net/attachments/1242231519943069778/1261818336099172444/wallhaven-o58dgp.png");
            await interaction.channel.send({
                //files: [attachment],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("funcoesTokens")
                            .setLabel("Funções Tokens")
                            .setStyle(ButtonStyle.Primary)
                    )
                ]
            });
            console.log("Painel enviado com sucesso!");
            await interaction.reply({ content: `✅ **| Painel enviado com sucesso!**`, ephemeral: true });
        } catch (error) {
            console.error("Erro ao enviar o painel: ", error);
            await interaction.reply({ content: `❌ **| Ocorreu um erro ao enviar o painel.**`, ephemeral: true });
        }
    }
}