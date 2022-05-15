const Joi = require('joi');

const metPostSchema = Joi.object({
  med_name: Joi.string().lowercase().trim().required(),
  description: Joi.string().lowercase().trim().required(),
});

module.exports = {
  metPostSchema,
};
