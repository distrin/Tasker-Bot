const { InteractionType } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        if (!interaction.type) return;

        interaction["member"] = interaction.guild?.members?.cache?.get(interaction.user.id);

        switch (interaction.type) {
            case InteractionType.ApplicationCommand:
                await handleApplicationCommand(interaction, client);
                break;
            case InteractionType.MessageComponent:
                await handleMessageComponent(interaction, client);
                break;
            case InteractionType.ModalSubmit:
                await handleModalSubmit(interaction, client);
                break;
            default:
                console.log(`Tipo de interação não tratado: ${interaction.type}`);
        }
    }
};

async function handleApplicationCommand(interaction, client) {
    const cmd = client.slashCommands.get(interaction.commandName);
    if (!cmd) return;
    await cmd.run(client, interaction);
}

async function handleMessageComponent(interaction, client) {
    const componentHandler = client.componentHandlers.get(interaction.customId);
    if (!componentHandler) return;
    await componentHandler.run(client, interaction);
}

async function handleModalSubmit(interaction, client) {
    const modalHandler = client.modalHandlers.get(interaction.customId);
    if (!modalHandler) return;
    await modalHandler.run(client, interaction);
}