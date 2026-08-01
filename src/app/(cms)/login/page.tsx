"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldName = "email" | "password";
type FieldErrors = Partial<Record<FieldName, string>>;

interface FormValues {
  email: string;
  password: string;
}

const INITIAL_VALUES: FormValues = { email: "", password: "" };

// ─── Validation ───────────────────────────────────────────

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  const email = values.email.trim();
  if (!email) {
    errors.email = "Email address is required";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Password is required";
  }

  return errors;
}

// ─── Small presentational pieces ──────────────────────────

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-600 dark:text-red-400"
    >
      <svg
        className="w-3.5 h-3.5 shrink-0 mt-px"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </p>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: FieldName) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) return;

    setIsSubmitting(true);
    setServerError(null);

    const result = await login(values.email, values.password);

    setIsSubmitting(false);
    if (result.success) {
      router.push("/dashboard");
    } else if (result.error) {
      setServerError(result.error);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand + heading */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-baseline font-sans text-2xl font-black tracking-tight text-slate-900 dark:text-white no-underline"
          >
            TANGENT<span className="text-accent-primary">.</span>
          </Link>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-4">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Sign in to the TANGENT CMS.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8">
          <hr className="cobalt-rule mb-6" aria-hidden="true" />

          {serverError && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@tangent.news"
                value={values.email}
                onChange={handleChange("email")}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                style={errors.email ? { borderColor: "var(--color-tangent-red)" } : undefined}
                className="admin-input bg-white dark:bg-slate-800/60"
              />
              <FieldError id="login-email-error" message={errors.email} />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={values.password}
                onChange={handleChange("password")}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                style={
                  errors.password ? { borderColor: "var(--color-tangent-red)" } : undefined
                }
                className="admin-input bg-white dark:bg-slate-800/60"
              />
              <FieldError id="login-password-error" message={errors.password} />
              {/* Placed after the input so tab order is email → password →
                  forgot-password → submit. */}
              <div className="mt-2 text-right">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  title="Password reset is not wired up yet — coming in a follow-up"
                  className="inline-block text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-accent-primary transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-accent-primary hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-accent-primary text-white text-sm font-bold px-5 py-3 rounded-full transition-colors duration-200"
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-accent-primary hover:text-accent-hover transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
