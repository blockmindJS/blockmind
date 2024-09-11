const PermissionRepository = require('../repositories/permissionRepository');

class Permission {
    constructor(dbType) {
        this.permissionRepository = new PermissionRepository(dbType);
    }

    async init() {
        await this.permissionRepository.initialize();
        return this;
    }

    /**
     * Создание нового разрешения
     * @param {string} name - Название разрешения
     * @param {string} [desc] - Описание разрешения
     * @returns {Promise<Object>} - Созданное разрешение
     */
    async createPermission(name, desc = '') {
        try {
            const permission = await this.permissionRepository.createPermission({ name, desc });
            console.log(`Permission ${name} created successfully.`);
            return permission;
        } catch (error) {
            console.error(`Error creating permission: ${error.message}`);
            throw error;
        }
    }

    /**
     * Получение разрешения по имени
     * @param {string} name - Название разрешения
     * @returns {Promise<Object>} - Найденное разрешение или null
     */
    async getPermissionByName(name) {
        try {
            const permission = await this.permissionRepository.getPermissionByName(name);
            if (permission) {
                console.log(`Permission ${name} found.`);
            }
            return permission;
        } catch (error) {
            console.error(`Error getting permission: ${error.message}`);
            throw error;
        }
    }

    /**
     * Обновление разрешения
     * @param {string} name - Название разрешения
     * @param {Object} data - Данные для обновления
     * @returns {Promise<Object>} - Обновленное разрешение
     */
    async updatePermission(name, data) {
        try {
            const updatedPermission = await this.permissionRepository.updatePermission(name, data);
            if (updatedPermission) {
                console.log(`Permission ${name} updated successfully.`);
                return updatedPermission;
            } else {
                console.log(`Permission ${name} not found.`);
                return null;
            }
        } catch (error) {
            console.error(`Error updating permission: ${error.message}`);
            throw error;
        }
    }

    /**
     * Удаление разрешения
     * @param {string} name - Название разрешения
     * @returns {Promise<void>} - Удаление разрешения
     */
    async deletePermission(name) {
        try {
            const result = await this.permissionRepository.deletePermission(name);
            if (result) {
                console.log(`Permission ${name} deleted successfully.`);
            } else {
                console.log(`Permission ${name} not found for deletion.`);
            }
        } catch (error) {
            console.error(`Error deleting permission: ${error.message}`);
            throw error;
        }
    }
}

module.exports = Permission;
