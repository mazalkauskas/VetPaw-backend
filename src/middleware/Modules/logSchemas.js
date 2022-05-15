const Joi = require('joi');

const logGetSchema = Joi.object({
  owner_email: Joi.string().email().lowercase().trim().required(),
});

const logPostSchema = Joi.object({
  pet_id: Joi.number().required(),
  description: Joi.string().lowercase().trim().required(),
  status: Joi.string().lowercase().trim().required(),
});

module.exports = {
  logGetSchema,
  logPostSchema,
};
