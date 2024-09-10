const UserRepository = require('./userRepository');

class Users {
    constructor(username) {
        this.username = username;
        this.userData = null;
        this.userRepository = new UserRepository('sqlite');
    }

    async init() {
        this.userData = await this.userRepository.getUserByUsername(this.username);
        return this;
    }

    get blacklist() {
        return this.userData ? this.userData.blacklist : null;
    }

    set blacklist(value) {
        if (this.userData) {
            this.userData.blacklist = value;
            this._save();
        }
    }

    async _save() {
        await this.userRepository.updateUser(this.userData);
    }

    hasPermission(permission) {
        return true;
    }

    async addGroup(groupName) {
        const group = await this.userRepository.models.Group.findOne({ where: { name: groupName } });
        if (group) {
            await this.userData.addGroup(group);
            console.log(`User ${this.username} added to group ${groupName}`);
        } else {
            console.log(`Group ${groupName} not found.`);
        }
    }
    
    async removeGroup(groupName) {
        const group = await this.userRepository.models.Group.findOne({ where: { name: groupName } });
        if (group) {
            await this.userData.removeGroup(group);
            console.log(`User ${this.username} removed from group ${groupName}`);
        } else {
            console.log(`Group ${groupName} not found.`);
        }
    }
}

module.exports = Users;
