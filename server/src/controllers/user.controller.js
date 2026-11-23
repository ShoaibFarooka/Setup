const userService = require('../services/user.service');
const { successBody } = require('../utils/response.util');

const fetchUserInfo = async (req, res) => {
    const user = await userService.fetchUser(req.user.id);
    res.status(200).json(successBody('User fetched successfully', { user }));
};

// Body already validated (updateProfileSchema): only name and email can reach this
const updateUserInfo = async (req, res) => {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.status(200).json(successBody('Profile updated successfully', { user }));
};

module.exports = {
    fetchUserInfo,
    updateUserInfo,
};
