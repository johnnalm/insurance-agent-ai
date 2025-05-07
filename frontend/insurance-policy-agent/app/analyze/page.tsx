"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Search, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"
import PolicyChat from "@/components/policy-chat"

export default function AnalyzePage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [file, setFile] = useState<File | null>(null)
  const [policyText, setPolicyText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<null | {
    score: number
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setAnalysisComplete(false)
      setAnalysisResults(null)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPolicyText(e.target.value)
    setAnalysisComplete(false)
    setAnalysisResults(null)
  }

  const handleAnalyze = () => {
    setIsAnalyzing(true)

    // Simulación de análisis
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
      setAnalysisResults({
        score: 78,
        strengths: [
          "Cobertura completa para daños a terceros",
          "Términos de pago flexibles",
          "Proceso de reclamación bien definido",
        ],
        weaknesses: [
          "Exclusiones ambiguas en caso de desastres naturales",
          "Límite de cobertura relativamente bajo",
          "Falta de cobertura para ciertos escenarios específicos",
        ],
        recommendations: [
          "Aumentar el límite de cobertura a $2,000,000",
          "Clarificar las exclusiones relacionadas con desastres naturales",
          "Añadir cobertura para interrupción de negocio",
          "Incluir asistencia legal 24/7",
        ],
      })
    }, 3000)
  }

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Analizar Póliza</h1>
        <p className="text-muted-foreground mb-8">
          Sube o pega el texto de tu póliza para recibir un análisis detallado y recomendaciones de mejora.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-gray-100 rounded-full w-full">
                <TabsTrigger value="upload" className="rounded-full data-[state=active]:bg-white flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Subir archivo
                </TabsTrigger>
                <TabsTrigger value="paste" className="rounded-full data-[state=active]:bg-white flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Pegar texto
                </TabsTrigger>
                <TabsTrigger value="examples" className="rounded-full data-[state=active]:bg-white flex-1">
                  <Search className="mr-2 h-4 w-4" />
                  Ejemplos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-6">
                <div className="bg-white rounded-3xl border p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Sube tu póliza</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Arrastra y suelta tu archivo PDF o Word, o haz clic para seleccionarlo desde tu dispositivo.
                    </p>
                    <div className="w-full max-w-md">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-3xl cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                          </p>
                          <p className="text-xs text-gray-500">PDF, DOCX, TXT (MAX. 10MB)</p>
                        </div>
                        <Input
                          id="dropzone-file"
                          type="file"
                          className="hidden"
                          accept=".pdf,.docx,.txt"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    {file && (
                      <div className="mt-4 text-sm">
                        <span className="font-medium">Archivo seleccionado:</span> {file.name}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="paste" className="mt-6">
                <div className="bg-white rounded-3xl border p-8">
                  <h3 className="text-xl font-bold mb-4">Pega el texto de tu póliza</h3>
                  <textarea
                    className="w-full h-64 p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Pega aquí el texto completo de tu póliza de seguro..."
                    value={policyText}
                    onChange={handleTextChange}
                  ></textarea>
                </div>
              </TabsContent>

              <TabsContent value="examples" className="mt-6">
                <div className="bg-white rounded-3xl border p-8">
                  <h3 className="text-xl font-bold mb-4">Selecciona un ejemplo</h3>
                  <p className="text-muted-foreground mb-6">
                    Elige una de nuestras pólizas de ejemplo para ver cómo funciona el análisis.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: "Seguro de Responsabilidad Civil", type: "Empresarial" },
                      { title: "Seguro de Propiedad Comercial", type: "Empresarial" },
                      { title: "Seguro de Interrupción de Negocio", type: "Empresarial" },
                      { title: "Seguro de Vida", type: "Personal" },
                    ].map((example, index) => (
                      <div
                        key={index}
                        className="border rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setPolicyText(`# ${example.title}\n\nEjemplo de póliza de ${example.type.toLowerCase()}...`)
                          setActiveTab("paste")
                        }}
                      >
                        <h4 className="font-medium">{example.title}</h4>
                        <p className="text-sm text-muted-foreground">{example.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center"
          >
            <Button
              onClick={handleAnalyze}
              disabled={(!file && !policyText) || isAnalyzing}
              className="rounded-full bg-black text-white hover:bg-black/90 px-8"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Analizando...
                </>
              ) : (
                <>
                  Analizar Póliza
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>

          {analysisComplete && analysisResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl border p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Resultados del Análisis</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold">
                    {analysisResults.score}
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">Puntuación</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-bold mb-3 flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Fortalezas
                  </h4>
                  <ul className="space-y-2">
                    {analysisResults.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-3 flex items-center text-red-600">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Debilidades
                  </h4>
                  <ul className="space-y-2">
                    {analysisResults.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3">Recomendaciones</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <ul className="space-y-2">
                    {analysisResults.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">
                          {index + 1}
                        </span>
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <PolicyChat
              policyTitle="Análisis de Póliza"
              isNew={false}
              initialMessage="¡Hola! Soy tu asistente de análisis de pólizas. Puedo ayudarte a entender los resultados del análisis y responder cualquier pregunta que tengas sobre tu póliza. ¿En qué puedo ayudarte hoy?"
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
