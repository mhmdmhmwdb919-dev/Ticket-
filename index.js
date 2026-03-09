const Discord = require('discord.js');
const client = new Discord.Client();

const TICKET_CHANNEL_NAME = 'ticket';

client.on('message', async (message) => {
    if (message.content === '!ticket') {
        // Create a ticket channel
        const ticketChannel = await message.guild.channels.create(`ticket-${message.author.username}`, {
            type: 'text',
            parent: message.channel.parent,
            permissionOverwrites: [
                { id: message.guild.id, deny: ['VIEW_CHANNEL'] },
                { id: message.author.id, allow: ['VIEW_CHANNEL'] }
            ]
        });

        // Send a message to the new channel
        ticketChannel.send(`Hello ${message.author}, your ticket has been created. You can ask your questions here.`);

        // Add a listener for messages in the ticket channel
        const filter = m => m.author.id === message.author.id;
        const collector = new Discord.MessageCollector(ticketChannel, filter);

        collector.on('collect', m => {
            if (m.content === '!close') {
                ticketChannel.send('Ticket is being closed.');
                ticketChannel.delete();
                collector.stop();
            }
        });
    }
});

client.login('YOUR_BOT_TOKEN');