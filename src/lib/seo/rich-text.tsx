import React from "react";
import Link from "next/link";

/**
 * Parses markdown links [anchor text](url) in article text into semantic React elements:
 * - Internal URLs (starting with "/") render as Next.js <Link> elements.
 * - External URLs (http:// or https://) render as secure <a> tags with target="_blank" and rel="noopener noreferrer".
 * - Unsafe or unparseable URLs fall back to plain text.
 * - Zero dangerouslySetInnerHTML used — fully immune to XSS.
 */
export function renderRichText(text: string): React.ReactNode {
  if (!text) return null;

  // Regex matching [anchor](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  // Check if there are any links
  if (!linkRegex.test(text)) {
    return text;
  }

  // Reset regex index after test()
  linkRegex.lastIndex = 0;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = linkRegex.lastIndex;

    // Push plain text before the link
    if (matchStart > lastIndex) {
      elements.push(text.slice(lastIndex, matchStart));
    }

    const anchorText = match[1];
    const rawUrl = match[2].trim();

    // Determine if internal or external
    if (rawUrl.startsWith("/")) {
      // Clean internal canonical link
      elements.push(
        <Link
          key={`link-${keyCounter++}`}
          href={rawUrl}
          className="text-[var(--color-brand)] hover:underline font-medium underline-offset-2 transition-colors"
        >
          {anchorText}
        </Link>
      );
    } else if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      // Validated external link
      elements.push(
        <a
          key={`link-${keyCounter++}`}
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-brand)] hover:underline font-medium underline-offset-2 transition-colors inline-flex items-baseline gap-0.5"
        >
          <span>{anchorText}</span>
          <span
            className="text-[10px] text-[var(--color-brand)]/80 select-none"
            aria-hidden="true"
          >
            ↗
          </span>
        </a>
      );
    } else {
      // Fallback: render plain anchor text
      elements.push(anchorText);
    }

    lastIndex = matchEnd;
  }

  // Push any remaining text after the last link
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return <>{elements}</>;
}
