'use client'

import * as React from "react"
import { Upload, Coffee, Smile, Heart, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const API_HOSTNAME = process.env.NEXT_PUBLIC_API_HOSTNAME

const moodIcons = {
  casual: Coffee,
  friendly: Smile,
  flirty: Heart,
  random: Sparkles,
}

export default function Component() {
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [mood, setMood] = React.useState("casual")
  const [notes, setNotes] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [response, setResponse] = React.useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert("Please upload a screenshot")
      return
    }
    setIsLoading(true)
    setResponse("")

    const formData = new FormData()
    formData.append('screenshot', file)
    formData.append('mood', mood)
    formData.append('notes', notes)

    try {
      const response = await fetch(`${API_HOSTNAME}/api/vision`, {
        method: 'POST',
        body: formData,
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (data.content) {
              setResponse(prev => prev + data.content)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setResponse("An error occurred while processing your request.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Know what to say next</h2>
            
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
              {/* Upload Section */}
              <div className="border-2 border-dashed rounded-lg p-6 flex items-center justify-center">
                <Label htmlFor="file" className="cursor-pointer w-full h-full">
                  {previewUrl ? (
                    <div className="relative w-full h-[200px]">
                      <img 
                        src={previewUrl} 
                        alt="Selected screenshot" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 h-[200px] justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Upload screenshot</span>
                    </div>
                  )}
                  <Input 
                    id="file" 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </Label>
              </div>

              {/* Form Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mood">Mood</Label>
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(moodIcons).map(([key, Icon]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional notes</Label>
                  <Textarea 
                    id="notes" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything we should know?" 
                    className="min-h-[120px] resize-none"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Ask"}
                </Button>
              </div>
            </form>

            {(isLoading || response) && (
              <div className="bg-muted rounded-lg p-4">
                {isLoading && !response && (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                )}
                
                {(isLoading || response) && (
                  <div className="bg-background rounded-lg p-4 shadow-sm">
                    <p className="text-pretty">{response || "Generating response..."}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}