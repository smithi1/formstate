import { describe, expect, test } from "bun:test";
import {
  FormState,
  zodErrorToFormState,
  FormSuccess,
  FormFailure,
} from "./index";
import { z } from "zod";

describe("FormState", () => {
  test("creates a valid form state", () => {
    const state: FormSuccess<{ email: string; password: string }> = {
      success: true,
      data: { email: "test@example.com", password: "password123" },
    };

    expect(state.success).toBe(true);
    expect(state.data.email).toBe("test@example.com");
    expect(state.data.password).toBe("password123");
  });

  test("creates a form state with errors", () => {
    const state: FormFailure<{ email: string; password: string }> = {
      success: false,
      errors: [
        { code: "invalid_type", path: ["email"], message: "Email is required" },
        {
          code: "invalid_type",
          path: ["password"],
          message: "Password is required",
        },
      ],
      data: { email: "", password: "" },
    };

    expect(state.success).toBe(false);
    expect(state.errors?.[0].message).toBe("Email is required");
    expect(state.errors?.[1].message).toBe("Password is required");
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
          { email: "invalid", password: "short" },
        );

        expect(state.success).toBe(false);
        expect(state.errors).toBeDefined();
        expect(state.errors?.length).toBeGreaterThan(0);
        expect(state.data).toEqual({ email: "invalid", password: "short" });
      }
    }
  });
});
