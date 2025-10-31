'use client'

import '@/components/tiptap-node/blockquote-node/blockquote-node.scss'
import '@/components/tiptap-node/code-block-node/code-block-node.scss'
import '@/components/tiptap-node/heading-node/heading-node.scss'
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss'
import '@/components/tiptap-node/image-upload-node/image-upload-node.scss'
import '@/components/tiptap-node/list-node/list-node.scss'
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss'

import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'

interface SanitizedHtmlProps {
  html: string
  className?: string
  as?: keyof React.JSX.IntrinsicElements
}

export default function SanitizedHtml({ html, className, as: Component = 'div' }: SanitizedHtmlProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState('')

  useEffect(() => {
    // Only run on client side to avoid SSR issues
    if (typeof window !== 'undefined') {
      const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p',
          'br',
          'strong',
          'em',
          'u',
          's',
          'code',
          'pre',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'ul',
          'ol',
          'li',
          'blockquote',
          'a',
          'img'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class'],
        // Ensure links open in new tab for security
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onclick', 'onerror', 'onload']
      })
      setSanitizedHtml(clean)
    }
  }, [html])

  // Don't render anything on server side to avoid hydration mismatch
  if (typeof window === 'undefined') {
    return null
  }

  const ElementType = Component as keyof React.JSX.IntrinsicElements

  return (
    <ElementType
      className={`tiptap ProseMirror prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl overflow-auto ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
