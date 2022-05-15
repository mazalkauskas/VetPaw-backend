const Joi = require('joi');

const prescriptionGetSchema = Joi.object({
  owner_email: Joi.string().email().lowercase().trim().required(),
});

const prescriptionPostSchema = Joi.object({
  pet_id: Joi.number().required(),
  medication_id: Joi.number().required(),
  comment: Joi.string().lowercase().trim().required(),
});

module.exports = {
  prescriptionGetSchema,
  prescriptionPostSchema,
};
