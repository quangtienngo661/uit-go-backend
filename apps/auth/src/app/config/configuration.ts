import Joi from "joi"

export const configuration = () => ({
    servicePort: parseInt(process.env.AUTH_SERVICE_PORT || "3001"),
    dbPort: parseInt(process.env.AUTHDB_PORT || "5432"),
    dbUsername: process.env.AUTHDB_USERNAME,
    dbPassword: process.env.AUTHDB_PASSWORD,
    dbDatabase: process.env.AUTHDB_DATABASE
})

export const authConfigValidation = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),

    AUTH_SERVICE_PORT: Joi.number().default(3001),

    AUTHDB_HOST: Joi.string().required(),
    AUTHDB_PORT: Joi.number().default(5432),
    AUTHDB_USERNAME: Joi.string().required(),
    AUTHDB_PASSWORD: Joi.string().required(),
    AUTHDB_DATABASE: Joi.string().required()
})