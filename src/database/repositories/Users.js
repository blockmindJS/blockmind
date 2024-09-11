const UserRepository = require('./userRepository');
const getConfig = require('../../config/config');

class Users {
    constructor(username) {
        this.username = username;
        this.userData = null;
        this.config = getConfig;
        this.userRepository = new UserRepository(this.config.getConfig().dbType);
    }

    async init() {
        this.userData = await this.userRepository.getUserByUsername(this.username);
        if (!this.userData) {
            throw new Error(`User ${this.username} not found or could not be created.`);
        }
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
        if (this.userData) {
            await this.userRepository.updateUser(this.userData);
        }
    }

    /**
     * Проверяет наличие у пользователя указанного разрешения.
     * @param {string} permission - Проверяемое разрешение.
     * @returns {Promise<boolean>}
     */
    async hasPermission(requiredPermissions) {
        if (!this.userData) {
            throw new Error(`User data is not loaded for ${this.username}`);
        }

        if (typeof requiredPermissions === 'string') {
            requiredPermissions = requiredPermissions.split(',');
        }

        let userPermissions = [];


        if (this.userData.Groups || this.userData.groups) {
            const groups = this.userData.Groups || this.userData.groups;

            groups.forEach(group => {
                if (group.Permissions || group.permissions) {
                    const permissions = group.Permissions || group.permissions;
                    permissions.forEach(permission => {
                        userPermissions.push(permission.name);
                    });
                }
            });
        }

        const hasWildcardPermission = (perm) => {
            const [domain, action] = perm.split('.');
            return userPermissions.some(userPerm => {
                const [userDomain, userAction] = userPerm.split('.');
                return (
                    (userDomain === domain && (userAction === '*' || userAction === action)) ||
                    userPerm === perm
                );
            });
        };

        return requiredPermissions.some(perm => hasWildcardPermission(perm));
    }


    async getGroups() {
        if (!this.userData) {
            throw new Error(`User data is not loaded for ${this.username}`);
        }

        if (this.userRepository.dbType === 'sqlite') {
            return await this.userData.getGroups();
        } else if (this.userRepository.dbType === 'mongodb') {
            return this.userData.groups;
        }
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
