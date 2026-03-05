import { NextFunction } from "express";
import { Request, Response } from 'express'
import { ObjectSchema, ValidationErrorItem } from "joi";

type Source = 'body' | 'query' | 'params'
export const validate = (schema: ObjectSchema, source: Source = "body") => {
    console.log("validation func");

    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req[source], { abortEarly: false });

        if (error) {
            const formattedErrors = error.details.map((err: ValidationErrorItem) => {
                return {
                    field: err.path[0],
                    message: err.message
                }
            })
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: formattedErrors[0]
            })
        }
        next()
    }
}