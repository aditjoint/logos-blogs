import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent, Content, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Code,
  Undo,
  Redo,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

interface TipTapEditorProps {
  content?: Content;
  onChange: (content: { html: string; text: string }) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
  className,
}: TipTapEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary-600 underline",
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange({
        html: editor.getHTML(),
        text: editor.getText(),
      });
    },
  });

  useEffect(() => {
    // Update content if it changes externally
    if (editor && content) {
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  const handleAddLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }
    
    setLinkUrl("");
    setLinkDialogOpen(false);
  }, [editor, linkUrl]);

  const handleAddImage = useCallback(() => {
    if (!editor) return;
    
    if (imageUrl) {
      editor
        .chain()
        .focus()
        .setImage({ src: imageUrl })
        .run();
    }
    
    setImageUrl("");
    setImageDialogOpen(false);
  }, [editor, imageUrl]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {editable && (
        <div className="editor-toolbar border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap items-center gap-1 bg-gray-50 dark:bg-gray-900">
          <EditorButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            tooltip="Bold"
            icon={<Bold className="h-4 w-4" />}
          />
          <EditorButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            tooltip="Italic"
            icon={<Italic className="h-4 w-4" />}
          />
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
          <EditorButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            tooltip="Heading 1"
            icon={<Heading1 className="h-4 w-4" />}
          />
          <EditorButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            tooltip="Heading 2"
            icon={<Heading2 className="h-4 w-4" />}
          />
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
          <EditorButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            tooltip="Bullet List"
            icon={<List className="h-4 w-4" />}
          />
          <EditorButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            tooltip="Ordered List"
            icon={<ListOrdered className="h-4 w-4" />}
          />
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
          <EditorButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            tooltip="Quote"
            icon={<Quote className="h-4 w-4" />}
          />
          <EditorButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            tooltip="Code Block"
            icon={<Code className="h-4 w-4" />}
          />
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
          
          {/* Link Dialog */}
          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800",
                  editor.isActive("link") ? "bg-gray-200 dark:bg-gray-700" : ""
                )}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Link</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddLink}>Add Link</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Image Dialog */}
          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Image</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddImage}>Add Image</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="flex-grow" />
          <EditorButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="Undo"
            icon={<Undo className="h-4 w-4" />}
          />
          <EditorButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="Redo"
            icon={<Redo className="h-4 w-4" />}
          />
        </div>
      )}
      
      <EditorContent 
        editor={editor} 
        className={cn(
          "p-4 min-h-[200px] prose dark:prose-invert max-w-none",
          editable ? "editor-content prose-lg focus:outline-none" : ""
        )}
      />
      
      {editable && (
        <div className="editor-footer border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span>{editor.storage.characterCount.words()} words</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface EditorButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip?: string;
  icon: React.ReactNode;
}

function EditorButton({ onClick, isActive, disabled, tooltip, icon }: EditorButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800",
        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
      )}
      title={tooltip}
    >
      {icon}
    </Button>
  );
}
