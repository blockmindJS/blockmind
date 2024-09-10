const { getConfig } = require("../../config/config");
const UserRepository = require('./userRepository');
const ClanMemberRepository = require('./clanMemberRepository');

class RepositoryFactory {
    static getRepository(repositoryType) {
        const config = getConfig();

        if (config.customRepositories && config.customRepositories[repositoryType]) {
            return new config.customRepositories[repositoryType](config.dbType);
        }

        console.log(`config: ${JSON.stringify(config)}`);

        const repoMap = {
            user: () => new UserRepository(config.dbType),
            clanMember: () => new ClanMemberRepository(config.dbType),
        };

        if (repoMap[repositoryType]) {
            return repoMap[repositoryType]();
        }

        throw new Error(`Unknown repository type: ${repositoryType}`);
    }
}

module.exports = RepositoryFactory;
