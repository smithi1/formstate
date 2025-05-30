# @smithi1/formstate

A lightweight form state management utility for Next.js 15 and React 19 applications, designed to work seamlessly with React's `useActionState()` and `useFormStatus()` hooks.

## Features

- Type-safe form state management
- Seamless integration with Zod validation
- Built-in support for Next.js server actions
- Automatic error handling and state synchronization
- Zero dependencies (except peer dependencies)

## Installation

```bash
# Install from GitHub
bun add github:smithi1/formstate
```

## Usage

For a repository with this, and a more complex example visit the [formstate-example](https://github.com/smithi1/formstate-example) repository.

### Zod Schema Management

```typescript
// schema.ts
import { z } from "zod";
import { FormState } from "@smithi1/formstate";

// Zod validation schema for the form fields
export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type ContactFormState = FormState<ContactFormData>;
```

### Basic Form State Management

```typescript
"use client";

import { useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";

// Shadcn form components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// contactform.ts
import { ContactFormState, ContactFormData } from "./schema";
import { contactFormAction } from "./action";
import { getErrorsForField } from "@smithi1/formstate";

// Initial state of the form state instance
const initialState: ContactFormState = {
  success: false,
  data: {
    name: "",
    email: "",
  } as ContactFormData,
};

// Use in your component
function SimpleForm() {
  const [state, formAction] = useActionState<ContactFormState, FormData>(
    contactFormAction,
    initialState,
  );

  const { pending } = useFormStatus();

  useEffect(() => {
    if (state.success) {
      // Handle successful form submission...
    }
  }, [state.success, state.data]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          name="name"
          placeholder="Name"
          defaultValue={String(
            state.success ? state.data.name : state.data?.name ?? "",
          )}
        />
        {getErrorsForField(state, "name").map((error, index) => (
          <p key={index} className="text-red-500 text-xs">
            {error}
          </p>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          name="email"
          placeholder="Email"
          defaultValue={String(
            state.success ? state.data.email : state.data?.email ?? "",
          )}
        />
        {getErrorsForField(state, "email").map((error, index) => (
          <p key={index} className="text-red-500 text-xs">
            {error}
          </p>
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting..." : "Submit"}
        </Button>

        {state.message && (
          <p
            className={
              "text-center " +
              (state.success ? "text-green-500" : "text-red-500")
            }
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

export default SimpleForm;
```

### Server Action Integration

```typescript
"use server";

// action.ts

import { zodErrorToFormState } from "@smithi1/formstate";
import {
  contactFormSchema,
  type ContactFormState,
  type ContactFormData,
} from "./schema";

// Dummy email sending function
async function sendContactEmail(data: ContactFormData): Promise<void> {
  console.log("Sending email to:", data.email);
}

// Server action
export async function contactFormAction(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
  };

  const parseResult = contactFormSchema.safeParse(rawData);

  // Return the errors, and content of the failed fields
  // to be restored into the form fields
  if (!parseResult.success)
    return zodErrorToFormState(parseResult.error, rawData);

  const validatedData: ContactFormData = parseResult.data;

  try {
    // Your form submission logic here
    // For example, sending an email or saving to a database
    await sendContactEmail(validatedData);

    return {
      success: true,
      data: validatedData,
      message: "Thank you!",
    };
  } catch {
    return {
      success: false,
      data: rawData,
      message: "Failed to send message. Please try again.",
      errors: [
        {
          code: "SUBMISSION_ERROR",
          path: [],
          message: "Failed to process your request",
        },
      ],
    };
  }
}
```

## API Reference

### `FormState<T>`

A discriminated union type that represents either a successful form state or a failed form state.

```typescript
type FormState<T = unknown, R = Record<string, unknown>> =
  | FormSuccess<T>
  | FormFailure<T, R>;
```

### `zodErrorToFormState<T>`

A utility function that converts Zod validation errors to a FormState object.

```typescript
function zodErrorToFormState<T, R = Record<string, unknown>>(
  error: z.ZodError,
  rawFormData: R,
): FormState<T, R>;
```

### `getErrorsForField`

A utility function that extracts error messages for a specific field from form state. Supports dot notation for nested fields.

```typescript
function getErrorsForField(
  state: FormState,
  fieldName: string,
): string[];
```

**Examples:**
```typescript
// Simple field
const nameErrors = getErrorsForField(state, "name");

// Nested object field
const emailErrors = getErrorsForField(state, "user.email");

// Array index field
const itemErrors = getErrorsForField(state, "items.0.name");

// Deep nested field
const streetErrors = getErrorsForField(state, "form.address.street");
```

## TypeScript Support

This library is fully typed and works seamlessly with TypeScript. All form states and validation errors are type-safe.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
