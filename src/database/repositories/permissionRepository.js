const getModels = require('../modelInitializer');
const IUserRepository = require('../interfaces/IUserRepository');

class permissionRepository extends IUserRepository {
    constructor(dbType) {
        super();
        this.dbType = dbType;
        this.models = null;
    }

    async initialize() {
        const models = await getModels();
        this.models = models;

        if (!this.models || !this.models.Permission) {
            throw new Error('Permission model is not loaded correctly.');
        } else {
            console.log('Permission model loaded successfully.');
        }
    }

    async createPermission(permissionData) {
        await this.ensureModelsInitialized();

        try {
            let permission;
            if (this.dbType === 'sqlite') {
                permission = await this.models.Permission.create({
                    name: permissionData.name,
                    desc: permissionData.desc || ''
                });
            } else if (this.dbType === 'mongodb') {
                permission = new this.models.Permission({
                    name: permissionData.name,
                    desc: permissionData.desc || ''
                });
                await permission.save();
            }
            return permission;
        } catch (error) {
            console.error(`Error creating permission: ${error.message}`);
            throw error;
        }
    }

    async getPermissionByName(name) {
        await this.ensureModelsInitialized();

        let permission;
        if (this.dbType === 'sqlite') {
            permission = await this.models.Permission.findOne({ where: { name } });
        } else if (this.dbType === 'mongodb') {
            permission = await this.models.Permission.findOne({ name });
        }

        if (permission) {
            return permission;
        } else {
            console.log(`Permission ${name} not found.`);
            return null;
        }
    }

    async updatePermission(name, permissionData) {
        await this.ensureModelsInitialized();

        let permission;
        if (this.dbType === 'sqlite') {
            permission = await this.models.Permission.findOne({ where: { name } });
            if (permission) {
                return await permission.update(permissionData);
            }
        } else if (this.dbType === 'mongodb') {
            permission = await this.models.Permission.findOneAndUpdate({ name }, permissionData, { new: true });
        }

        if (permission) {
            return permission;
        } else {
            console.log(`Permission ${name} not found for update.`);
            return null;
        }
    }

    async deletePermission(name) {
        await this.ensureModelsInitialized();

        if (this.dbType === 'sqlite') {
            const permission = await this.models.Permission.findOne({ where: { name } });
            if (permission) {
                return await permission.destroy();
            }
        } else if (this.dbType === 'mongodb') {
            return await this.models.Permission.findOneAndDelete({ name });
        }

        console.log(`Permission ${name} not found for deletion.`);
        return null;
    }

    async ensureModelsInitialized() {
        if (!this.models) {
            await this.initialize();
        }
    }
}

module.exports = permissionRepository;
