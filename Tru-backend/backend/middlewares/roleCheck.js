const { ROLES } = require('../utils/constants');

const checkRole = (roles) => {
  return (req, res, next) => {
    console.log(req.user);
    
    console.log(req.user.role, roles);
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).send({ error: 'Access denied.' });
    }
    next();
  };
};

module.exports = {
  userAuth: checkRole([ROLES.USER]),
  ownerAuth: checkRole([ROLES.OWNER]),
  adminAuth: checkRole([ROLES.ADMIN])
};