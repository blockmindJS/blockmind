const IClanMemberRepository = require('../interfaces/IClanMemberRepository');
const getModels = require('../modelInitializer');

class ClanMemberRepository extends IClanMemberRepository {
    constructor(dbType) {
        super();
        this.dbType = dbType;
        this.models = getModels();
    }

    async createClanMember(clanMemberData) {
        if (this.dbType === 'sqlite') {
            try {
                return await this.models.ClanMember.create(clanMemberData);
            } catch (error) {
                console.error(`Error creating clan member in SQLite: ${error.message}`);
                console.error(error.stack);
            }
        } else if (this.dbType === 'mongodb') {
            try {
                const clanMember = new this.models.ClanMember(clanMemberData);
                return await clanMember.save();
            } catch (error) {
                console.error(`Error creating clan member in MongoDB: ${error.message}`);
                console.error(error.stack);
            }
        }
    }

    async getClanMemberByUsername(username) {
        if (this.dbType === 'sqlite') {
            return await this.models.ClanMember.findOne({ where: { username } });
        } else if (this.dbType === 'mongodb') {
            return await this.models.ClanMember.findOne({ username });
        }
    }

    async updateClanMember(clanMemberData) {
        if (this.dbType === 'sqlite') {
            const clanMember = await this.models.ClanMember.findOne({ where: { username: clanMemberData.username } });
            if (clanMember) {
                return await clanMember.update(clanMemberData);
            }
        } else if (this.dbType === 'mongodb') {
            return await this.models.ClanMember.findOneAndUpdate({ username: clanMemberData.username }, clanMemberData, { new: true });
        }
    }

    async deleteClanMember(username) {
        if (this.dbType === 'sqlite') {
            const clanMember = await this.models.ClanMember.findOne({ where: { username } });
            if (clanMember) {
                return await clanMember.destroy();
            }
        } else if (this.dbType === 'mongodb') {
            return await this.models.ClanMember.findOneAndDelete({ username });
        }
    }
}

module.exports = ClanMemberRepository;
