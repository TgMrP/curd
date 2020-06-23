const jwt = require('jsonwebtoken');
const users = require('./auth.model');

function checkTokenSetUser(req, res, next) {
    const authHeader = req.get('Authorization');
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
            // use jwt lib to decode
            jwt.verify(token, process.env.TOKEN_SECRET, async (error, user) => {
                let me = '';
                if (error) {
                    // TODO something ??? maybe send error?! ban form 1 min?!
                    console.log('not valid token');
                }
                else{
                    me = await users.findById(user._id, '-password');
                }
                req.user = me;
                next();
            });
        }
        else {
            next();
        }
    }
    else {
        next();
    }
}

function isLoggedIn(req, res, next) {
    if (req.user) {
        next();
    }
    else {
        unAuthorized(res, next);
    }
}

function isAdmin(req, res, next) {
    if (req.user.role === 'admin') {
        next();
    }
    else {
        unAuthorized(res, next);
    }
}

function unAuthorized(res, next) {
    const error = new Error('🚫 Un-Authorized 🚫');
    res.status(401);
    next(error);
}

const findUser = (defaultLoginError, isError, errorCode = 422) => async (req, res, next) => {
    try {
        const user = await users.findOne({'username': {'$regex': req.body.username,$options:'i'}});
        if (isError(user)) {
            res.status(errorCode);
            next(new Error(defaultLoginError));
        }
        else {
            req.loggingInUser = user;
            next();
        }
    }
    catch (error) {
        res.status(500);
        next(error);
    }
};

const findUserEmail = (defaultLoginError, isError, errorCode = 422) => async (req, res, next) => {
    try {
        const user = await users.findOne({'email': {'$regex': req.body.email,$options:'i'}});
        if (isError(user)) {
            res.status(errorCode);
            next(new Error(defaultLoginError));
        }
        else {
            req.loggingInUser = user;
            next();
        }
    }
    catch (error) {
        res.status(500);
        next(error);
    }
};

const validateUser = (defaultErrorMessage = '') => (req, res, next) => {
    const user = new users(req.body);
    user.validate(function(err) {
        if (err){
            const error = defaultErrorMessage ? new Error(defaultErrorMessage) : err;
            res.status(422);
            next(error);
        }
        else{
            next();
        }
    });

};

module.exports = {
    checkTokenSetUser,
    isLoggedIn,
    isAdmin,
    findUser,
    findUserEmail,
    validateUser
};
