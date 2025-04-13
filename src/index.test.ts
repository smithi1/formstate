import { describe, expect, test } from "bun:test";
import { FormState, zodErrorToFormState } from "./index";
import { z } from "zod";

describe("FormState", () => {
  test("creates a valid form state", () => {
    const state = new FormState({
      data: { email: "test@example.com", password: "password123" },
    });

    expect(state.data.email).toBe("test@example.com");
    expect(state.data.password).toBe("password123");
    expect(state.errors).toEqual({});
    expect(state.isValid).toBe(true);
  });

  test("creates a form state with errors", () => {
    const state = new FormState({
      data: { email: "", password: "" },
      errors: { email: "Email is required", password: "Password is required" },
    });

    expect(state.errors.email).toBe("Email is required");
    expect(state.errors.password).toBe("Password is required");
    expect(state.isValid).toBe(false);
  });
});

describe("zodErrorToFormState", () => {
  test("converts Zod errors to form state", () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    try {
      schema.parse({ email: "invalid", password: "short" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const state = zodErrorToFormState<{ email: string; password: string }>(
          error,
        );

        expect(state.errors.email).toBeDefined();
        expect(state.errors.password).toBeDefined();
        expect(state.isValid).toBe(false);
      }
    }
  });
});
