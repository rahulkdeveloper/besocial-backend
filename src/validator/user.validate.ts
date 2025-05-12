import Joi from "joi";

export const signupSchema = Joi.object({
    email:Joi.string()
    .email()
    .required()
    .messages({
        "straing.base":"Email must be a string",
        "string.empty":"Email is required",
        "string.email":"Please provide a valid email address",
        "any.required":"Email is required"
    }),
    fullName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.base": "Full name must be a string",
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 3 characters",
      "string.max": "Full name must be at most 100 characters",
      "any.required": "Full name is required"
    }),
    username: Joi.string()
    .min(5)
    .max(100)
    .required()
    .messages({
      "string.base": "username must be a string",
      "string.empty": "username is required",
      "string.min": "username must be at least 5 characters",
      "string.max": "username must be at most 100 characters",
      "any.required": "username is required"
    }),
    password: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password must be at most 30 characters",
      "any.required": "Password is required"
    }),
    // phone: Joi.string()
    // .pattern(/^[0-9]{10,15}$/)
    // .required()
    // .messages({
    //   "string.pattern.base": "Phone number must be between 10 to 15 digits",
    //   "string.empty": "Phone number is required",
    //   "any.required": "Phone number is required"
    // }),
    gender: Joi.string()
    .valid("male", "female", "other")
    .required()
    .messages({
      "any.only": "Gender must be one of male, female, or other",
      "any.required": "Gender is required"
    }),
    dateOfBirth: Joi.date()
    .required()
    .messages({
      "date.base": "Date of birth must be a valid date",
      "any.required": "Date of birth is required"
    }),
    // bio:Joi.string()
    // .optional()
    // .messages({
    //     'string.base':'bio must be a string'
    // })
})