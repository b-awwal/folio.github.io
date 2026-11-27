import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownProseProps {
  content: string;
  className?: string;
}

export const MarkdownProse: React.FC<MarkdownProseProps> = ({
  content,
  className = '',
}) => {
  return (
    <div className={`prose-textbook ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
