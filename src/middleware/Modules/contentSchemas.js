const Joi = require('joi');

const petPostSchema = Joi.object({
  pet_name: Joi.string().lowercase().trim().required(),
  owner_email: Joi.string().email().lowercase().trim().required(),
  animal: Joi.string().lowercase().trim(),
  breed: Joi.string().lowercase().trim(),
  date_of_birth: Joi.date(),
});

const logPostSchema = Joi.object({
  pet_id: Joi.number().required(),
  description: Joi.string().lowercase().trim().required(),
  status: Joi.string().lowercase().trim().required(),
});

const medPostSchema = Joi.object({
  med_name: Joi.string().lowercase().trim().required(),
  description: Joi.string().lowercase().trim().required(),
});

const prescriptionPostSchema = Joi.object({
  pet_id: Joi.number().required(),
  medication_id: Joi.number().required(),
  comment: Joi.string().lowercase().trim().required(),
});

module.exports = {
  petPostSchema,
  logPostSchema,
  medPostSchema,
  prescriptionPostSchema,
};
