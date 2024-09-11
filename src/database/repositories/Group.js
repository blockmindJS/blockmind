
const GroupRepository = require('../repositories/groupRepository');

class Group {
    constructor(name) {
        this.name = name;
        this.groupData = null;
        this.groupRepository = new GroupRepository('sqlite');
    }

    async init() {
        this.groupData = await this.groupRepository.getGroupByName(this.name);
        return this;
    }

    async create(groupData) {
        this.groupData = await this.groupRepository.createGroup(groupData);
        return this;
    }

    async update(newGroupData) {
        if (this.groupData) {
            this.groupData = await this.groupRepository.updateGroup({ ...this.groupData, ...newGroupData });
            return this.groupData;
        } else {
            throw new Error('Group not found.');
        }
    }

    async delete() {
        if (this.groupData) {
            await this.groupRepository.deleteGroup(this.name);
            this.groupData = null;
            return true;
        } else {
            throw new Error('Group not found.');
        }
    }

    async addPermission(permissionName) {
        if (this.groupData) {
            await this.groupRepository.addPermissionToGroup(this.groupData, permissionName);
        } else {
            throw new Error('Group not initialized.');
        }
    }

    async removePermission(permissionName) {
        if (this.groupData) {
            await this.groupRepository.removePermissionFromGroup(this.groupData, permissionName);
        } else {
            throw new Error('Group not initialized.');
        }
    }

    getPermissions() {
        if (this.groupData && this.groupData.Permissions) {
            return this.groupData.Permissions.map(p => p.name);
        }
        return [];
    }
}

module.exports = Group;
