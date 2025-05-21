"use client";

import { useEditor, EditorContent, Mark, mergeAttributes } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { RichTextEditorToolbar } from "./RichTextEditorToolbar";
import { useEffect, useState } from "react";

// Custom Mark for <ins>
const Insertion = Mark.create({
  name: 'insertion',
  
  parseHTML() {
    return [{ tag: 'ins' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['ins', mergeAttributes(HTMLAttributes), 0];
  },
});

// Custom Mark for <del>
const Deletion = Mark.create({
  name: 'deletion',
  
  parseHTML() {
    return [{ tag: 'del' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['del', mergeAttributes(HTMLAttributes), 0];
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  editable?: boolean;
  showDiff?: boolean;
  originalContentForDiff?: string;
  onNormalEditStart?: () => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
}

export default function RichTextEditor(props: RichTextEditorProps) {
  const {
    content,
    onChange,
    editable = true,
    showDiff = false,
    originalContentForDiff = "",
    onNormalEditStart,
    onAcceptAll,
    onRejectAll,
  } = props;

  const [internalContent, setInternalContent] = useState(content);

  // DEBUGGING LOGS (Initial props check)
  console.log("--- RichTextEditor RENDER ---");
  console.log("Full props object received:", props);
  console.log("Prop editable (from destructured):", editable);
  console.log("Prop showDiff (from destructured):", showDiff);
  console.log("Prop originalContentForDiff (snippet):", originalContentForDiff?.substring(0, 50));
  console.log("Prop content (snippet):", content?.substring(0, 50));
  console.log("Prop onAcceptAll is function:", typeof onAcceptAll === 'function');
  console.log("Prop onRejectAll is function:", typeof onRejectAll === 'function');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        paragraph: {},
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Insertion,
      Deletion,
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor: currentEditor }) => {
      if (currentEditor.isEditable) {
        if (onNormalEditStart) {
          onNormalEditStart();
        }
      }

      const html = currentEditor.getHTML();
      setInternalContent(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none w-full h-full p-8 font-sans leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (editor) {
      const currentEditorHTML = editor.getHTML();
      if (content !== currentEditorHTML) {
        editor.commands.setContent(content, false);
      }
      if (content !== internalContent) {
        setInternalContent(content);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  const shouldShowDiffViewer = showDiff && originalContentForDiff && originalContentForDiff !== content;

  // DEBUGGING LOGS (State and derived values check)
  // console.log("Condition: originalContentForDiff && originalContentForDiff !== content:", !!(originalContentForDiff && originalContentForDiff !== content));
  // console.log("Calculated shouldShowDiffViewer:", shouldShowDiffViewer);
  // console.log("Buttons should render:", shouldShowDiffViewer && (!!onAcceptAll || !!onRejectAll));
  // console.log("--- End RichTextEditor RENDER ---");

  if (shouldShowDiffViewer) {
    console.log("RichTextEditor DEBUG: Displaying diff.");
    console.log("Original Content (snippet):", originalContentForDiff?.substring(0, 200));
    console.log("New Content with supposed diffs (HTML to inspect for <ins>/<del>):", content);
  }

  return (
    <div className="bg-white rounded-3xl border overflow-hidden flex flex-col h-full">
      {editor && editor.isEditable && !shouldShowDiffViewer && (
        <RichTextEditorToolbar editor={editor} />
      )}
      {shouldShowDiffViewer && (onAcceptAll || onRejectAll) && (
        <div className="p-2 border-b flex justify-end space-x-2 bg-slate-50">
          {onAcceptAll && <button 
            onClick={onAcceptAll} 
            className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Aceptar Sugerencia IA
          </button>}
          {onRejectAll && <button 
            onClick={onRejectAll} 
            className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Descartar Sugerencia IA
          </button>}
        </div>
      )}
      <div className="flex-grow overflow-y-auto custom-scrollbar editor-scroll-container">
        <EditorContent editor={editor} className="h-full w-full" />
      </div>
      <style jsx global>{`
        .prose ins, .tiptap ins {
          background-color: #ccffcc; /* light green */
          text-decoration: none;
        }
        /* Style for deletions, covering <del> and <s> */
        .prose del, .tiptap del, .ProseMirror del,
        .prose s, .tiptap s, .ProseMirror s {
          background-color: #ffcccc !important; /* light red */
          text-decoration: none !important; /* Remove strikethrough for unified visual */
          color: inherit !important; /* Ensure text color is not overridden */
        }
      `}</style>
    </div>
  );
} 