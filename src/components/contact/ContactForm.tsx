"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const SUBJECT_SUGGESTIONS = [
  "Factual Correction",
  "Schedule & Match Timing",
  "Editorial Feedback",
  "Press & Media Inquiry",
  "Copyright & DMCA",
];

const CONTACT_EMAIL = "nplhubnepal@gmail.com";
const CONTACT_PHONE_DISPLAY = "+977 9814996840";
const CONTACT_PHONE_TEL = "+9779814996840";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // _gotcha honeypot

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isUnconfigured, setIsUnconfigured] = useState(false);

  // Validate form fields
  const validate = (): FormErrors => {
    const errs: FormErrors = {};

    if (!name.trim()) {
      errs.name = "Full name is required.";
    } else if (name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters.";
    } else if (name.trim().length > 100) {
      errs.name = "Name must be under 100 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!emailRegex.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    } else if (email.trim().length > 254) {
      errs.email = "Email address is too long.";
    }

    if (!subject.trim()) {
      errs.subject = "Subject is required.";
    } else if (subject.trim().length < 3) {
      errs.subject = "Subject must be at least 3 characters.";
    } else if (subject.trim().length > 150) {
      errs.subject = "Subject must be under 150 characters.";
    }

    if (!message.trim()) {
      errs.message = "Message is required.";
    } else if (message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters.";
    } else if (message.trim().length > 3000) {
      errs.message = "Message cannot exceed 3,000 characters.";
    }

    return errs;
  };

  const errors = validate();

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields touched
    setTouched({ name: true, email: true, subject: true, message: true });

    const currentErrors = validate();
    if (Object.keys(currentErrors).length > 0) {
      setStatus("error");
      setStatusMessage("Please fix the errors in the form before submitting.");
      return;
    }

    setStatus("submitting");
    setStatusMessage("");
    setIsUnconfigured(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          _gotcha: honeypot,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setStatus("success");
        setStatusMessage(
          data.message ||
            "Thank you! Your message has been sent successfully. Our editorial desk will review it shortly."
        );
      } else {
        setStatus("error");
        setIsUnconfigured(Boolean(data?.unconfigured));
        setStatusMessage(
          data?.error ||
            "Unable to deliver message at this time. Please contact us directly via email."
        );
      }
    } catch {
      setStatus("error");
      setStatusMessage(
        "A network error occurred while submitting the form. Please check your internet connection or email us directly."
      );
    }
  };

  const handleReset = () => {
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setHoneypot("");
    setTouched({});
    setStatus("idle");
    setStatusMessage("");
    setIsUnconfigured(false);
  };

  // Success view
  if (status === "success") {
    return (
      <div
        role="region"
        aria-live="polite"
        className="rounded-[var(--radius-lg)] border border-emerald-300 bg-emerald-50 p-6 sm:p-8 text-emerald-950"
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xl">
            ✓
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-emerald-950">Message Sent Successfully</h3>
            <p className="text-sm text-emerald-900 leading-relaxed">
              Thank you, <strong className="font-semibold">{name}</strong>. Your correspondence regarding{" "}
              <strong className="font-semibold">&quot;{subject}&quot;</strong> has been forwarded to the NPL Hub Nepal
              editorial team.
            </p>
            <p className="text-xs text-emerald-800">
              We will review your message and reply to <span className="underline font-medium">{email}</span> within
              3&ndash;5 business days.
            </p>
            <div className="pt-4">
              <Button type="button" variant="secondary" size="sm" onClick={handleReset}>
                Send Another Message
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-rule)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-xs">
      <div className="mb-6 pb-4 border-b border-[var(--color-rule)]">
        <h2 className="text-lg font-black text-[var(--color-ink)] mb-1">Send Us a Direct Message</h2>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Fill out the form below. Messages are routed directly to our editorial and data administration desk.
        </p>
      </div>

      {status === "error" && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-[var(--radius-md)] border border-red-300 bg-red-50 p-4 text-xs text-red-900 space-y-2"
        >
          <div className="flex items-start gap-2">
            <span className="font-bold text-red-700 text-sm" aria-hidden="true">
              ⚠
            </span>
            <div className="space-y-1">
              <strong className="block font-semibold">Submission Issue</strong>
              <p>{statusMessage}</p>
              {isUnconfigured && (
                <p className="text-red-800 pt-1">
                  You can reach us immediately by email at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="underline font-bold">
                    {CONTACT_EMAIL}
                  </a>{" "}
                  or phone at{" "}
                  <a href={`tel:${CONTACT_PHONE_TEL}`} className="underline font-bold">
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Spam Honeypot - hidden from human users */}
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="_gotcha">Leave this field blank</label>
          <input
            id="_gotcha"
            type="text"
            name="_gotcha"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {/* Row 1: Name and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="contact-name"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] mb-1.5"
            >
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              name="name"
              required
              disabled={status === "submitting"}
              placeholder="e.g., Aayush Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              aria-invalid={touched.name && Boolean(errors.name)}
              aria-describedby={touched.name && errors.name ? "name-error" : undefined}
              className={`w-full rounded-[var(--radius-md)] border px-3.5 py-2.5 text-sm bg-[var(--color-canvas)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 transition-colors ${
                touched.name && errors.name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-[var(--color-rule)] focus:border-[var(--color-brand)] focus:ring-[var(--color-brand)]"
              }`}
            />
            {touched.name && errors.name && (
              <p id="name-error" className="mt-1 text-xs text-red-600 font-medium">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="contact-email"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] mb-1.5"
            >
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              name="email"
              required
              disabled={status === "submitting"}
              placeholder="e.g., aayush@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              aria-invalid={touched.email && Boolean(errors.email)}
              aria-describedby={touched.email && errors.email ? "email-error" : undefined}
              className={`w-full rounded-[var(--radius-md)] border px-3.5 py-2.5 text-sm bg-[var(--color-canvas)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 transition-colors ${
                touched.email && errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-[var(--color-rule)] focus:border-[var(--color-brand)] focus:ring-[var(--color-brand)]"
              }`}
            />
            {touched.email && errors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600 font-medium">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Subject Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="contact-subject"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]"
            >
              Subject <span className="text-red-600">*</span>
            </label>
            <span className="text-[11px] text-[var(--color-ink-muted)]">3–150 characters</span>
          </div>
          <input
            id="contact-subject"
            type="text"
            name="subject"
            required
            disabled={status === "submitting"}
            placeholder="e.g., Factual correction for Match 1 schedule"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onBlur={() => handleBlur("subject")}
            aria-invalid={touched.subject && Boolean(errors.subject)}
            aria-describedby={touched.subject && errors.subject ? "subject-error" : undefined}
            className={`w-full rounded-[var(--radius-md)] border px-3.5 py-2.5 text-sm bg-[var(--color-canvas)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 transition-colors ${
              touched.subject && errors.subject
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-[var(--color-rule)] focus:border-[var(--color-brand)] focus:ring-[var(--color-brand)]"
            }`}
          />
          {touched.subject && errors.subject && (
            <p id="subject-error" className="mt-1 text-xs text-red-600 font-medium">
              {errors.subject}
            </p>
          )}

          {/* Quick topic pills */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[var(--color-ink-muted)] mr-1">Quick topics:</span>
            {SUBJECT_SUGGESTIONS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  setSubject(topic);
                  setTouched((prev) => ({ ...prev, subject: true }));
                }}
                className="text-[11px] px-2 py-0.5 rounded border border-[var(--color-rule)] bg-[var(--color-canvas)] text-[var(--color-ink-secondary)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] transition-colors cursor-pointer"
              >
                + {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Message Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="contact-message"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]"
            >
              Message Details <span className="text-red-600">*</span>
            </label>
            <span
              className={`text-[11px] ${
                message.length > 3000
                  ? "text-red-600 font-bold"
                  : message.length >= 10
                  ? "text-[var(--color-brand)]"
                  : "text-[var(--color-ink-muted)]"
              }`}
            >
              {message.length} / 3000 chars (min 10)
            </span>
          </div>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            disabled={status === "submitting"}
            placeholder="Please detail your observation, correction, or inquiry. If reporting a schedule or score discrepancy, please include the relevant match number and date."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => handleBlur("message")}
            aria-invalid={touched.message && Boolean(errors.message)}
            aria-describedby={touched.message && errors.message ? "message-error" : undefined}
            className={`w-full rounded-[var(--radius-md)] border px-3.5 py-2.5 text-sm bg-[var(--color-canvas)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 transition-colors leading-relaxed ${
              touched.message && errors.message
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-[var(--color-rule)] focus:border-[var(--color-brand)] focus:ring-[var(--color-brand)]"
            }`}
          />
          {touched.message && errors.message && (
            <p id="message-error" className="mt-1 text-xs text-red-600 font-medium">
              {errors.message}
            </p>
          )}
        </div>

        {/* Security & Anti-spam disclaimer */}
        <p className="text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
          Submissions are protected against spam via automated verification and processed in accordance with our{" "}
          <a href="/privacy-policy" className="text-[var(--color-brand)] hover:underline">
            Privacy Policy
          </a>
          . We never share or monetize contact details.
        </p>

        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={status === "submitting"}
            disabled={status === "submitting"}
            fullWidth
          >
            {status === "submitting" ? "Transmitting Message..." : "Send Message"}
          </Button>
        </div>
      </form>
    </div>
  );
}
