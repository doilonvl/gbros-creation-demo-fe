import type { ReactNode } from "react";
import type { Locale } from "@/types/content";
import type { TocItem } from "@/types/blog";
import { normalizeTocIds } from "@/lib/blogs";

export type LexicalNode = {
  type?: string;
  text?: string;
  children?: LexicalNode[];
  tag?: string;
  level?: number;
  src?: string;
  url?: string;
  altText?: string;
  caption?: unknown;
  format?: number | string;
  direction?: string | null;
  indent?: number;
  version?: number;
  listType?: string;
  language?: string;
};

export type LexicalDoc = {
  root?: LexicalNode;
  children?: LexicalNode[];
};

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0110\u0111]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractPlainTextFromLexical(node: LexicalNode | null): string {
  if (!node) return "";
  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }
  const children = node.children || [];
  return children.map((child) => extractPlainTextFromLexical(child)).join(" ");
}

function getAlignmentClass(format?: number | string) {
  if (typeof format !== "string") return "";
  if (format === "center") return "text-center";
  if (format === "right") return "text-right";
  if (format === "justify") return "text-justify";
  return "";
}

function getTextFormatClass(format?: number | string) {
  if (!format) return "";
  if (typeof format === "string") {
    return format;
  }
  const classes: string[] = [];
  if (format & 1) classes.push("font-semibold");
  if (format & 2) classes.push("italic");
  if (format & 4) classes.push("underline");
  if (format & 8) classes.push("line-through");
  if (format & 16)
    classes.push("rounded bg-muted px-1 py-0.5 font-mono text-xs");
  return classes.join(" ");
}

export function extractHeadingsFromLexical(doc: LexicalDoc): TocItem[] {
  const items: TocItem[] = [];
  const used = new Map<string, number>();

  function walk(node: LexicalNode) {
    if (node.type === "heading") {
      const level =
        typeof node.level === "number"
          ? node.level
          : node.tag === "h1"
          ? 1
          : node.tag === "h3"
          ? 3
          : 2;
      if (level === 2 || level === 3) {
        const text = extractPlainTextFromLexical(node).trim();
        if (text) {
          const base = slugifyHeading(text) || "section";
          const count = (used.get(base) || 0) + 1;
          used.set(base, count);
          const id = count === 1 ? base : `${base}-${count}`;
          items.push({ id, text, level });
        }
      }
    }
    (node.children || []).forEach(walk);
  }

  const roots = doc?.root?.children || doc?.children || [];
  roots.forEach(walk);
  return items;
}

type LexicalContentRendererProps = {
  doc: LexicalDoc | null | undefined;
  toc?: TocItem[];
  locale: Locale;
};

export default function LexicalContentRenderer({
  doc,
  toc,
  locale: _locale,
}: LexicalContentRendererProps) {
  if (!doc) return null;

  const resolvedToc = toc?.length
    ? normalizeTocIds(toc)
    : extractHeadingsFromLexical(doc);

  const usedIds = new Map<string, number>();

  const ensureUniqueId = (id: string) => {
    const count = (usedIds.get(id) || 0) + 1;
    usedIds.set(id, count);
    return count === 1 ? id : `${id}-${count}`;
  };

  type RenderResult = {
    element: ReactNode;
    nextHeadingIndex: number;
  };

  const renderNodes = (
    children: LexicalNode[] | undefined,
    headingIndex: number
  ) => {
    let current = headingIndex;
    const elements = (children || []).map((child, index) => {
      const result = renderNode(child, index, current);
      current = result.nextHeadingIndex;
      return result.element;
    });
    return { elements, nextHeadingIndex: current };
  };

  const renderNode = (
    node: LexicalNode,
    key: number,
    headingIndex: number
  ): RenderResult => {
    switch (node.type) {
      case "root": {
        const result = renderNodes(node.children, headingIndex);
        return {
          element: <div key={key}>{result.elements}</div>,
          nextHeadingIndex: result.nextHeadingIndex,
        };
      }
      case "heading": {
        const level =
          typeof node.level === "number"
            ? node.level
            : node.tag === "h1"
            ? 1
            : node.tag === "h3"
            ? 3
            : 2;
        const Tag = level === 1 ? "h1" : level === 3 ? "h3" : "h2";
        const headingClassName =
          level === 1
            ? "mt-7 mb-3 text-2xl font-semibold"
            : level === 3
            ? "mt-5 mb-2 text-lg font-semibold"
            : "mt-6 mb-2 text-xl font-semibold";
        const text = extractPlainTextFromLexical(node).trim();
        const shouldTrack = level === 2 || level === 3;
        const tocItem = shouldTrack ? resolvedToc[headingIndex] : undefined;
        const fallbackId = slugifyHeading(text) || "section";
        const id = ensureUniqueId(tocItem?.id || fallbackId);
        const alignmentClass = getAlignmentClass(node.format);
        const nextIndex = shouldTrack ? headingIndex + 1 : headingIndex;
        const result = renderNodes(node.children, nextIndex);
        return {
          element: (
            <Tag
              key={key}
              id={id}
              className={
                [
                  "scroll-mt-24",
                  headingClassName,
                  alignmentClass || "",
                ].join(" ")
              }
            >
              {result.elements}
            </Tag>
          ),
          nextHeadingIndex: result.nextHeadingIndex,
        };
      }
      case "paragraph": {
        const alignmentClass = getAlignmentClass(node.format);
        const result = renderNodes(node.children, headingIndex);
        return {
          element: (
            <p key={key} className={alignmentClass || undefined}>
              {result.elements}
            </p>
          ),
          nextHeadingIndex: result.nextHeadingIndex,
        };
      }
      case "text":
        return {
          element: (
            <span
              key={key}
              className={getTextFormatClass(node.format) || undefined}
            >
              {node.text}
            </span>
          ),
          nextHeadingIndex: headingIndex,
        };
      case "linebreak":
        return { element: <br key={key} />, nextHeadingIndex: headingIndex };
      case "quote": {
        const result = renderNodes(node.children, headingIndex);
        return {
          element: (
            <blockquote
              key={key}
              className="my-4 border-l-4 border-slate-200 pl-4 text-muted-foreground"
            >
              {result.elements}
            </blockquote>
          ),
          nextHeadingIndex: result.nextHeadingIndex,
        };
      }
      case "list": {
        const isOrdered =
          node.listType === "number" ||
          node.listType === "ordered" ||
          node.tag === "ol";
        const Tag = isOrdered ? "ol" : "ul";
        const result = renderNodes(node.children, headingIndex);
        return {
          element: (
            <Tag
              key={key}
              className={
                isOrdered ? "my-3 ml-6 list-decimal" : "my-3 ml-6 list-disc"
              }
            >
              {result.elements}
            </Tag>
          ),
          nextHeadingIndex: result.nextHeadingIndex,
        };
      }
      case "listitem": {
        const result = renderNodes(node.children, headingIndex);
        return {
          element: (
            <li key={key} className="my-1">
              {result.elements}
            </li>
          ),
          nextHeadingIndex: result.nextHeadingIndex,
        };
      }
      case "code": {
        const codeText = extractPlainTextFromLexical(node);
        return {
          element: (
            <pre
              key={key}
              className="my-4 overflow-x-auto rounded-lg bg-slate-950/90 p-4 text-xs text-slate-100"
            >
              <code>{codeText}</code>
            </pre>
          ),
          nextHeadingIndex: headingIndex,
        };
      }
      case "table": {
        const result = renderNodes(node.children, headingIndex);
        return {
          element: (
            <table
              key={key}
              className="my-4 w-full border-collapse overflow-hidden rounded-lg border text-sm"
            >
              <tbody>{result.elements}</tbody>
            </table>
          ),
          nextHeadingIndex: result.nextHeadingIndex,
        };
      }
      case "tablerow": {
        const result = renderNodes(node.children, headingIndex);
        return {
          element: <tr key={key}>{result.elements}</tr>,
          nextHeadingIndex: result.nextHeadingIndex,
        };
      }
      case "tablecell": {
        const result = renderNodes(node.children, headingIndex);
        return {
          element: (
            <td key={key} className="border px-3 py-2 align-top">
              {result.elements}
            </td>
          ),
          nextHeadingIndex: result.nextHeadingIndex,
        };
      }
      case "image": {
        const src = node.src || node.url;
        if (!src) {
          return { element: null, nextHeadingIndex: headingIndex };
        }
        const alt = node.altText || "";
        const captionText =
          typeof node.caption === "string"
            ? node.caption
            : extractPlainTextFromLexical(node.caption as LexicalNode);
        return {
          element: (
            <figure key={key} className="my-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="w-full rounded-2xl border object-cover"
                loading="lazy"
              />
              {captionText ? (
                <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                  {captionText}
                </figcaption>
              ) : null}
            </figure>
          ),
          nextHeadingIndex: headingIndex,
        };
      }
      default: {
        if (node.children?.length) {
          const result = renderNodes(node.children, headingIndex);
          return {
            element: <div key={key}>{result.elements}</div>,
            nextHeadingIndex: result.nextHeadingIndex,
          };
        }
        return { element: null, nextHeadingIndex: headingIndex };
      }
    }
  };

  const nodes = doc?.root?.children || doc?.children || [];
  const rendered = renderNodes(nodes, 0);
  return <>{rendered.elements}</>;
}
