const userService = require('../services/user.service');
const { successBody } = require('../utils/response.util');

const fetchUserInfo = async (req, res) => {
    const user = await userService.fetchUser(req.user.id);
    res.status(200).json(successBody('User fetched successfully', { user }));
};

module.exports = {
    fetchUserInfo,
};
