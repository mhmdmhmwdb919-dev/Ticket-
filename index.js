const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
require('dotenv').config();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages] });
const ticketConfigs = new Map();
const activeTickets = new Map();

client.once('ready', () => {
    console.log(`✅ البوت شغال: ${client.user.tag}`);
    client.user.setActivity('🎫 نظام التذاكر', { type: 'WATCHING' });
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'control_menu') {
                await handleControlMenu(interaction);
            } else if (interaction.commandName === 'new_ticket') {
                await handleNewTicket(interaction);
            } else if (interaction.commandName === 'close') {
                await handleCloseTicket(interaction);
            } else if (interaction.commandName === 'add') {
                await handleAddUser(interaction);
            } else if (interaction.commandName === 'delete') {
                await handleDeleteUser(interaction);
            } else if (interaction.commandName === 'rename') {
                await handleRename(interaction);
            } else if (interaction.commandName === 'transfer') {
                await handleTransfer(interaction);
            }
        } else if (interaction.isButton()) {
            await handleButtonClick(interaction);
        } else if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction);
        } else if (interaction.isModalSubmit()) {
            await handleModalSubmit(interaction);
        }
    } catch (error) {
        console.error('حصل خطأ:', error);
        if (interaction.deferred) {
            await interaction.followUp({ content: '❌ حصل حاجة غلط يا أخي!', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ حصل حاجة غلط يا أخي!', ephemeral: true });
        }
    }
});

async function handleControlMenu(interaction) {
    const guildId = interaction.guildId;
    const controlEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('⚙️ لوحة التحكم - نظام التذاكر')
        .setDescription('اختر الإعداد اللي تبي تغيره')
        .addFields(
            { name: '📝 الرسالة الافتتاحية', value: 'msg - رسالة فتح التذاكر', inline: true },
            { name: '🔘 اسم الزر', value: 'name_button - اسم الزر الرئيسي', inline: true },
            { name: '🎨 لون الزر', value: 'clr_button - اختر لون الزر', inline: true },
            { name: '📂 الفئة', value: 'cat_tic - فئة التذاكر', inline: true },
            { name: '💬 رسالة الروم', value: 'msg_tic - رسالة داخل روم التذكرة', inline: true },
            { name: '👥 دور المنشن', value: 'rol_mnsh - الدور المسؤول', inline: true },
            { name: '⚡ نوع النظام', value: 'Type_tic - أوتو أو يدوي', inline: true },
            { name: '🗣️ الأدوار المسموح بالتحدث', value: 'speak_tic - الأدوار المسموحة', inline: true },
            { name: '🏷️ اسم التذكرة', value: 'name_tic - اسم هذا النظام', inline: true }
        );
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`control_${guildId}`)
        .setPlaceholder('اختر الإعداد')
        .addOptions([
            { label: 'الرسالة الافتتاحية', value: 'msg', emoji: '📝' },
            { label: 'اسم الزر', value: 'name_button', emoji: '🔘' },
            { label: 'لون الزر', value: 'clr_button', emoji: '🎨' },
            { label: 'الفئة', value: 'cat_tic', emoji: '📂' },
            { label: 'رسالة الروم', value: 'msg_tic', emoji: '💬' },
            { label: 'دور المنشن', value: 'rol_mnsh', emoji: '👥' },
            { label: 'نوع النظام', value: 'Type_tic', emoji: '⚡' },
            { label: 'الأدوار المسموح بالتحدث', value: 'speak_tic', emoji: '🗣️' },
            { label: 'اسم التذكرة', value: 'name_tic', emoji: '🏷️' }
        ]);
    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.reply({ embeds: [controlEmbed], components: [row], ephemeral: true });
}

async function handleNewTicket(interaction) {
    const ticketName = interaction.options.getString('name') || 'تذكرة عامة';
    const guildId = interaction.guildId;
    const config = ticketConfigs.get(guildId) || {};
    if (!config.msg || !config.name_button || !config.clr_button || !config.cat_tic || !config.msg_tic || !config.Type_tic) {
        return await interaction.reply({ content: '⚠️ يا أحول! ما خلصت إعدادات نظام التذاكر!\n\nاستخدم `/control_menu` وخلص الإعدادات الأساسية:\n✅ الرسالة الافتتاحية\n✅ اسم الزر\n✅ لون الزر\n✅ الفئة\n✅ رسالة الروم\n✅ نوع النظام', ephemeral: true });
    }
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎫 فتح تذكرة جديدة')
        .setDescription(config.msg)
        .setTimestamp();
    const buttonColor = parseInt(config.clr_button) || ButtonStyle.Danger;
    const buttonName = config.name_button || '🎫 فتح تذكرة';
    const openButton = new ButtonBuilder()
        .setCustomId(`open_ticket_${guildId}_${ticketName}`)
        .setLabel(buttonName)
        .setStyle(buttonColor)
        .setEmoji('🎫');
    const row = new ActionRowBuilder().addComponents(openButton);
    const message = await interaction.reply({ embeds: [embed], components: [row] });
    if (!ticketConfigs.has(guildId)) {
        ticketConfigs.set(guildId, {});
    }
    const serverConfig = ticketConfigs.get(guildId);
    serverConfig.ticketName = ticketName;
    serverConfig.messageId = message.id;
    serverConfig.channelId = interaction.channelId;
}

async function handleButtonClick(interaction) {
    const customId = interaction.customId;
    if (customId.startsWith('open_ticket_')) {
        const parts = customId.split('_');
        const guildId = parts[2];
        const ticketName = parts.slice(3).join('_');
        await openTicket(interaction, guildId, ticketName);
    } else if (customId.startsWith('claim_ticket_')) {
        await claimTicket(interaction);
    } else if (customId.startsWith('close_ticket_')) {
        await closeTicketButton(interaction);
    }
}

async function openTicket(interaction, guildId, ticketName) {
    const guild = interaction.guild;
    const user = interaction.user;
    const config = ticketConfigs.get(guildId) || {};
    let category = guild.channels.cache.find(c => c.name === (config.cat_tic || 'tickets'));
    if (!category) {
        category = await guild.channels.create({ name: config.cat_tic || 'tickets', type: ChannelType.GuildCategory, permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }] });
    }
    const ticketChannel = await guild.channels.create({ name: `ticket-${user.username}`, type: ChannelType.GuildText, parent: category.id, permissionOverwrites: [{ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] });
    if (config.rol_mnsh) {
        const role = guild.roles.cache.get(config.rol_mnsh);
        if (role) {
            await ticketChannel.permissionOverwrites.create(role, { ViewChannel: true, SendMessages: true });
        }
    }
    const welcomeEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎫 تم فتح التذكرة')
        .setDescription(config.msg_tic || 'مرحباً بك، سيتم الرد على استفسارك قريباً')
        .addFields(
            { name: 'المستخدم', value: `${user}`, inline: true },
            { name: 'الحالة', value: '⏳ قيد الانتظار', inline: true }
        )
        .setFooter({ text: 'شكراً لتواصلك معنا' });
    let components = [];
    if (config.Type_tic === 'Auto') {
        const claimButton = new ButtonBuilder()
            .setCustomId(`claim_ticket_${ticketChannel.id}`)
            .setLabel('✅ استلام التذكرة')
            .setStyle(ButtonStyle.Success);
        const closeButton = new ButtonBuilder()
            .setCustomId(`close_ticket_${ticketChannel.id}`)
            .setLabel('🔒 إغلاق')
            .setStyle(ButtonStyle.Secondary);
        components.push(new ActionRowBuilder().addComponents(claimButton, closeButton));
    } else {
        const closeButton = new ButtonBuilder()
            .setCustomId(`close_ticket_${ticketChannel.id}`)
            .setLabel('🔒 إغلاق')
            .setStyle(ButtonStyle.Danger);
        components.push(new ActionRowBuilder().addComponents(closeButton));
    }
    await ticketChannel.send({ embeds: [welcomeEmbed], components });
    activeTickets.set(ticketChannel.id, { guildId, userId: user.id, userName: user.username, claimedBy: null, isAuto: config.Type_tic === 'Auto', createdAt: new Date() });
    await interaction.reply({ content: `✅ تم فتح روم التذكرة: ${ticketChannel}\nروح هناك وشرح المشكلة بتاعتك`, ephemeral: true });
}

async function claimTicket(interaction) {
    const ticketId = interaction.customId.split('_')[2];
    const ticket = activeTickets.get(ticketId);
    if (!ticket) {
        return await interaction.reply({ content: '❌ التذكرة ما موجودة', ephemeral: true });
    }
    if (ticket.claimedBy) {
        return await interaction.reply({ content: `❌ التذكرة دي مستلمة من ${interaction.guild.members.cache.get(ticket.claimedBy)} بالفعل`, ephemeral: true });
    }
    const channel = interaction.channel;
    ticket.claimedBy = interaction.user.id;
    await channel.permissionOverwrites.create(interaction.user.id, { SendMessages: true, ViewChannel: true });
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ تم استلام التذكرة')
        .setDescription(`${interaction.user} استلم التذكرة دي`)
        .addFields({ name: 'الحالة', value: '🔄 جاري المعالجة' });
    await interaction.reply({ embeds: [embed] });
}

async function closeTicketButton(interaction) {
    const ticketId = interaction.customId.split('_')[2];
    const channel = interaction.guild.channels.cache.get(ticketId);
    if (channel) {
        await channel.delete();
        activeTickets.delete(ticketId);
    }
    await interaction.reply({ content: '✅ تم إغلاق التذكرة', ephemeral: true });
}

async function handleCloseTicket(interaction) {
    if (interaction.channel.name.startsWith('ticket-')) {
        await interaction.channel.delete();
        activeTickets.delete(interaction.channel.id);
    } else {
        await interaction.reply({ content: '❌ الأمر ده بيشتغل بس في رومات التذاكر', ephemeral: true });
    }
}

async function handleAddUser(interaction) {
    const user = interaction.options.getUser('user');
    if (!interaction.channel.name.startsWith('ticket-')) {
        return await interaction.reply({ content: '❌ الأمر ده بيشتغل بس في رومات التذاكر', ephemeral: true });
    }
    await interaction.channel.permissionOverwrites.create(user.id, { ViewChannel: true, SendMessages: true });
    await interaction.reply({ content: `✅ تمام، أضفنا ${user} في التذكرة` });
}

async function handleDeleteUser(interaction) {
    const user = interaction.options.getUser('user');
    if (!interaction.channel.name.startsWith('ticket-')) {
        return await interaction.reply({ content: '❌ الأمر ده بيشتغل بس في رومات التذاكر', ephemeral: true });
    }
    await interaction.channel.permissionOverwrites.delete(user.id);
    await interaction.reply({ content: `✅ تمام، شلنا ${user} من التذكرة` });
}

async function handleRename(interaction) {
    const newName = interaction.options.getString('name');
    if (!interaction.channel.name.startsWith('ticket-')) {
        return await interaction.reply({ content: '❌ الأمر ده بيشتغل بس في رومات التذاكر', ephemeral: true });
    }
    await interaction.channel.setName(`ticket-${newName}`);
    await interaction.reply({ content: `✅ تمام، غيرنا اسم التذكرة لـ: ${newName}` });
}

async function handleTransfer(interaction) {
    const newOwner = interaction.options.getUser('user');
    const ticketId = interaction.channel.id;
    const ticket = activeTickets.get(ticketId);
    if (!ticket || !ticket.claimedBy) {
        return await interaction.reply({ content: '❌ التذكرة ما مستلمة', ephemeral: true });
    }
    await interaction.channel.permissionOverwrites.delete(ticket.claimedBy);
    await interaction.channel.permissionOverwrites.create(newOwner.id, { SendMessages: true, ViewChannel: true });
    ticket.claimedBy = newOwner.id;
    await interaction.reply({ content: `✅ تمام، نقلنا التذكرة لـ ${newOwner}` });
}

async function handleSelectMenu(interaction) {
    const customId = interaction.customId;
    const guildId = customId.split('_')[1];
    const selectedValue = interaction.values[0];
    if (!ticketConfigs.has(guildId)) {
        ticketConfigs.set(guildId, {});
    }
    const config = ticketConfigs.get(guildId);
    if (selectedValue === 'msg') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_msg_${guildId}`)
            .setTitle('الرسالة الافتتاحية');
        const input = new TextInputBuilder()
            .setCustomId('message_input')
            .setLabel('اكتب الرسالة')
            .setStyle(TextInputStyle.Long)
            .setValue(config.msg || '');
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    } else if (selectedValue === 'name_button') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_name_button_${guildId}`)
            .setTitle('اسم الزر');
        const input = new TextInputBuilder()
            .setCustomId('button_name_input')
            .setLabel('اسم الزر')
            .setStyle(TextInputStyle.Short)
            .setValue(config.name_button || '🎫 فتح تذكرة');
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    } else if (selectedValue === 'clr_button') {
        const colorSelect = new StringSelectMenuBuilder()
            .setCustomId(`color_select_${guildId}`)
            .setPlaceholder('اختر لون الزر')
            .addOptions([
                { label: '🔴 أحمر', value: String(ButtonStyle.Danger), emoji: '🔴' },
                { label: '🔵 أزرق', value: String(ButtonStyle.Primary), emoji: '🔵' },
                { label: '⚫ رمادي', value: String(ButtonStyle.Secondary), emoji: '⚫' },
                { label: '🟢 أخضر', value: String(ButtonStyle.Success), emoji: '🟢' }
            ]);
        const row = new ActionRowBuilder().addComponents(colorSelect);
        await interaction.reply({ components: [row], ephemeral: true });
    } else if (selectedValue === 'cat_tic') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_cat_${guildId}`)
            .setTitle('اسم الفئة');
        const input = new TextInputBuilder()
            .setCustomId('category_input')
            .setLabel('اسم الفئة')
            .setStyle(TextInputStyle.Short)
            .setValue(config.cat_tic || 'tickets');
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    } else if (selectedValue === 'msg_tic') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_msg_tic_${guildId}`)
            .setTitle('رسالة روم التذكرة');
        const input = new TextInputBuilder()
            .setCustomId('ticket_room_message')
            .setLabel('اكتب رسالة الترحيب')
            .setStyle(TextInputStyle.Long)
            .setValue(config.msg_tic || 'مرحباً بك');
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    } else if (selectedValue === 'rol_mnsh') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_rol_${guildId}`)
            .setTitle('اختر الدور المسؤول');
        const input = new TextInputBuilder()
            .setCustomId('role_input')
            .setLabel('امنشن الدور أو اكتب معرفه')
            .setStyle(TextInputStyle.Short)
            .setValue(config.rol_mnsh || '');
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    } else if (selectedValue === 'Type_tic') {
        const typeSelect = new StringSelectMenuBuilder()
            .setCustomId(`type_select_${guildId}`)
            .setPlaceholder('اختر نوع النظام')
            .addOptions([
                { label: '⚡ أوتو (استلام)', value: 'Auto', emoji: '⚡' },
                { label: '🛠️ يدوي', value: 'Manuel', emoji: '🛠️' }
            ]);
        const row = new ActionRowBuilder().addComponents(typeSelect);
        await interaction.reply({ components: [row], ephemeral: true });
    } else if (selectedValue === 'speak_tic') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_speak_${guildId}`)
            .setTitle('الأدوار المسموح بالتحدث');
        const input = new TextInputBuilder()
            .setCustomId('speak_roles_input')
            .setLabel('امنشن الأدوار (مفصول بفواصل)')
            .setStyle(TextInputStyle.Long)
            .setValue(config.speak_tic || '');
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    } else if (selectedValue === 'name_tic') {
        const modal = new ModalBuilder()
            .setCustomId(`modal_name_tic_${guildId}`)
            .setTitle('اسم نظام التذاكر');
        const input = new TextInputBuilder()
            .setCustomId('ticket_name_input')
            .setLabel('اسم النظام')
            .setStyle(TextInputStyle.Short)
            .setValue(config.name_tic || 'تذكرة عامة');
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    } else if (selectedValue.startsWith('color_')) {
        const guildId = customId.split('_')[2];
        if (!ticketConfigs.has(guildId)) {
            ticketConfigs.set(guildId, {});
        }
        ticketConfigs.get(guildId).clr_button = selectedValue;
        await interaction.reply({ content: '✅ تمام، حفظنا لون الزر', ephemeral: true });
    } else if (selectedValue.startsWith('type_select_')) {
        const guildId = customId.split('_')[2];
        if (!ticketConfigs.has(guildId)) {
            ticketConfigs.set(guildId, {});
        }
        ticketConfigs.get(guildId).Type_tic = interaction.values[0];
        await interaction.reply({ content: '✅ تمام، حفظنا نوع النظام', ephemeral: true });
    }
}

async function handleModalSubmit(interaction) {
    const customId = interaction.customId;
    const guildId = customId.split('_')[2];
    if (!ticketConfigs.has(guildId)) {
        ticketConfigs.set(guildId, {});
    }
    const config = ticketConfigs.get(guildId);
    if (customId.startsWith('modal_msg_')) {
        config.msg = interaction.fields.getTextInputValue('message_input');
        await interaction.reply({ content: '✅ تمام، حفظنا الرسالة', ephemeral: true });
    } else if (customId.startsWith('modal_name_button_')) {
        config.name_button = interaction.fields.getTextInputValue('button_name_input');
        await interaction.reply({ content: '✅ تمام، حفظنا اسم الزر', ephemeral: true });
    } else if (customId.startsWith('modal_cat_')) {
        config.cat_tic = interaction.fields.getTextInputValue('category_input');
        await interaction.reply({ content: '✅ تمام، حفظنا اسم الفئة', ephemeral: true });
    } else if (customId.startsWith('modal_msg_tic_')) {
        config.msg_tic = interaction.fields.getTextInputValue('ticket_room_message');
        await interaction.reply({ content: '✅ تمام، حفظنا رسالة الروم', ephemeral: true });
    } else if (customId.startsWith('modal_rol_')) {
        const roleInput = interaction.fields.getTextInputValue('role_input');
        config.rol_mnsh = roleInput.replace(/[<@&>]/g, '');
        await interaction.reply({ content: '✅ تمام، حفظنا الدور المسؤول', ephemeral: true });
    } else if (customId.startsWith('modal_speak_')) {
        config.speak_tic = interaction.fields.getTextInputValue('speak_roles_input');
        await interaction.reply({ content: '✅ تمام، حفظنا الأدوار المسموح بالتحدث', ephemeral: true });
    } else if (customId.startsWith('modal_name_tic_')) {
        config.name_tic = interaction.fields.getTextInputValue('ticket_name_input');
        await interaction.reply({ content: '✅ تمام، حفظنا اسم النظام', ephemeral: true });
    }
}

client.login(process.env.TOKEN);
