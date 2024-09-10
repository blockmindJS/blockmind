// custom/userRepository.js
const IUserRepository = require('../interfaces/IUserRepository');

class CustomUserRepository extends IUserRepository {
    async createUser(userData) {
        console.log('Custom logic for creating user');
        // Своя логика для создания пользователя
    }

    async getUserByUsername(username) {
        console.log('Custom logic for getting user');
        // Своя логика для получения пользователя
    }

}

module.exports = CustomUserRepository;
