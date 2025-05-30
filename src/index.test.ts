import { describe, expect, test } from "bun:test";
import {
  FormState,
  zodErrorToFormState,
  FormSuccess,
  FormFailure,
  getErrorsForField,
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

describe("getErrorsForField", () => {
  test("returns empty array for success state", () => {
    const state: FormSuccess<{ email: string }> = {
      success: true,
      data: { email: "test@example.com" },
    };

    const errors = getErrorsForField(state, "email");
    expect(errors).toEqual([]);
  });

  test("returns empty array when no errors exist", () => {
    const state: FormFailure = {
      success: false,
    };

    const errors = getErrorsForField(state, "email");
    expect(errors).toEqual([]);
  });

  test("returns empty array when field has no errors", () => {
    const state: FormFailure = {
      success: false,
      errors: [
        { code: "invalid_type", path: ["password"], message: "Password is required" },
      ],
    };

    const errors = getErrorsForField(state, "email");
    expect(errors).toEqual([]);
  });

  test("returns error messages for specified field", () => {
    const state: FormFailure = {
      success: false,
      errors: [
        { code: "invalid_type", path: ["email"], message: "Email is required" },
        { code: "invalid_string", path: ["email"], message: "Invalid email format" },
        { code: "invalid_type", path: ["password"], message: "Password is required" },
      ],
    };

    const errors = getErrorsForField(state, "email");
    expect(errors).toEqual(["Email is required", "Invalid email format"]);
  });

  test("returns single error message for field", () => {
    const state: FormFailure = {
      success: false,
      errors: [
        { code: "invalid_type", path: ["email"], message: "Email is required" },
        { code: "invalid_type", path: ["password"], message: "Password is required" },
      ],
    };

    const errors = getErrorsForField(state, "password");
    expect(errors).toEqual(["Password is required"]);
  });

  test("ignores nested field errors", () => {
    const state: FormFailure = {
      success: false,
      errors: [
        { code: "invalid_type", path: ["user", "email"], message: "Nested email error" },
        { code: "invalid_type", path: ["email"], message: "Top-level email error" },
      ],
    };

    const errors = getErrorsForField(state, "email");
    expect(errors).toEqual(["Top-level email error"]);
  });

  test("ignores array index paths", () => {
    const state: FormFailure = {
      success: false,
      errors: [
        { code: "invalid_type", path: ["items", 0, "name"], message: "Array item error" },
        { code: "invalid_type", path: ["name"], message: "Top-level name error" },
      ],
    };

    const errors = getErrorsForField(state, "name");
    expect(errors).toEqual(["Top-level name error"]);
  });

  describe("nested field path support", () => {
    test("returns errors for nested object fields", () => {
      const state: FormFailure = {
        success: false,
        errors: [
          { code: "invalid_type", path: ["user", "email"], message: "Nested email is required" },
          { code: "invalid_string", path: ["user", "email"], message: "Invalid nested email format" },
          { code: "invalid_type", path: ["email"], message: "Top-level email error" },
        ],
      };

      const errors = getErrorsForField(state, "user.email");
      expect(errors).toEqual(["Nested email is required", "Invalid nested email format"]);
    });

    test("returns errors for array index fields", () => {
      const state: FormFailure = {
        success: false,
        errors: [
          { code: "invalid_type", path: ["items", 0, "name"], message: "First item name required" },
          { code: "invalid_type", path: ["items", 1, "name"], message: "Second item name required" },
        ],
      };

      const errors = getErrorsForField(state, "items.0.name");
      expect(errors).toEqual(["First item name required"]);
    });

    test("returns errors for deeply nested fields", () => {
      const state: FormFailure = {
        success: false,
        errors: [
          { code: "invalid_type", path: ["form", "address", "street"], message: "Street is required" },
          { code: "invalid_type", path: ["form", "address", "city"], message: "City is required" },
        ],
      };

      const errors = getErrorsForField(state, "form.address.street");
      expect(errors).toEqual(["Street is required"]);
    });

    test("returns empty array for non-existent nested field", () => {
      const state: FormFailure = {
        success: false,
        errors: [
          { code: "invalid_type", path: ["user", "email"], message: "Email error" },
        ],
      };

      const errors = getErrorsForField(state, "user.phone");
      expect(errors).toEqual([]);
    });

    test("handles mixed numeric and string path segments", () => {
      const state: FormFailure = {
        success: false,
        errors: [
          { code: "invalid_type", path: ["users", 0, "profile", "name"], message: "User profile name error" },
        ],
      };

      const errors = getErrorsForField(state, "users.0.profile.name");
      expect(errors).toEqual(["User profile name error"]);
    });

    test("does not match partial paths", () => {
      const state: FormFailure = {
        success: false,
        errors: [
          { code: "invalid_type", path: ["user", "profile", "email"], message: "Deep email error" },
        ],
      };

      const errors = getErrorsForField(state, "user.profile");
      expect(errors).toEqual([]);
    });
  });
});
