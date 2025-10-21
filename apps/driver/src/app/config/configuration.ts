import Joi from "joi"

export const configuration = () => ({
    servicePort: parseInt(process.env.DRIVER_SERVICE_PORT || "3003"),
    dbPort: parseInt(process.env.DRIVERDB_PORT || "5434"),
    dbUsername: process.env.DRIVERDB_USERNAME, 
    dbPassword: process.env.DRIVERDB_PASSWORD, 
    dbDatabase: process.env.DRIVERDB_DATABASE
})

export const driverConfigValidation = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'), 

    DRIVER_SERVICE_PORT: Joi.number().default(3003),

    DRIVERDB_HOST: Joi.string().required(),
    DRIVERDB_PORT: Joi.number().default(5434),
    DRIVERDB_USERNAME: Joi.string().required(),
    DRIVERDB_PASSWORD: Joi.string().required(),
    DRIVERDB_DATABASE: Joi.string().required()
})