import React from "react";
import Link from "next/link";

/**
 * Parses markdown inline formatting (bold, italic) into semantic React elements.
 */
function renderInlineFormatting(str: string): React.ReactNode {
  if (!str) return null;
  if (!str.includes("*")) return str;

  // Regex matching ***bold italic***, **bold**, and *italic*
  const formatRegex = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = formatRegex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(str.slice(lastIdx, match.index));
    }

    if (match[2]) {
      // ***bold italic***
      parts.push(
        <strong key={`bi-${key++}`} className="font-bold text-[var(--color-ink)]">
          <em className="italic">{match[2]}</em>
        </strong>
      );
    } else if (match[3]) {
      // **bold**
      parts.push(
        <strong key={`b-${key++}`} className="font-bold text-[var(--color-ink)]">
          {match[3]}
        </strong>
      );
    } else if (match[4]) {
      // *italic*
      parts.push(
        <em key={`i-${key++}`} className="italic">
          {match[4]}
        </em>
      );
    }

    lastIdx = formatRegex.lastIndex;
  }

  if (lastIdx < str.length) {
    parts.push(str.slice(lastIdx));
  }

  return <>{parts}</>;
}

/**
 * Parses markdown links [anchor text](url) and inline formatting (bold, italic)
 * in article text into semantic React elements:
 * - Internal URLs (starting with "/") render as Next.js <Link> elements.
 * - External URLs (http:// or https://) render as secure <a> tags with target="_blank" and rel="noopener noreferrer".
 * - Inline formatting (**bold**, *italic*) renders as <strong> and <em> tags.
 * - Zero dangerouslySetInnerHTML used — fully immune to XSS.
 */
export function renderRichText(text: string): React.ReactNode {
  if (!text) return null;

  // Regex matching [anchor](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  // Check if there are any links; if none, parse inline formatting directly
  if (!linkRegex.test(text)) {
    return renderInlineFormatting(text);
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

    // Push formatted text before the link
    if (matchStart > lastIndex) {
      elements.push(
        <React.Fragment key={`pre-${keyCounter++}`}>
          {renderInlineFormatting(text.slice(lastIndex, matchStart))}
        </React.Fragment>
      );
    }

    const anchorText = match[1];
    const rawUrl = match[2].trim();
    const formattedAnchor = renderInlineFormatting(anchorText);

    // Determine if internal or external
    if (rawUrl.startsWith("/")) {
      // Clean internal canonical link
      elements.push(
        <Link
          key={`link-${keyCounter++}`}
          href={rawUrl}
          className="text-[var(--color-brand)] hover:underline font-medium underline-offset-2 transition-colors"
        >
          {formattedAnchor}
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
          <span>{formattedAnchor}</span>
          <span
            className="text-[10px] text-[var(--color-brand)]/80 select-none"
            aria-hidden="true"
          >
            ↗
          </span>
        </a>
      );
    } else {
      // Fallback: render formatted anchor text
      elements.push(
        <React.Fragment key={`fb-${keyCounter++}`}>
          {formattedAnchor}
        </React.Fragment>
      );
    }

    lastIndex = matchEnd;
  }

  // Push any remaining text after the last link
  if (lastIndex < text.length) {
    elements.push(
      <React.Fragment key={`post-${keyCounter++}`}>
        {renderInlineFormatting(text.slice(lastIndex))}
      </React.Fragment>
    );
  }

  return <>{elements}</>;
}
