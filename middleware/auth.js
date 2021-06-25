const jwt = require('jsonwebtoken')
const config = require('config')

module.exports = function auth(...permittedRoles) {

    return (req, res, next) => {
        // Get token from header
        const token = req.header('x-auth-token');

        // Check if not token
        if (!token) {
            return res.status(401).json({msg: 'No token, authorization denied'});
        }

        // Verify token
        try {
            jwt.verify(token, config.get('jwtSecret'), (error, decoded) => {
                if (error) {
                    return res.status(401).json({msg: 'Token is not valid'});
                } else {
                    req.user = decoded.user;
                    if (permittedRoles.includes(req.user.role)){
                        next();
                    }
                    else{
                        return res.status(403).json({message: "Unauthorized"}); // user is forbidden
                    }
                }
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({msg: 'Server Error'});
        }
    };

}