# @ian/formstate

A lightweight form state management utility for Next.js 15 and React 19 applications, designed to work seamlessly with React's `useActionState()` and `useFormStatus()` hooks.

## Features

- Type-safe form state management
- Seamless integration with Zod validation
- Built-in support for Next.js server actions
- Automatic error handling and state synchronization
- Zero dependencies (except peer dependencies)

## Installation

```bash
bun add @ian/formstate
```

## Usage

### Basic Form State Management

```typescript
import { FormState, FormError } from "@ian/formstate";

// Define your form state type
type LoginFormState = {
  email: string;
  password: string;
};

// Create a form state instance
const formState = new FormState<LoginFormState>({
  email: "",
  password: "",
});

// Use in your component
function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState<LoginFormState>, formData: FormData) => {
      // Your form submission logic here
      return formState;
    },
    formState,
  );

  return (
    <form action={formAction}>
      <input name="email" defaultValue={state.data.email} />
      {state.errors.email && <p>{state.errors.email}</p>}
      <input
        name="password"
        type="password"
        defaultValue={state.data.password}
      />
      {state.errors.password && <p>{state.errors.password}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

### Server Action Integration

```typescript
import { FormState, zodErrorToFormState } from "@ian/formstate";
import { z } from "zod";

// Define your validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// In your server action
export async function loginAction(
  prevState: FormState<LoginFormState>,
  formData: FormData,
) {
  try {
    const data = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    // Your login logic here

    return new FormState<LoginFormState>({
      data,
      errors: {},
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodErrorToFormState<LoginFormState>(error);
    }
    throw error;
  }
}
```

## API Reference

### `FormState<T>`

A class that manages form state, including data and validation errors.

```typescript
class FormState<T> {
  constructor(initialState: { data: T; errors?: Record<keyof T, string> });

  data: T;
  errors: Record<keyof T, string>;
  isValid: boolean;
}
```

### `FormError`

A type representing a form validation error.

```typescript
type FormError = {
  field: string;
  message: string;
};
```

### `zodErrorToFormState<T>`

A utility function that converts Zod validation errors to a FormState object.

```typescript
function zodErrorToFormState<T>(error: z.ZodError): FormState<T>;
```

## TypeScript Support

This library is fully typed and works seamlessly with TypeScript. All form states and validation errors are type-safe.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
