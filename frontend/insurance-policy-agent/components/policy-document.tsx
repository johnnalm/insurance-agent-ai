"use client"

import { useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"

interface PolicyDocumentProps {
  content: string
  onChange?: (content: string) => void
  readOnly?: boolean
  changes?: {
    additions: string[]
    deletions: string[]
  }
}

export function PolicyDocument({
  content,
  onChange,
  readOnly = false,
  changes = { additions: [], deletions: [] },
}: PolicyDocumentProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Ajustar altura del textarea automáticamente
  useEffect(() => {
    if (textareaRef.current && !readOnly) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content, readOnly])

  // Función para resaltar cambios en el contenido
  const highlightChanges = (text: string) => {
    let highlightedText = text

    // Resaltar adiciones
    changes.additions.forEach((addition) => {
      highlightedText = highlightedText.replace(new RegExp(addition, "gi"), `<span class="addition">${addition}</span>`)
    })

    // Resaltar eliminaciones
    changes.deletions.forEach((deletion) => {
      highlightedText = highlightedText.replace(new RegExp(deletion, "gi"), `<span class="deletion">${deletion}</span>`)
    })

    return highlightedText
  }

  if (readOnly) {
    // Aplicar resaltado de cambios al contenido
    const contentWithHighlights = highlightChanges(content)

    return (
      <div
        className="policy-document p-8 min-h-[600px] max-h-[800px] overflow-y-auto bg-white"
        dangerouslySetInnerHTML={{ __html: contentWithHighlights }}
      />
    )
  }

  return (
    <Textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => onChange?.(e.target.value)}
      className="min-h-[600px] max-h-[800px] p-8 font-sans leading-relaxed resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      placeholder="Comience a escribir su póliza aquí..."
    />
  )
}
