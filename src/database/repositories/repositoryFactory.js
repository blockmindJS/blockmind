const { getConfig } = require("../../config/config");
const UserRepository = require('./userRepository');
const permissionRepository = require("./permissionRepository");

class RepositoryFactory {
    static getRepository(repositoryType) {
        const config = getConfig();

        if (config.customRepositories && config.customRepositories[repositoryType]) {
            return new config.customRepositories[repositoryType](config.dbType);
        }

        const repoMap = {
            user: () => new UserRepository(config.dbType),
            group: () => new UserRepository(config.dbType),
            permission: () => new permissionRepository(config.dbType),
        };

        if (repoMap[repositoryType]) {
            return repoMap[repositoryType]();
        }

        throw new Error(`Unknown repository type: ${repositoryType}`);
    }
}

module.exports = RepositoryFactory;
