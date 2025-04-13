import { z } from "zod";
/**
 * Convert a ZodIssue to a FormError
 * @param issue The ZodIssue to convert
 * @returns A simplified FormError
 */
export const zodIssueToFormError = (issue) => ({
    code: issue.code,
    path: issue.path,
    message: issue.message,
});
/**
 * Schema for FormError validation
 */
export const formErrorSchema = z.object({
    code: z.string(),
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string(),
});
/**
 * Creates a Zod schema for FormState with a specific data schema
 * @param dataSchema The Zod schema for the data property
 * @returns A Zod schema for FormState<T> where T is defined by dataSchema
 */
export const createFormStateSchema = (dataSchema) => {
    const successSchema = z.object({
        success: z.literal(true),
        message: z.string().optional(),
        data: dataSchema,
        errors: z.array(formErrorSchema).length(0).optional(),
    });
    const failureSchema = z.object({
        success: z.literal(false),
        message: z.string().optional(),
        errors: z.array(formErrorSchema).optional(),
        error: z.string().optional(),
        data: z.record(z.unknown()).optional(),
    });
    return z.discriminatedUnion("success", [
        successSchema,
        failureSchema,
    ]);
};
/**
 * Default FormState schema with any data
 */
export const formStateSchema = createFormStateSchema(z.any());
/**
 * Convert a ZodError to a FormState
 * @param error The ZodError to convert
 * @param rawFormData The raw input data that failed validation
 * @returns A FormState with errors from the ZodError
 */
export const zodErrorToFormState = (error, rawFormData) => {
    return {
        success: false,
        errors: error.issues.map(zodIssueToFormError),
        message: "Validation failed",
        data: rawFormData,
    };
};
