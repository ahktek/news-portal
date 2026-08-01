"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldName = "email" | "password" | "confirmPassword" | "displayName";
type FieldErrors = Partial<Record<FieldName, string>>;

interface FormValues {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

const INITIAL_VALUES: FormValues = {
  email: "",
  password: "",
  confirmPassword: "",
  displayName: "",
};

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
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match";
  }

  const displayName = values.displayName.trim();
  if (!displayName) {
    errors.displayName = "Display name is required";
  } else if (displayName.length > 100) {
    errors.displayName = "Display name must be 100 characters or fewer";
  }

  return errors;
}

// ─── Password strength ────────────────────────────────────

type StrengthLevel = "weak" | "fair" | "strong";

function getPasswordStrength(
  password: string,
): { label: StrengthLevel; segments: 1 | 2 | 3 } | null {
  if (!password) return null;
  if (password.length < 8) return { label: "weak", segments: 1 };

  // Score: length + character variety.
  let score = 1; // meets minimum length
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { label: "weak", segments: 1 };
  if (score === 3) return { label: "fair", segments: 2 };
  return { label: "strong", segments: 3 };
}

const STRENGTH_STYLES: Record<
  StrengthLevel,
  { text: string; bar: string; label: string }
> = {
  weak: { text: "text-red-500", bar: "bg-red-500", label: "Weak" },
  fair: { text: "text-amber-500", bar: "bg-amber-500", label: "Fair" },
  strong: { text: "text-emerald-500", bar: "bg-emerald-500", label: "Strong" },
};

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

export default function RegisterPage() {
  const { register } = useAuth();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const strength = getPasswordStrength(values.password);

  const handleChange = (field: FieldName) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear the inline error for this field as the user types.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) return;

    setIsSubmitting(true);
    setServerError(null);

    const result = await register(values.email, values.password, values.displayName);

    setIsSubmitting(false);
    if (result.success) {
      setRegistered(true);
    } else if (result.error) {
      setServerError(result.error);
    }
  };

  // ── Success state ──
  // Move focus to the success heading so screen-reader and keyboard users
  // are told the account was created (the form they were in disappears).
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (registered) successHeadingRef.current?.focus();
  }, [registered]);

  if (registered) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-emerald-600 dark:text-emerald-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1
              ref={successHeadingRef}
              tabIndex={-1}
              className="font-display text-xl font-extrabold text-slate-900 dark:text-white mt-5 outline-none"
            >
              Account created successfully
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Your TANGENT CMS account is ready. If email confirmation is enabled
              on this environment, check your inbox for a verification link — then
              sign in below.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center w-full bg-accent-primary hover:bg-accent-hover text-white text-sm font-bold px-5 py-3 rounded-full transition-colors duration-200"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form state ──
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
            Create your account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Join the TANGENT CMS to write and publish.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8">
          <hr className="cobalt-rule mb-6" aria-hidden="true" />

          {/* Email verification notice */}
          <div className="mb-5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 px-4 py-3 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>A verification email will be sent to your address. You can verify now or later — your account will work immediately regardless.</span>
          </div>

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
                htmlFor="register-email"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Email address
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="you@tangent.news"
                value={values.email}
                onChange={handleChange("email")}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "register-email-error" : undefined}
                style={
                  errors.email ? { borderColor: "var(--color-tangent-red)" } : undefined
                }
                className="admin-input bg-white dark:bg-slate-800/60"
              />
              <FieldError id="register-email-error" message={errors.email} />
            </div>

            {/* Display name */}
            <div>
              <label
                htmlFor="register-display-name"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Display name
              </label>
              <input
                id="register-display-name"
                type="text"
                autoComplete="name"
                placeholder="How should readers see your byline?"
                value={values.displayName}
                onChange={handleChange("displayName")}
                maxLength={101}
                aria-invalid={errors.displayName ? true : undefined}
                aria-describedby={
                  errors.displayName ? "register-display-name-error" : undefined
                }
                style={
                  errors.displayName
                    ? { borderColor: "var(--color-tangent-red)" }
                    : undefined
                }
                className="admin-input bg-white dark:bg-slate-800/60"
              />
              <FieldError id="register-display-name-error" message={errors.displayName} />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Password
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={values.password}
                onChange={handleChange("password")}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={
                  errors.password ? "register-password-error" : undefined
                }
                style={
                  errors.password ? { borderColor: "var(--color-tangent-red)" } : undefined
                }
                className="admin-input bg-white dark:bg-slate-800/60"
              />

              {/* Strength indicator */}
              {strength && !errors.password && (
                <div className="mt-2" aria-live="polite">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Password strength
                    </span>
                    <span
                      className={`text-xs font-bold ${STRENGTH_STYLES[strength.label].text}`}
                    >
                      {STRENGTH_STYLES[strength.label].label}
                    </span>
                  </div>
                  <div className="mt-1.5 flex gap-1.5" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          i < strength.segments
                            ? STRENGTH_STYLES[strength.label].bar
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {!strength && (
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  Use at least 8 characters — a mix of cases, numbers and symbols is
                  stronger.
                </p>
              )}
              <FieldError id="register-password-error" message={errors.password} />
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Confirm password
              </label>
              <input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={values.confirmPassword}
                onChange={handleChange("confirmPassword")}
                aria-invalid={errors.confirmPassword ? true : undefined}
                aria-describedby={
                  errors.confirmPassword ? "register-confirm-password-error" : undefined
                }
                style={
                  errors.confirmPassword
                    ? { borderColor: "var(--color-tangent-red)" }
                    : undefined
                }
                className="admin-input bg-white dark:bg-slate-800/60"
              />
              <FieldError
                id="register-confirm-password-error"
                message={errors.confirmPassword}
              />
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
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-accent-primary hover:text-accent-hover transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
