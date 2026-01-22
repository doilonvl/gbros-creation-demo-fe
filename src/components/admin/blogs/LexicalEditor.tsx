"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  type EditorState,
  REDO_COMMAND,
  UNDO_COMMAND,
  createCommand,
  DecoratorNode,
  type EditorConfig,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $createCodeNode, CodeHighlightNode, CodeNode } from "@lexical/code";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  INSERT_TABLE_COMMAND,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from "@lexical/react/LexicalAutoLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { uploadBlogImage, uploadBlogImages } from "@/lib/api/blogs.admin";
import type { LexicalDoc } from "@/components/blog/LexicalContentRenderer";

type ImagePayload = {
  src: string;
  altText?: string;
  caption?: string | null;
};

type SerializedImageNode = Spread<
  {
    type: "image";
    version: 1;
    src: string;
    altText?: string;
    caption?: string | null;
  },
  SerializedLexicalNode
>;

const IMAGE_CLASSNAME = "my-6 w-full rounded-2xl border object-cover";
const EMPTY_LEXICAL_DOC: LexicalDoc = {
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: null,
    children: [
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: null,
        children: [],
      },
    ],
  },
};

function resolveEditorState(value: LexicalDoc | null) {
  if (!value || typeof value !== "object") return undefined;
  const root = (value as LexicalDoc).root as {
    children?: unknown[];
  } | null;
  if (!root || !Array.isArray(root.children) || root.children.length === 0) {
    return JSON.stringify(EMPTY_LEXICAL_DOC);
  }
  return JSON.stringify(value);
}

export const INSERT_IMAGE_COMMAND = createCommand<ImagePayload>();

class ImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __altText: string;
  __caption: string | null;

  static getType() {
    return "image";
  }

  static clone(node: ImageNode) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__caption,
      node.__key
    );
  }

  constructor(
    src: string,
    altText = "",
    caption: string | null = null,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__caption = caption;
  }

  static importJSON(serializedNode: SerializedImageNode) {
    return new ImageNode(
      serializedNode.src,
      serializedNode.altText || "",
      serializedNode.caption ?? null
    );
  }

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
      caption: this.__caption,
    };
  }

  createDOM(_config: EditorConfig) {
    const span = document.createElement("span");
    return span;
  }

  updateDOM(_prevNode: ImageNode, _dom: HTMLElement, _config: EditorConfig) {
    return false;
  }

  isInline() {
    return false;
  }

  decorate(): ReactNode {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        caption={this.__caption}
        nodeKey={this.getKey()}
      />
    );
  }

  setAltText(altText: string) {
    const writable = this.getWritable();
    writable.__altText = altText;
  }

  setCaption(caption: string | null) {
    const writable = this.getWritable();
    writable.__caption = caption;
  }
}

function $isImageNode(
  node: { getType?: () => string } | null | undefined
): node is ImageNode {
  return !!node && node.getType?.() === "image";
}

function ImageComponent({
  src,
  altText,
  caption,
  nodeKey,
}: {
  src: string;
  altText: string;
  caption: string | null;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const [isEditing, setIsEditing] = useState(false);
  const [draftAlt, setDraftAlt] = useState(altText);
  const [draftCaption, setDraftCaption] = useState(caption || "");

  useEffect(() => {
    setDraftAlt(altText);
  }, [altText]);

  useEffect(() => {
    setDraftCaption(caption || "");
  }, [caption]);

  const applyChanges = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setAltText(draftAlt.trim());
        node.setCaption(draftCaption.trim() ? draftCaption.trim() : null);
      }
    });
    setIsEditing(false);
  };

  return (
    <figure className="relative">
      <div
        className="group relative"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelected(true);
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelected(true);
          setIsEditing(true);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={altText}
          className={[
            IMAGE_CLASSNAME,
            isSelected ? "ring-2 ring-amber-300/70" : "",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsEditing((prev) => !prev);
          }}
          className={cn(
            "absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-white",
            "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
            isSelected || isEditing ? "opacity-100 pointer-events-auto" : ""
          )}
        >
          Edit image
        </button>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
      {isEditing ? (
        <div
          className="mt-3 grid gap-2 rounded-lg border bg-white p-3 text-xs shadow-sm"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="grid gap-1">
            <span className="font-semibold text-neutral-700">Alt text</span>
            <Input
              value={draftAlt}
              onChange={(event) => setDraftAlt(event.target.value)}
              placeholder="Alt text"
            />
          </div>
          <div className="grid gap-1">
            <span className="font-semibold text-neutral-700">Caption</span>
            <Input
              value={draftCaption}
              onChange={(event) => setDraftCaption(event.target.value)}
              placeholder="Caption"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={applyChanges}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </figure>
  );
}

function $createImageNode(payload: ImagePayload) {
  return new ImageNode(
    payload.src,
    payload.altText || "",
    payload.caption ?? null
  );
}

const editorTheme = {
  paragraph: "mb-3 text-sm leading-6 text-foreground",
  heading: {
    h2: "mt-6 mb-2 text-xl font-semibold",
    h3: "mt-5 mb-2 text-lg font-semibold",
  },
  quote: "my-4 border-l-4 pl-4 italic text-muted-foreground",
  list: {
    ul: "my-3 ml-6 list-disc",
    ol: "my-3 ml-6 list-decimal",
    listitem: "my-1",
    nested: {
      listitem: "ml-4",
    },
  },
  code: "rounded bg-muted px-1 py-0.5 font-mono text-xs",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "rounded bg-muted px-1 py-0.5 font-mono text-xs",
  },
};

const URL_MATCHER = createLinkMatcherWithRegExp(
  /https?:\/\/[^\s]+/i,
  (text) => text
);
const EMAIL_MATCHER = createLinkMatcherWithRegExp(
  /[\w.+-]+@[\w-]+\.[\w.-]+/i,
  (text) => `mailto:${text}`
);

function ToolbarButton({
  onClick,
  label,
  icon,
  text,
  className,
}: {
  onClick: () => void;
  label: string;
  icon?: ReactNode;
  text?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn("h-8 gap-2 px-2 text-xs", className)}
      title={label}
      aria-label={label}
    >
      {icon ? <span className="h-4 w-4">{icon}</span> : null}
      {icon ? null : text || label}
    </Button>
  );
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white/80 px-2 py-1 shadow-sm">
      {children}
    </div>
  );
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");

  const applyHeading = (tag: "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  const applyParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const applyQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const applyCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createCodeNode());
      }
    });
  };

  const insertLink = () => {
    const url = window.prompt("Enter a URL");
    if (!url) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };

  const insertImage = () => {
    setShowImagePanel((prev) => !prev);
  };

  const confirmInsertImage = () => {
    if (!imageUrl.trim()) return;
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      src: imageUrl.trim(),
      altText: imageAlt.trim(),
      caption: imageCaption.trim() || null,
    });
    setImageUrl("");
    setImageAlt("");
    setImageCaption("");
    setShowImagePanel(false);
  };

  return (
    <div className="sticky top-0 z-10 border-b bg-white/90 px-3 py-2 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <ToolbarGroup>
          <ToolbarButton
            label="Undo"
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            icon={<Undo2 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Redo"
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            icon={<Redo2 className="h-4 w-4" />}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            label="Bold"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
            icon={<Bold className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Italic"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
            }
            icon={<Italic className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Underline"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
            }
            icon={<Underline className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Strike"
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
            }
            icon={<Strikethrough className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Inline code"
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
            icon={<Code className="h-4 w-4" />}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            label="Paragraph"
            onClick={applyParagraph}
            text="P"
            className="px-3"
          />
          <ToolbarButton
            label="Heading 2"
            onClick={() => applyHeading("h2")}
            icon={<Heading2 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Heading 3"
            onClick={() => applyHeading("h3")}
            icon={<Heading3 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Quote"
            onClick={applyQuote}
            icon={<Quote className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Code block"
            onClick={applyCodeBlock}
            icon={<Code className="h-4 w-4" />}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            label="Bullet"
            onClick={() =>
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
            }
            icon={<List className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Number"
            onClick={() =>
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
            }
            icon={<ListOrdered className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Clear List"
            onClick={() =>
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
            }
            text="Clear"
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            label="Align left"
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")
            }
            icon={<AlignLeft className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Align center"
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
            }
            icon={<AlignCenter className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Align right"
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
            }
            icon={<AlignRight className="h-4 w-4" />}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton
            label="Link"
            onClick={insertLink}
            icon={<Link2 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Image"
            onClick={insertImage}
            icon={<Image className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Table"
            onClick={() =>
              editor.dispatchCommand(INSERT_TABLE_COMMAND, {
                columns: "3",
                rows: "3",
              })
            }
            icon={<Table2 className="h-4 w-4" />}
          />
        </ToolbarGroup>
      </div>
      {showImagePanel ? (
        <div className="mt-3 grid gap-2 rounded-lg border bg-white p-3 shadow-sm">
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="Image URL"
            />
            <Input
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
              placeholder="Alt text (optional)"
            />
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={imageCaption}
              onChange={(event) => setImageCaption(event.target.value)}
              placeholder="Caption (optional)"
            />
            <div className="flex items-center gap-2">
              <Button type="button" onClick={confirmInsertImage}>
                Insert
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowImagePanel(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createImageNode(payload);
        $insertNodeToNearestRoot(imageNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

function EditorSurface({ placeholder }: { placeholder?: string }) {
  const [editor] = useLexicalComposerContext();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (!list.length) return;
      setIsUploading(true);
      if (list.length > 1) {
        try {
          const results = await uploadBlogImages(list);
          if (!results.length) throw new Error("Empty upload result");
          results.forEach((item, index) => {
            const url = item.secure_url || item.url;
            if (!url) return;
            const fallback = list[index]?.name || "image";
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
              src: url,
              altText: fallback,
              caption: null,
            });
          });
          setIsUploading(false);
          return;
        } catch (error) {
          toast.error("Multi upload failed. Uploading one by one.");
        }
      }
      for (const file of list) {
        try {
          const result = await uploadBlogImage(file);
          const url = result.secure_url || result.url;
          if (!url) {
            throw new Error("Upload failed");
          }
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            src: url,
            altText: file.name,
            caption: null,
          });
        } catch (error) {
          toast.error("Upload image failed.");
        }
      }
      setIsUploading(false);
    },
    [editor]
  );

  const handleDragOver = (event: DragEvent) => {
    if (event.dataTransfer?.types?.includes("Files")) {
      event.preventDefault();
    }
  };

  const handleDragEnter = (event: DragEvent) => {
    if (event.dataTransfer?.types?.includes("Files")) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (event: DragEvent) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent) => {
    if (!event.dataTransfer?.files?.length) return;
    event.preventDefault();
    setIsDragActive(false);
    void handleFiles(event.dataTransfer.files);
  };

  const handlePaste = (event: ClipboardEvent) => {
    if (!event.clipboardData?.files?.length) return;
    event.preventDefault();
    void handleFiles(event.clipboardData.files);
  };

  return (
    <div className="relative">
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="min-h-[320px] px-5 py-4 text-sm leading-7 text-slate-800 outline-none"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
          />
        }
        placeholder={
          <div className="pointer-events-none absolute left-5 top-4 text-sm text-muted-foreground">
            {placeholder || "Write something..."}
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      {isDragActive ? (
        <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-white/80 text-sm text-slate-600">
          Drop images to upload
        </div>
      ) : null}
      {isUploading ? (
        <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-xl border border-slate-200 bg-white/90 text-sm text-slate-600">
          Uploading images...
        </div>
      ) : null}
    </div>
  );
}

type LexicalEditorProps = {
  value: LexicalDoc | null;
  onChange: (doc: LexicalDoc) => void;
  placeholder?: string;
  className?: string;
  editorKey?: string;
};

export default function LexicalEditor({
  value,
  onChange,
  placeholder,
  className,
  editorKey,
}: LexicalEditorProps) {
  const namespace = editorKey ? `blog-editor-${editorKey}` : "blog-editor";
  const initialConfig = {
    namespace,
    theme: editorTheme,
    onError(error: Error) {
      // eslint-disable-next-line no-console
      console.error(error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      ImageNode,
    ],
    editorState: resolveEditorState(value),
  };

  const handleChange = useCallback(
    (editorState: EditorState) => {
      onChange(editorState.toJSON() as LexicalDoc);
    },
    [onChange]
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-transparent transition focus-within:ring-2 focus-within:ring-slate-200",
        className
      )}
    >
      <LexicalComposer initialConfig={initialConfig} key={editorKey}>
        <ToolbarPlugin />
        <EditorSurface placeholder={placeholder} />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <AutoLinkPlugin matchers={[URL_MATCHER, EMAIL_MATCHER]} />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <TablePlugin />
        <OnChangePlugin onChange={handleChange} />
        <ImagePlugin />
      </LexicalComposer>
    </div>
  );
}
