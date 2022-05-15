const Joi = require('joi');

const petGetSchema = Joi.object({
  owner_email: Joi.string().email().lowercase().trim().required(),
});

const petPostSchema = Joi.object({
  name: Joi.string().lowercase().trim().required(),
  owner_email: Joi.string().email().lowercase().trim().required(),
  animal: Joi.string().lowercase().trim(),
  breed: Joi.string().lowercase().trim(),
  date_of_birth: Joi.date(),
});

module.exports = {
  petGetSchema,
  petPostSchema,
};
