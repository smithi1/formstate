import { type ZodIssue, z, type ZodError } from "zod";
/**
 * Simplified form error type containing only essential fields from ZodIssue
 */
export type FormError = {
    code: string;
    path: (string | number)[];
    message: string;
};
/**
 * Convert a ZodIssue to a FormError
 * @param issue The ZodIssue to convert
 * @returns A simplified FormError
 */
export declare const zodIssueToFormError: (issue: ZodIssue) => FormError;
/**
 * Form success state with validated data
 * T represents the validated data type that passed schema validation
 */
export type FormSuccess<T = unknown> = {
    success: true;
    message?: string;
    data: T;
    errors?: never[];
};
/**
 * Form failure state with validation errors and raw input
 * The data in a failure state might be incomplete or invalid.
 * R represents the raw input type, which defaults to Record<string, unknown>
 * Best practice is to only access data in success states, and use fallback values
 * or initial state data in failure states.
 */
export type FormFailure<_T = unknown, R = Record<string, unknown>> = {
    success: false;
    errors?: FormError[];
    error?: string;
    message?: string;
    data?: R;
};
/**
 * Usage example for form state handling:
 *
 * 1. Server Action:
 * ```typescript
 * const formServerAction = async (
 *   prevState: FormState<TypeForFormDataFields>,
 *   formData: FormData,
 * ): Promise<FormState<TypeForFormDataFields>> => {
 *   const validatedFields = formDataSchema.safeParse(formData)
 *   if (!validatedFields.success) {
 *     return zodErrorToFormState(validatedFields.error, formData)
 *   }
 *   // ... handle success case
 * }
 * ```
 *
 * 2. Component Usage:
 * ```typescript
 * // Initialize state
 * const [state, formAction] = useActionState<FormState<TypeForFormDataFields>, FormData>(
 *   formServerAction,
 *   initialState
 * )
 *
 * // Safely handle data access with fallbacks
 * const value = state?.success
 *   ? state.data.someField
 *   : (initialState.data.someField ?? "")
 * ```
 */
/**
 * Combined form state type using discriminated union
 * T is the validated data type that will be available in success state
 * R is the raw input type for failure states (defaults to Record<string, unknown>)
 *
 * Best practice:
 * - Only specify T when using FormState
 * - Let R default to Record<string, unknown>
 * - Only access data fields when state.success is true
 * - Use fallback values when in failure state
 */
export type FormState<T = unknown, R = Record<string, unknown>> = FormSuccess<T> | FormFailure<T, R>;
/**
 * Schema for FormError validation
 */
export declare const formErrorSchema: z.ZodObject<{
    code: z.ZodString;
    path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, "many">;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    path: (string | number)[];
    message: string;
}, {
    code: string;
    path: (string | number)[];
    message: string;
}>;
/**
 * Creates a Zod schema for FormState with a specific data schema
 * @param dataSchema The Zod schema for the data property
 * @returns A Zod schema for FormState<T> where T is defined by dataSchema
 */
export declare const createFormStateSchema: <T>(dataSchema: z.ZodType<T>) => z.ZodType<FormState<T>>;
/**
 * Default FormState schema with any data
 */
export declare const formStateSchema: z.ZodType<FormState<any, Record<string, unknown>>, z.ZodTypeDef, FormState<any, Record<string, unknown>>>;
/**
 * Convert a ZodError to a FormState
 * @param error The ZodError to convert
 * @param rawFormData The raw input data that failed validation
 * @returns A FormState with errors from the ZodError
 */
export declare const zodErrorToFormState: <T, R = Record<string, unknown>>(error: ZodError, rawFormData: R) => FormState<T, R>;
