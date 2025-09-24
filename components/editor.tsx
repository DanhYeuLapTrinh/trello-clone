'use client'

import '@/components/tiptap-node/blockquote-node/blockquote-node.scss'
import '@/components/tiptap-node/code-block-node/code-block-node.scss'
import '@/components/tiptap-node/heading-node/heading-node.scss'
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss'
import '@/components/tiptap-node/image-upload-node/image-upload-node.scss'
import '@/components/tiptap-node/list-node/list-node.scss'
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss'

import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button'
import { MAX_FILE_SIZE } from '@/lib/tiptap-utils'
import { Image } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import { EditorContent, EditorContext, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { ImageUploadNode } from './tiptap-node/image-upload-node'
import { CodeBlockButton } from './tiptap-ui/code-block-button'
import { HeadingDropdownMenu } from './tiptap-ui/heading-dropdown-menu'
import { ImageUploadButton } from './tiptap-ui/image-upload-button'
import { LinkPopover } from './tiptap-ui/link-popover'
import { ListDropdownMenu } from './tiptap-ui/list-dropdown-menu'
import { MarkButton } from './tiptap-ui/mark-button'
import { Button } from './ui/button'

interface EditorProps {
  isDisplay: boolean
  content: string
  isSaving: boolean
  onChange: (html: string) => void
  onSave: () => void
  onCancel: () => void
}

export default function Editor({ content, isSaving, isDisplay, onChange, onSave, onCancel }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      ImageUploadNode.configure({
        accept: 'image/*',
        maxSize: MAX_FILE_SIZE,
        limit: 1,
        upload: () => Promise.resolve(''),
        onError: (error) => console.error('Upload failed:', error)
      }),
      Placeholder.configure({
        placeholder: ({ editor }) => {
          if (editor.isEmpty) {
            return "Mẹo chuyên nghiệp: Nhấn 'Enter' để xuống dòng và 'Shift + Enter' để ngắt dòng đơn giản."
          }
          return ''
        },
        emptyEditorClass: 'is-editor-empty'
      })
    ],
    editorProps: {
      attributes: {
        // FIXME: overflow if content is too long
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-4 min-h-48'
      }
    },
    content,
    onUpdate: ({ editor }) => {
      if (editor.isEmpty || editor.getHTML() === '<p></p>') {
        onChange('')
      } else {
        onChange(editor.getHTML())
      }
    },
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false
  })

  useEffect(() => {
    if (isDisplay && editor) {
      setTimeout(() => {
        editor.commands.focus('end')
      }, 0)
    }
  }, [isDisplay, editor])

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (isDisplay && editor) {
    return (
      <div className='space-y-2'>
        <EditorContext.Provider value={{ editor }}>
          <div className='rounded-md ring ring-foreground/60 focus-within:ring-2 focus-within:ring-primary'>
            <div className='p-2 flex gap-2 border-b items-center'>
              {/* Headings */}
              <HeadingDropdownMenu
                editor={editor}
                levels={[1, 2, 3, 4, 5, 6]}
                title='Heading'
                hideWhenUnavailable={true}
                portal={false}
                onOpenChange={(isOpen) => console.log('Dropdown', isOpen ? 'opened' : 'closed')}
              />

              <div className='w-px h-6 bg-border' />

              {/* Marks */}
              <div className='flex gap-0.5'>
                <MarkButton type='bold' />
                <MarkButton type='italic' />
                <MarkButton type='strike' />
                <MarkButton type='code' />
              </div>

              <div className='w-px h-6 bg-border' />

              {/* Lists */}
              <ListDropdownMenu
                editor={editor}
                types={['bulletList', 'orderedList']}
                hideWhenUnavailable={true}
                portal={false}
                onOpenChange={(isOpen) => console.log('Dropdown opened:', isOpen)}
              />

              <div className='w-px h-6 bg-border' />

              <div className='flex gap-0.5'>
                {/* Links */}
                <LinkPopover
                  editor={editor}
                  hideWhenUnavailable={true}
                  autoOpenOnLinkActive={true}
                  onSetLink={() => console.log('Link set!')}
                  onOpenChange={(isOpen) => console.log('Popover opened:', isOpen)}
                />

                {/* Images */}
                <ImageUploadButton
                  editor={editor}
                  hideWhenUnavailable={true}
                  onInserted={() => console.log('Image inserted!')}
                />
              </div>

              <div className='w-px h-6 bg-border' />

              <div className='flex gap-0.5'>
                {/* Blockquotes */}
                <BlockquoteButton editor={editor} />

                {/* Code blocks */}
                <CodeBlockButton
                  editor={editor}
                  hideWhenUnavailable={true}
                  onToggled={() => console.log('Code block toggled!')}
                />
              </div>
            </div>
            <EditorContent editor={editor} role='presentation' />
          </div>
        </EditorContext.Provider>

        <div className='flex items-center gap-2'>
          <Button onClick={onSave} disabled={isSaving}>
            Lưu
          </Button>
          <Button variant='ghost' onClick={onCancel} disabled={isSaving}>
            Hủy
          </Button>
        </div>
      </div>
    )
  }
}
