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
export const zodIssueToFormError = (issue: ZodIssue): FormError => ({
  code: issue.code,
  path: issue.path,
  message: issue.message,
});

/**
 * Form success state with validated data
 * T represents the validated data type that passed schema validation
 */
export type FormSuccess<T = unknown> = {
  success: true;
  message?: string;
  data: T;
  // Errors must be empty if included.
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
export type FormState<T = unknown, R = Record<string, unknown>> =
  | FormSuccess<T>
  | FormFailure<T, R>;

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
export const createFormStateSchema = <T>(
  dataSchema: z.ZodType<T>,
): z.ZodType<FormState<T>> => {
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
  ]) as z.ZodType<FormState<T>>;
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
export const zodErrorToFormState = <T, R = Record<string, unknown>>(
  error: ZodError,
  rawFormData: R,
): FormState<T, R> => {
  return {
    success: false,
    errors: error.issues.map(zodIssueToFormError),
    message: "Validation failed",
    data: rawFormData,
  };
};
