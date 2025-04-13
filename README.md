# formstate

A lightweight form state management utility for Next.js 15 and React 19 applications, designed to work seamlessly with React's `useActionState()` and `useFormStatus()` hooks.

## Features

- Type-safe form state management
- Seamless integration with Zod validation
- Built-in support for Next.js server actions
- Automatic error handling and state synchronization
- Zero dependencies (except peer dependencies)

## Installation

```bash
bun add github:smithi1/formstate
```

## Usage

### Basic Form State Management

```typescript
import { FormState } from "formstate";

// Define your form state type
type LoginFormState = {
  email: string;
  password: string;
};

// Create a form state instance
const formState: FormState<LoginFormState> = {
  success: false,
  data: {
    email: "",
    password: "",
  },
};

// Use in your component
function LoginForm() {
  const [state, formAction] = useActionState(
    async (prevState: FormState<LoginFormState>, formData: FormData) => {
      // Your form submission logic here
      return formState;
    },
    formState,
  );

  return (
    <form action={formAction}>
      <input
        name="email"
        defaultValue={state.success ? state.data.email : ""}
      />
      {!state.success && state.errors?.[0]?.message && (
        <p>{state.errors[0].message}</p>
      )}
      <input
        name="password"
        type="password"
        defaultValue={state.success ? state.data.password : ""}
      />
      {!state.success && state.errors?.[1]?.message && (
        <p>{state.errors[1].message}</p>
      )}
      <button type="submit" disabled={isPending}>
        {isPending ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

### Server Action Integration

```typescript
import { FormState, zodErrorToFormState } from "formstate";
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

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodErrorToFormState<LoginFormState>(error, {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      });
    }
    throw error;
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

## TypeScript Support

This library is fully typed and works seamlessly with TypeScript. All form states and validation errors are type-safe.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
