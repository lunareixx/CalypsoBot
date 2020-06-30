const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const scheduleCrown = require('../../utils/scheduleCrown.js');
const { oneLine } = require('common-tags');

module.exports = class SetCrownRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setcrownrole',
      aliases: ['setcr', 'scr'],
      usage: 'setcrownrole <role mention | role name>',
      description: oneLine`
        Sets the role Calypso will give members with the most points each cycle. 
        Provide no role to clear the current crown role.
      `,
      type: 'admin',
      userPermissions: ['MANAGE_GUILD'],
      examples: ['setcrownrole @Crowned']
    });
  }
  run(message, args) {
    const crownRoleId = message.client.db.guildSettings.selectCrownRoleId.pluck().get(message.guild.id);
    let oldRole = message.guild.roles.cache.find(r => r.id === crownRoleId) || '`None`';

    const embed = new MessageEmbed()
      .setTitle('Server Settings')
      .addField('Setting', '**Crown Role**', true)
      .setThumbnail(message.guild.iconURL())
      .setFooter(`
        Requested by ${message.member.displayName}#${message.author.discriminator}`, message.author.displayAvatarURL()
      )
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    if (args.length === 0) {
      message.client.db.guildSettings.updateCrownRoleId.run(null, message.guild.id);
      return message.channel.send(embed.addField('Current Role', `${oldRole} 🡪 \`None\``, true));
    }

    // Update role
    const roleName = args.join(' ').toLowerCase();
    let role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName);
    role = this.getRoleFromMention(message, args[0]) || role;
    if (!role) return this.sendErrorMessage(message, 'Invalid argument. Please mention a role or provide a role name.');
    message.client.db.guildSettings.updateCrownRoleId.run(role.id, message.guild.id);
    message.channel.send(embed.addField('Current Role', `${oldRole} 🡪 ${role}`, true));

    // Schedule crown role rotation
    scheduleCrown(message.client, message.guild);
  }
};
