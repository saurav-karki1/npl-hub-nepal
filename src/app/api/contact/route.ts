import { NextResponse } from "next/server";

interface ContactPayload {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  _gotcha?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as ContactPayload | null;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { name, email, subject, message, _gotcha } = body;

    // Honeypot spam protection: bots fill _gotcha
    if (_gotcha && _gotcha.trim().length > 0) {
      // Return 200 to drop spam bots silently without sending an email
      return NextResponse.json({
        success: true,
        message: "Your message has been received.",
      });
    }

    // Server-side validation
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    const trimmedSubject = typeof subject === "string" ? subject.trim() : "";
    const trimmedMessage = typeof message === "string" ? message.trim() : "";

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid full name (2–100 characters)." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail) || trimmedEmail.length > 254) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!trimmedSubject || trimmedSubject.length < 3 || trimmedSubject.length > 150) {
      return NextResponse.json(
        { success: false, error: "Please enter a subject (3–150 characters)." },
        { status: 400 }
      );
    }

    if (!trimmedMessage || trimmedMessage.length < 10 || trimmedMessage.length > 3000) {
      return NextResponse.json(
        { success: false, error: "Please enter a message between 10 and 3,000 characters." },
        { status: 400 }
      );
    }

    // Check delivery service configuration
    const formspreeId = process.env.FORMSPREE_FORM_ID?.trim();
    const customEndpoint = process.env.CONTACT_FORM_ENDPOINT?.trim();

    if (!formspreeId && !customEndpoint) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The contact form email service is currently awaiting configuration by the site administrator. Please send your message directly to nplhubnepal@gmail.com or call +977 9814996840.",
          unconfigured: true,
        },
        { status: 503 }
      );
    }

    // Strip leading "f/" if the owner provided it in the form ID
    const cleanFormId = formspreeId ? formspreeId.replace(/^f\//, "") : "";
    const endpoint = customEndpoint || `https://formspree.io/f/${cleanFormId}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
      }),
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message:
          "Thank you! Your message has been sent successfully. Our editorial team will review your message and reply as soon as possible.",
      });
    }

    const errorData = await response.json().catch(() => null);
    const detailedMessage =
      errorData?.errors?.map((e: { message?: string }) => e.message).filter(Boolean).join(", ") ||
      errorData?.error ||
      "The message delivery service returned an error.";

    return NextResponse.json(
      {
        success: false,
        error: `${detailedMessage} Please email us directly at nplhubnepal@gmail.com or call +977 9814996840.`,
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("[Contact API] Error processing contact submission:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected error occurred while transmitting your message. Please email us directly at nplhubnepal@gmail.com or call +977 9814996840.",
      },
      { status: 500 }
    );
  }
}
