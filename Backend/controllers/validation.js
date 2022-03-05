const Joi = require('joi');

const loginValidation = data => {
    const schema = Joi.object({
        role: Joi.string().min(3).required(),
        username: Joi.string().min(3).required(),
        password: Joi.string().min(6).required()
    });

    return schema.validate(data);
}

const phoneValidation = data => {
    const schema = Joi.object({
        phone : Joi.string().length(10).pattern(/^[0-9]+$/).required()
    });

    return schema.validate(data);
}

module.exports.loginValidation = loginValidation;
module.exports.phoneValidation = phoneValidation;
