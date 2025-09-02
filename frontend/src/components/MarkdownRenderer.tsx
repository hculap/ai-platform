import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: 'default' | 'summary' | 'timeline' | 'audience' | 'funnel' | 'risks';
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '', 
  variant = 'default' 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'summary':
        return 'bg-blue-50 border border-blue-200';
      case 'timeline':
        return 'bg-green-50 border border-green-200';
      case 'audience':
        return 'bg-purple-50 border border-purple-200';
      case 'funnel':
        return 'bg-indigo-50 border border-indigo-200';
      case 'risks':
        return 'bg-yellow-50 border border-yellow-200';
      default:
        return 'bg-gray-50 border border-gray-200';
    }
  };

  const customComponents = {
    // Style headings
    h1: ({ children, ...props }: any) => (
      <h1 className="text-lg font-bold text-gray-900 mb-3 mt-4 first:mt-0" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-base font-semibold text-gray-800 mb-2 mt-3 first:mt-0" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-sm font-medium text-gray-700 mb-2 mt-2 first:mt-0" {...props}>{children}</h3>
    ),
    
    // Style paragraphs
    p: ({ children, ...props }: any) => (
      <p className="text-sm text-gray-600 mb-2 leading-relaxed" {...props}>{children}</p>
    ),
    
    // Style lists
    ul: ({ children, ...props }: any) => (
      <ul className="text-sm text-gray-600 mb-3 pl-0 space-y-2" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="text-sm text-gray-600 mb-3 pl-0 space-y-2 counter-reset-[step]" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }: any) => {
      // Check if parent is ordered list
      const isOrdered = props.ordered;
      return (
        <li className="relative flex items-start pl-6" {...props}>
          <span className={`absolute left-0 top-0 flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs font-semibold rounded-full ${
            isOrdered 
              ? 'bg-indigo-100 text-indigo-700 counter-increment-[step] before:content-[counter(step)]' 
              : 'bg-indigo-500 text-white'
          }`}>
            {!isOrdered && '✓'}
          </span>
          <span className="flex-1">{children}</span>
        </li>
      );
    },
    
    // Style emphasis
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold text-gray-800" {...props}>{children}</strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic text-gray-700" {...props}>{children}</em>
    ),
    
    // Style code
    code: ({ children, ...props }: any) => (
      <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
    ),
    
    // Style blockquotes
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-indigo-400 pl-4 py-3 bg-indigo-50/50 text-gray-700 italic mb-4 rounded-r-md" {...props}>
        <div className="flex items-start">
          <span className="text-indigo-400 text-lg mr-2 mt-0.5">"</span>
          <div className="flex-1">{children}</div>
          <span className="text-indigo-400 text-lg ml-2 mt-0.5">"</span>
        </div>
      </blockquote>
    ),
    
    // Style horizontal rules
    hr: (props: any) => <hr className="border-gray-300 my-4" {...props} />,
    
    // Style links (if any)
    a: ({ href, children, ...props }: any) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-indigo-600 hover:text-indigo-800 underline font-medium"
        {...props}
      >
        {children}
      </a>
    )
  };

  return (
    <div className={`p-3 rounded-md ${getVariantStyles()} ${className}`}>
      <ReactMarkdown components={customComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;