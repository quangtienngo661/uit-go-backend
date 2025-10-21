import Joi from "joi"

export const configuration = () => ({
    servicePort: parseInt(process.env.USER_SERVICE_PORT || "3001"),
    dbPort: parseInt(process.env.USERDB_PORT || "5432"),
    dbUsername: process.env.USERDB_USERNAME, 
    dbPassword: process.env.USERDB_PASSWORD, 
    dbDatabase: process.env.USERDB_DATABASE
})

export const userConfigValidation = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'), 

    USER_SERVICE_PORT: Joi.number().default(3001),

    USERDB_HOST: Joi.string().required(),
    USERDB_PORT: Joi.number().default(5432),
    USERDB_USERNAME: Joi.string().required(),
    USERDB_PASSWORD: Joi.string().required(),
    USERDB_DATABASE: Joi.string().required()
})