import Joi from "joi"

export const configuration = () => ({
    servicePort: parseInt(process.env.TRIP_SERVICE_PORT || "3002"),
    dbPort: parseInt(process.env.TRIPDB_PORT || "5433"),
    dbUsername: process.env.TRIPDB_USERNAME, 
    dbPassword: process.env.TRIPDB_PASSWORD, 
    dbDatabase: process.env.TRIPDB_DATABASE
})

export const tripConfigValidation = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'), 

    TRIP_SERVICE_PORT: Joi.number().default(3002),

    TRIPDB_HOST: Joi.string().required(),
    TRIPDB_PORT: Joi.number().default(5433),
    TRIPDB_USERNAME: Joi.string().required(),
    TRIPDB_PASSWORD: Joi.string().required(),
    TRIPDB_DATABASE: Joi.string().required()
})