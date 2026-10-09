/**
 * NPL Hub Nepal — Structured Article Block Types
 *
 * Defines the semantic block schema for rich article content.
 * Compatible with Gemini AI structuring, Admin Block Editor,
 * and semantic frontend rendering (<p>, <h2>, <h3>, <ul>, <ol>, <blockquote>, FAQ).
 */

export type ArticleBlockType =
  | "paragraph"
  | "heading"
  | "list"
  | "quote"
  | "faq"
  | "link"
  | "image"
  | "table"
  | "match";

export interface ParagraphBlock {
  type: "paragraph";
  text: string;
}

export interface HeadingBlock {
  type: "heading";
  level: 2 | 3;
  text: string;
}

export interface ListBlock {
  type: "list";
  style: "unordered" | "ordered";
  items: string[];
}

export interface QuoteBlock {
  type: "quote";
  text: string;
  author?: string;
}

export interface FaqBlock {
  type: "faq";
  question: string;
  answer: string;
}

export interface LinkBlock {
  type: "link";
  text: string;
  url: string;
}

export interface ImageBlock {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface TableBlock {
  type: "table";
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface MatchBlock {
  type: "match";
  matchSlug: string;
  title?: string;
}

export type ArticleBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | FaqBlock
  | LinkBlock
  | ImageBlock
  | TableBlock
  | MatchBlock;

export interface ArticleStructuredContent {
  blocks: ArticleBlock[];
}

/**
 * Normalizes any article content representation (legacy string[], JSONB object, or block array)
 * into a standard ArticleBlock[] array.
 * Ensures 100% backward compatibility with existing articles.
 */
export function normalizeArticleBlocks(content: unknown): ArticleBlock[] {
  if (!content) return [];

  // 1. If it's an object with a `blocks` array: { blocks: [...] }
  if (
    typeof content === "object" &&
    content !== null &&
    !Array.isArray(content) &&
    "blocks" in content &&
    Array.isArray((content as { blocks: unknown[] }).blocks)
  ) {
    const rawBlocks = (content as { blocks: unknown[] }).blocks;
    return rawBlocks
      .map(sanitizeBlock)
      .filter((b): b is ArticleBlock => b !== null);
  }

  // 2. If it's already an array of block objects: [{ type: "paragraph", ... }]
  if (
    Array.isArray(content) &&
    content.length > 0 &&
    typeof content[0] === "object" &&
    content[0] !== null &&
    "type" in content[0]
  ) {
    return content
      .map(sanitizeBlock)
      .filter((b): b is ArticleBlock => b !== null);
  }

  // 3. If it's a legacy array of strings (e.g. ["## Heading", "paragraph", ...])
  if (Array.isArray(content)) {
    return content
      .map((item): ArticleBlock | null => {
        const text = String(item ?? "").trim();
        if (!text) return null;

        if (text.startsWith("### ")) {
          return { type: "heading", level: 3, text: text.slice(4).trim() };
        }
        if (text.startsWith("## ")) {
          return { type: "heading", level: 2, text: text.slice(3).trim() };
        }
        if (text.startsWith("Note:")) {
          return { type: "quote", text };
        }
        const imgMatch = text.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:[\s\S]*?\*([^*]+)\*)?/);
        if (imgMatch) {
          const caption = imgMatch[3]?.trim();
          return {
            type: "image",
            alt: imgMatch[1],
            src: imgMatch[2],
            ...(caption ? { caption } : {}),
          };
        }
        return { type: "paragraph", text };
      })
      .filter((b): b is ArticleBlock => b !== null);
  }

  // 4. If it's a single string
  if (typeof content === "string" && content.trim()) {
    return [{ type: "paragraph", text: content.trim() }];
  }

  return [];
}

/**
 * Validates and sanitizes a single raw block object.
 */
export function sanitizeBlock(raw: unknown): ArticleBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const type = String(obj.type || "").toLowerCase();

  switch (type) {
    case "heading": {
      const text = String(obj.text || "").trim();
      if (!text) return null;
      const levelNum = Number(obj.level);
      const level: 2 | 3 = levelNum === 3 ? 3 : 2;
      return { type: "heading", level, text };
    }
    case "list": {
      const style: "unordered" | "ordered" =
        obj.style === "ordered" ? "ordered" : "unordered";
      const rawItems = Array.isArray(obj.items) ? obj.items : [];
      const items = rawItems
        .map((it) => String(it ?? "").trim())
        .filter((it) => it.length > 0);
      if (items.length === 0) return null;
      return { type: "list", style, items };
    }
    case "quote": {
      const text = String(obj.text || "").trim();
      if (!text) return null;
      const author = obj.author ? String(obj.author).trim() : undefined;
      return { type: "quote", text, ...(author ? { author } : {}) };
    }
    case "faq": {
      const question = String(obj.question || "").trim();
      const answer = String(obj.answer || "").trim();
      if (!question || !answer) return null;
      return { type: "faq", question, answer };
    }
    case "link": {
      const text = String(obj.text || "").trim();
      const url = String(obj.url || "").trim();
      if (!text || !url) return null;
      return { type: "link", text, url };
    }
    case "image": {
      const src = String(obj.src || "").trim();
      if (!src) return null;
      const alt = String(obj.alt || "").trim();
      const caption = obj.caption ? String(obj.caption).trim() : undefined;
      const width =
        typeof obj.width === "number" && obj.width > 0 ? obj.width : undefined;
      const height =
        typeof obj.height === "number" && obj.height > 0 ? obj.height : undefined;
      return {
        type: "image",
        src,
        alt,
        ...(caption ? { caption } : {}),
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      };
    }
    case "table": {
      const caption = obj.caption ? String(obj.caption).trim() : undefined;
      const headers = Array.isArray(obj.headers)
        ? obj.headers.map((h) => String(h ?? "").trim())
        : [];
      const rows = Array.isArray(obj.rows)
        ? (obj.rows as unknown[]).map((r) =>
            Array.isArray(r) ? r.map((c) => String(c ?? "").trim()) : []
          )
        : [];
      if (headers.length === 0 && rows.length === 0) return null;
      return {
        type: "table",
        headers,
        rows,
        ...(caption ? { caption } : {}),
      };
    }
    case "match": {
      const matchSlug = String(obj.matchSlug || obj.match_slug || "").trim();
      if (!matchSlug) return null;
      const title = obj.title ? String(obj.title).trim() : undefined;
      return {
        type: "match",
        matchSlug,
        ...(title ? { title } : {}),
      };
    }
    case "paragraph":
    default: {
      const text = String(obj.text || "").trim();
      if (!text) return null;
      return { type: "paragraph", text };
    }
  }
}

/**
 * Converts blocks back into plain text (for editing or backwards compatibility).
 */
export function blocksToPlainText(blocks: ArticleBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return block.level === 3 ? `### ${block.text}` : `## ${block.text}`;
        case "list":
          return block.items
            .map((item, idx) =>
              block.style === "ordered" ? `${idx + 1}. ${item}` : `- ${item}`
            )
            .join("\n");
        case "quote":
          return `> ${block.text}${block.author ? ` — ${block.author}` : ""}`;
        case "faq":
          return `Q: ${block.question}\nA: ${block.answer}`;
        case "link":
          return `[${block.text}](${block.url})`;
        case "image":
          return `![${block.alt}](${block.src})${block.caption ? `\n*${block.caption}*` : ""}`;
        case "table": {
          const headerLine = block.headers.length > 0 ? `| ${block.headers.join(" | ")} |` : "";
          const rowLines = block.rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
          return `${headerLine}\n${rowLines}`.trim();
        }
        case "match":
          return `[Match Preview: ${block.matchSlug}]`;
        case "paragraph":
        default:
          return block.text;
      }
    })
    .join("\n\n");
}
