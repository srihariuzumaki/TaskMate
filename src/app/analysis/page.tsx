'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Loader2 } from 'lucide-react'
import { FileText } from 'lucide-react'

export default function AnalysisPage() {
  const searchParams = useSearchParams()
  const fileId = searchParams.get('fileId')
  const [question, setQuestion] = useState('')
  const [resource, setResource] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState('')

  useEffect(() => {
    if (!fileId) return
    // TODO: Fetch resource details using fileId
    setResource({
      id: fileId,
      name: "Document Name",
      summary: "AI-generated summary will appear here...",
      dateUploaded: new Date().toLocaleDateString()
    })
  }, [fileId])

  const handleAskQuestion = async () => {
    if (!question) return
    setIsLoading(true)
    // TODO: Implement actual AI Q&A
    setAiResponse("This is a mock AI response. Implement actual AI integration here.")
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left side - Document Preview */}
        <Card className="h-[calc(100vh-8rem)] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-[#1A5F7A] flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {resource?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full overflow-y-auto">
            <div className="bg-gray-100 h-full rounded-lg p-4">
              {/* TODO: Implement actual document preview */}
              <p className="text-gray-500 text-center">Document preview will appear here</p>
            </div>
          </CardContent>
        </Card>

        {/* Right side - Q&A */}
        <Card className="h-[calc(100vh-8rem)] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-[#1A5F7A]">AI Analysis & Q&A</CardTitle>
          </CardHeader>
          <CardContent className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto mb-4">
              {/* Summary Section */}
              <div className="p-4 bg-[#E6F3F5] rounded-lg mb-4">
                <h3 className="font-medium text-[#1A5F7A] mb-2">Document Summary</h3>
                <p className="text-[#57A7B3]">{resource?.summary}</p>
              </div>

              {/* AI Response Section */}
              {aiResponse && (
                <div className="p-4 bg-white border rounded-lg">
                  <h3 className="font-medium text-[#1A5F7A] mb-2">AI Response</h3>
                  <p className="text-[#57A7B3]">{aiResponse}</p>
                </div>
              )}
            </div>

            {/* Question Input Section */}
            <div className="flex gap-2 mt-auto">
              <Textarea
                placeholder="Ask anything about this document..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 resize-none"
                rows={3}
              />
              <Button
                className="bg-[#57A7B3] hover:bg-[#1A5F7A] self-end"
                onClick={handleAskQuestion}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 