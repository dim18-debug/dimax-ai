"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { memo } from "react";

function MarkdownBase({ children }) {
  return (
    <div className="prose-ai">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {children || ""}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownBase);
