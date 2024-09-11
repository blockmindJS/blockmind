// src/database/repositories/groupRepository.js
const getModels = require('../modelInitializer');

class GroupRepository {
    constructor(dbType) {
        this.dbType = dbType;
        this.models = null;
    }

    async initialize() {
        const models = await getModels();
        this.models = models;

        if (!this.models || !this.models.Group) {
            throw new Error('Group model is not loaded correctly.');
        } else {
            console.log('Group model loaded successfully.');
        }
    }

    async createGroup(groupData) {
        await this.ensureModelsInitialized();

        let group;
        try {
            if (this.dbType === 'sqlite') {
                group = await this.models.Group.create(groupData);
            } else if (this.dbType === 'mongodb') {
                group = new this.models.Group(groupData);
                await group.save();
            }
        } catch (error) {
            console.error(`Error creating group: ${error.message}`);
            throw error;
        }

        return group;
    }

    async getGroupByName(name) {
        await this.ensureModelsInitialized();

        let group;
        if (this.dbType === 'sqlite') {
            group = await this.models.Group.findOne({
                where: { name },
                include: [{ model: this.models.Permission }]
            });
        } else if (this.dbType === 'mongodb') {
            group = await this.models.Group.findOne({ name }).populate('permissions');
        }

        if (!group) {
            console.log(`Group ${name} not found`);
        }

        return group;
    }

    async updateGroup(groupData) {
        await this.ensureModelsInitialized();

        if (this.dbType === 'sqlite') {
            const group = await this.models.Group.findOne({ where: { name: groupData.name } });
            if (group) {
                return await group.update(groupData);
            }
        } else if (this.dbType === 'mongodb') {
            return await this.models.Group.findOneAndUpdate({ name: groupData.name }, groupData, { new: true });
        }
    }

    async deleteGroup(name) {
        await this.ensureModelsInitialized();

        if (this.dbType === 'sqlite') {
            const group = await this.models.Group.findOne({ where: { name } });
            if (group) {
                return await group.destroy();
            }
        } else if (this.dbType === 'mongodb') {
            return await this.models.Group.findOneAndDelete({ name });
        }
    }

    async addPermissionToGroup(group, permissionName) {
        await this.ensureModelsInitialized();

        let permission;
        if (this.dbType === 'sqlite') {
            permission = await this.models.Permission.findOne({ where: { name: permissionName } });
            if (!permission) throw new Error(`Permission ${permissionName} not found in SQLite`);

            await group.addPermission(permission);
        } else if (this.dbType === 'mongodb') {
            permission = await this.models.Permission.findOne({ name: permissionName });
            if (!permission) throw new Error(`Permission ${permissionName} not found in MongoDB`);

            group.permissions.push(permission._id);
            await group.save();
        }
        console.log(`Permission ${permissionName} added to group ${group.name}`);
    }

    async removePermissionFromGroup(group, permissionName) {
        await this.ensureModelsInitialized();

        if (this.dbType === 'sqlite') {
            const permission = await this.models.Permission.findOne({ where: { name: permissionName } });
            if (!permission) throw new Error(`Permission ${permissionName} not found in SQLite`);

            await group.removePermission(permission);
        } else if (this.dbType === 'mongodb') {
            group.permissions = group.permissions.filter(permId => permId.toString() !== permission._id.toString());
            await group.save();
        }
        console.log(`Permission ${permissionName} removed from group ${group.name}`);
    }

    async ensureModelsInitialized() {
        if (!this.models) {
            await this.initialize();
        }
    }
}

module.exports = GroupRepository;
