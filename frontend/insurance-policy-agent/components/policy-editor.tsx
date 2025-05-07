"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PolicyDocument } from "@/components/policy-document"
import PolicyChat from "@/components/policy-chat"
import { Save, Eye, MessageSquare, FileText } from "lucide-react"

interface PolicyEditorProps {
  initialPolicy: {
    title: string
    content: string
  }
  isNew?: boolean
}

export function PolicyEditor({ initialPolicy, isNew = false }: PolicyEditorProps) {
  const [policy, setPolicy] = useState(initialPolicy)
  const [activeView, setActiveView] = useState<"edit" | "preview">("edit")
  const [showChat, setShowChat] = useState(true)
  const [changes, setChanges] = useState<{
    additions: string[]
    deletions: string[]
  }>({
    additions: [],
    deletions: [],
  })

  // Simular cambios para la demostración
  useEffect(() => {
    if (!isNew) {
      const timer = setTimeout(() => {
        setChanges({
          additions: ["cobertura por inundaciones", "asistencia legal 24/7"],
          deletions: ["exclusión por negligencia", "límite de $1,000,000"],
        })
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isNew])

  const handleContentChange = (newContent: string) => {
    setPolicy({ ...policy, content: newContent })
  }

  const handleSave = () => {
    // Aquí iría la lógica para guardar la póliza
    alert("Póliza guardada con éxito")
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={`lg:col-span-${showChat ? "2" : "3"} space-y-4`}>
        <div className="flex justify-between items-center bg-white rounded-3xl p-3 border mb-4">
          <Tabs
            defaultValue="edit"
            value={activeView}
            onValueChange={(v) => setActiveView(v as "edit" | "preview")}
            className="w-[400px]"
          >
            <TabsList className="bg-gray-100 rounded-full">
              <TabsTrigger value="edit" className="rounded-full data-[state=active]:bg-white">
                <FileText className="mr-2 h-4 w-4" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="preview" className="rounded-full data-[state=active]:bg-white">
                <Eye className="mr-2 h-4 w-4" />
                Vista previa
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowChat(!showChat)} className="rounded-full">
              <MessageSquare className="mr-2 h-4 w-4" />
              {showChat ? "Ocultar Chat" : "Mostrar Chat"}
            </Button>
            <Button size="sm" className="rounded-full bg-black text-white hover:bg-black/90">
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border overflow-hidden">
          <PolicyDocument
            content={policy.content}
            onChange={handleContentChange}
            readOnly={activeView === "preview"}
            changes={changes}
          />
        </div>
      </div>

      {showChat && (
        <div className="lg:col-span-1">
          <PolicyChat
            policyTitle={policy.title}
            isNew={isNew}
            onApplyChanges={(newContent) => handleContentChange(newContent)}
          />
        </div>
      )}
    </div>
  )
}
