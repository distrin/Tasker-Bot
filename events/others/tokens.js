const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const OWNER_ID = '831304519287046175';

const BUTTONS = [
    { id: 'panelchecker', label: '🔍 Verificar Token', style: ButtonStyle.Primary },
    { id: 'panelcloner', label: '📋 Clonar Servidor', style: ButtonStyle.Primary },
    { id: 'panelnuker_v2', label: '💥 Nuke Servidor', style: ButtonStyle.Danger },
    { id: 'nukerbot', label: '🤖 Nuker via Bot', style: ButtonStyle.Danger },
    { id: 'banall', label: '🔨 Banir Todos', style: ButtonStyle.Danger },
    { id: 'spy', label: '🕵️ Espionagem de Usuário', style: ButtonStyle.Success },
    { id: 'clear', label: '🧹 Clear DMs', style: ButtonStyle.Success }
];

function createButton(button) {
    return new ButtonBuilder()
        .setCustomId(button.id)
        .setLabel(button.label)
        .setStyle(button.style);
}

function createActionRows() {
    const rows = [];
    for (let i = 0; i < BUTTONS.length; i += 2) {
        const row = new ActionRowBuilder().addComponents(
            createButton(BUTTONS[i]),
            BUTTONS[i + 1] ? createButton(BUTTONS[i + 1]) : null
        ).setComponents(row.components.filter(Boolean));
        rows.push(row);
    }
    return rows;
}

module.exports = {
    name: "interactionCreate",
    run: async (interaction) => {
        if (!interaction?.isButton() || interaction.user.id !== OWNER_ID) return;

        if (interaction.customId === "funcoesTokens") {
            await interaction.update({
                content: '',
                components: createActionRows()
            });
        }
    }
};