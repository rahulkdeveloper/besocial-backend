"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema, source = "body") => {
    console.log("validation func");
    return (req, res, next) => {
        const { error } = schema.validate(req[source], { abortEarly: false });
        if (error) {
            const formattedErrors = error.details.map((err) => {
                return {
                    field: err.path[0],
                    message: err.message
                };
            });
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: formattedErrors[0]
            });
            return;
        }
        next();
    };
};
exports.validate = validate;
