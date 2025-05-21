"use client";
import ProtectedRoute from "@/app/components/ProtectedRoute"
import PolicyChat from "@/components/policy-chat"
import RichTextEditor from "@/components/RichTextEditor"
import { useState, useEffect } from 'react';

// Helper function to clean diff markup from HTML string
const cleanDiffMarkup = (htmlString: string): string => {
  // Keep content of <ins>, remove <ins> tags. Match any character including newlines within the tags.
  let cleanedHtml = htmlString.replace(/<ins[^>]*>([\s\S]*?)<\/ins>/gi, '$1');
  // Remove <del> tags and their content. Match any character including newlines within the tags.
  cleanedHtml = cleanedHtml.replace(/<del[^>]*>([\s\S]*?)<\/del>/gi, '');
  // ALSO Remove <s> tags (strikethrough) and their content, as htmldiff2 might use these.
  cleanedHtml = cleanedHtml.replace(/<s[^>]*>([\s\S]*?)<\/s>/gi, '');
  return cleanedHtml;
};

export default function CreatePolicyPage() {
  // Initial policy content as clean HTML
  const initialPolicyText = `<h2>Nueva Póliza de Seguro</h2>
<h3>Sección 1: Cobertura</h3>
<p>Esta póliza cubre...</p>
<h3>Sección 2: Exclusiones</h3>
<p>Esta póliza no cubre...</p>
<h3>Sección 3: Límites de Cobertura</h3>
<p>El límite máximo de cobertura es...</p>
<h3>Sección 4: Prima y Pagos</h3>
<p>La prima anual es...</p>`;

  // State for the policy text
  const [policyText, setPolicyText] = useState<string>(initialPolicyText);
  // State to hold the original content before an AI edit, for diffing
  const [originalPolicyForDiff, setOriginalPolicyForDiff] = useState<string>(initialPolicyText); // Initialize with initialPolicyText
  // State to control whether the editor should display the diff view
  const [showDiffView, setShowDiffView] = useState<boolean>(false);

  // This function will be called by PolicyChat when an AI edit is made
  const handlePolicyUpdateFromAI = (newHtmlContentWithDiff: string) => {
    console.log("AI Update: Current policyText (this will be original for diff):", policyText);
    console.log("AI Update: Received newHtmlContentWithDiff from AI:", newHtmlContentWithDiff);
    setOriginalPolicyForDiff(policyText); // Save current clean text as original for diff
    setPolicyText(newHtmlContentWithDiff);      // Set the new AI-generated content (which includes diff markup)
    setShowDiffView(true);              // Enable diff view
  };

  // This function will be called by RichTextEditor when user starts editing in diff view
  const handleNormalEditStart = () => {
    // If currently in diff view and user starts typing, it implies accepting the changes.
    // However, the RichTextEditor is set to editable={!showDiffView}, so direct typing in diff view is prevented.
    // This handler is more for if we had a scenario where editing diff content directly was allowed.
    // For now, exiting diff view is the main action.
    if (showDiffView) {
        // Apply changes before allowing normal edit if coming from diff view
        const cleanedHtml = cleanDiffMarkup(policyText);
        setPolicyText(cleanedHtml);
        setOriginalPolicyForDiff(cleanedHtml); // Update baseline
    }
    setShowDiffView(false); // Exit diff mode
  };

  const handleRejectAIDiff = () => {
    setPolicyText(originalPolicyForDiff); // Revert to the content before AI edit
    setShowDiffView(false); // Exit diff mode
  };

  const handleAcceptAIDiff = () => {
    const cleanedHtml = cleanDiffMarkup(policyText); // policyText here is the one with <ins> and <del>
    console.log("Accepting AI Diff. Original (with diffs):", policyText);
    console.log("Accepting AI Diff. Cleaned HTML:", cleanedHtml);
    setPolicyText(cleanedHtml);
    setOriginalPolicyForDiff(cleanedHtml); // Update the baseline for future diffs to the new clean state
    setShowDiffView(false); // Exit diff view
  };

  return (
    <ProtectedRoute>
    <div className="container py-10 mx-auto max-w-7xl">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Crear Nueva Póliza</h1>
      <p className="text-muted-foreground mb-8">Utilice el asistente AI para crear una nueva póliza personalizada. El asistente puede sugerir cambios que se resaltarán en verde (adiciones) y rojo (eliminaciones).</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
        <div className="lg:col-span-2 space-y-4 h-full">
          <RichTextEditor 
            content={policyText}
            onChange={setPolicyText} 
            editable={!showDiffView} // Editor is not directly editable when showing diffs
            showDiff={showDiffView}
            originalContentForDiff={originalPolicyForDiff}
            onNormalEditStart={handleNormalEditStart}
            onAcceptAll={handleAcceptAIDiff}
            onRejectAll={handleRejectAIDiff}
          />
        </div>

        <div className="lg:col-span-1 h-full">
          <PolicyChat 
            policyTitle="Nueva Póliza" 
            isNew={true} 
            currentPolicyText={policyText} // Pass current HTML policy
            onPolicyTextChange={handlePolicyUpdateFromAI} // Use the new handler for AI updates
          />
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
