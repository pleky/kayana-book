import Link from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold,
    Heading2,
    Heading3,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Quote,
    Redo,
    Undo,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Editor = ReturnType<typeof useEditor>;

function ToolbarButton({
    onClick,
    active,
    disabled,
    label,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            className={cn(
                'rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40',
                active && 'bg-accent text-foreground',
            )}
        >
            {children}
        </button>
    );
}

function Toolbar({ editor }: { editor: Editor }) {
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    if (!editor) {
        return null;
    }

    const applyLink = () => {
        const url = linkUrl.trim();
        if (url === '') {
            editor.chain().focus().unsetLink().run();
        } else {
            editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: url })
                .run();
        }
        setLinkOpen(false);
        setLinkUrl('');
    };

    return (
        <div className="flex flex-col gap-2 border-b border-input p-1.5">
            <div className="flex flex-wrap items-center gap-0.5">
                <ToolbarButton
                    label="Tebal"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Miring"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Judul 2"
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                >
                    <Heading2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Judul 3"
                    active={editor.isActive('heading', { level: 3 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                >
                    <Heading3 className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Daftar"
                    active={editor.isActive('bulletList')}
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                >
                    <List className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Daftar bernomor"
                    active={editor.isActive('orderedList')}
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                >
                    <ListOrdered className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Kutipan"
                    active={editor.isActive('blockquote')}
                    onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                    }
                >
                    <Quote className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Tautan"
                    active={editor.isActive('link')}
                    onClick={() => {
                        setLinkUrl(editor.getAttributes('link').href ?? '');
                        setLinkOpen((open) => !open);
                    }}
                >
                    <LinkIcon className="size-4" />
                </ToolbarButton>
                <span className="mx-1 h-5 w-px bg-border" />
                <ToolbarButton
                    label="Urungkan"
                    disabled={!editor.can().undo()}
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    <Undo className="size-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Ulangi"
                    disabled={!editor.can().redo()}
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    <Redo className="size-4" />
                </ToolbarButton>
            </div>

            {linkOpen && (
                <div className="flex items-center gap-2">
                    <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                applyLink();
                            }
                        }}
                        placeholder="https://… (kosongkan untuk hapus)"
                        className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
                    />
                    <button
                        type="button"
                        onClick={applyLink}
                        className="h-8 rounded-md bg-secondary px-3 text-sm font-medium"
                    >
                        Pasang
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Tiptap WYSIWYG editor that writes its HTML into a hidden textarea so the
 * surrounding Inertia <Form> submits it under `name`. Output HTML is rendered
 * elsewhere through DOMPurify, and Tiptap's schema only emits allowed nodes.
 */
export default function RichTextEditor({
    name = 'description',
    defaultValue = '',
}: {
    name?: string;
    defaultValue?: string;
}) {
    const [html, setHtml] = useState(defaultValue);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false, autolink: true }),
        ],
        content: defaultValue,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'min-h-32 px-3 py-2 text-sm focus:outline-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul,&_ol]:pl-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-medium [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:underline',
            },
        },
        onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    });

    return (
        <div className="mt-1 rounded-md border border-input bg-transparent focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            {editor && (
                <>
                    <Toolbar editor={editor} />
                    <EditorContent editor={editor} />
                </>
            )}
            <textarea name={name} value={html} readOnly hidden />
        </div>
    );
}
