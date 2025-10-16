"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getCapsule,
  saveCapsule,
  createNewCapsule,
  type Capsule,
  type Note,
  type Flashcard,
  type QuizQuestion,
  type Attachment,
} from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FileText,
  Brain,
  ClipboardList,
  X,
  Upload,
  Download,
  Paperclip,
} from "lucide-react"

interface AuthorProps {
  capsuleId: string | null
  onBack: () => void
}

export function Author({ capsuleId, onBack }: AuthorProps) {
  const [capsule, setCapsule] = useState<Capsule>(createNewCapsule())
  const [activeTab, setActiveTab] = useState("metadata")
  const [tagInput, setTagInput] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (capsuleId) {
      const existing = getCapsule(capsuleId)
      if (existing) {
        setCapsule(existing)
      }
    }
  }, [capsuleId])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleSave(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [capsule])

  const handleSave = (silent = false) => {
    const updated = {
      ...capsule,
      updatedAt: new Date().toISOString(),
    }
    setCapsule(updated)
    saveCapsule(updated)

    if (!silent) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !capsule.tags.includes(tagInput.trim())) {
      setCapsule({
        ...capsule,
        tags: [...capsule.tags, tagInput.trim()],
      })
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setCapsule({
      ...capsule,
      tags: capsule.tags.filter((t) => t !== tag),
    })
  }

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      content: "",
    }
    setCapsule({
      ...capsule,
      notes: [...capsule.notes, newNote],
    })
  }

  const handleUpdateNote = (id: string, content: string) => {
    setCapsule({
      ...capsule,
      notes: capsule.notes.map((note) => (note.id === id ? { ...note, content } : note)),
    })
  }

  const handleDeleteNote = (id: string) => {
    setCapsule({
      ...capsule,
      notes: capsule.notes.filter((note) => note.id !== id),
    })
  }

  const handleAddFlashcard = () => {
    const newFlashcard: Flashcard = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      front: "",
      back: "",
    }
    setCapsule({
      ...capsule,
      flashcards: [...capsule.flashcards, newFlashcard],
    })
  }

  const handleUpdateFlashcard = (id: string, field: "front" | "back", value: string) => {
    setCapsule({
      ...capsule,
      flashcards: capsule.flashcards.map((card) => (card.id === id ? { ...card, [field]: value } : card)),
    })
  }

  const handleDeleteFlashcard = (id: string) => {
    setCapsule({
      ...capsule,
      flashcards: capsule.flashcards.filter((card) => card.id !== id),
    })
  }

  const handleAddQuizQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      question: "",
      choices: ["", "", "", ""],
      correctIndex: 0,
      explanation: "",
    }
    setCapsule({
      ...capsule,
      quiz: [...capsule.quiz, newQuestion],
    })
  }

  const handleUpdateQuestion = (id: string, field: keyof QuizQuestion, value: any) => {
    setCapsule({
      ...capsule,
      quiz: capsule.quiz.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    })
  }

  const handleUpdateChoice = (questionId: string, choiceIndex: number, value: string) => {
    setCapsule({
      ...capsule,
      quiz: capsule.quiz.map((q) => {
        if (q.id === questionId) {
          const newChoices = [...q.choices]
          newChoices[choiceIndex] = value
          return { ...q, choices: newChoices }
        }
        return q
      }),
    })
  }

  const handleDeleteQuestion = (id: string) => {
    setCapsule({
      ...capsule,
      quiz: capsule.quiz.filter((q) => q.id !== id),
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newAttachments: Attachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Check file size (max 5MB to avoid localStorage issues)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`)
        continue
      }

      // Convert file to base64
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })

      const attachment: Attachment = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      }

      newAttachments.push(attachment)
    }

    setCapsule({
      ...capsule,
      attachments: [...capsule.attachments, ...newAttachments],
    })

    // Reset input
    e.target.value = ""
  }

  const handleDeleteAttachment = (id: string) => {
    setCapsule({
      ...capsule,
      attachments: capsule.attachments.filter((att) => att.id !== id),
    })
  }

  const handleDownloadAttachment = (attachment: Attachment) => {
    const link = document.createElement("a")
    link.href = attachment.dataUrl
    link.download = attachment.name
    link.click()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Button>
        <Button onClick={() => handleSave()} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save Capsule"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted">
          <TabsTrigger value="metadata" className="gap-2">
            <FileText className="w-4 h-4" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="w-4 h-4" />
            Notes ({capsule.notes.length})
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="gap-2">
            <Brain className="w-4 h-4" />
            Flashcards ({capsule.flashcards.length})
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Quiz ({capsule.quiz.length})
          </TabsTrigger>
          <TabsTrigger value="attachments" className="gap-2">
            <Paperclip className="w-4 h-4" />
            Files ({capsule.attachments.length})
          </TabsTrigger>
        </TabsList>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Capsule Information</CardTitle>
              <CardDescription>Basic information about your learning capsule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={capsule.title}
                  onChange={(e) => setCapsule({ ...capsule, title: e.target.value })}
                  placeholder="e.g., Introduction to JavaScript"
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={capsule.description}
                  onChange={(e) => setCapsule({ ...capsule, description: e.target.value })}
                  placeholder="Brief description of what this capsule covers..."
                  className="bg-background border-border min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={capsule.author}
                  onChange={(e) => setCapsule({ ...capsule, author: e.target.value })}
                  placeholder="Your name"
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    className="bg-background border-border"
                  />
                  <Button onClick={handleAddTag} variant="outline" className="border-border bg-transparent">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {capsule.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Add notes with Markdown support. Use # for headings, ** for bold, ` for code.
            </p>
            <Button onClick={handleAddNote} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Add Note
            </Button>
          </div>

          {capsule.notes.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No notes yet</h3>
                <p className="text-muted-foreground mb-6">Add your first note to start building your capsule</p>
                <Button onClick={handleAddNote} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {capsule.notes.map((note, index) => (
                <Card key={note.id} className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Note {index + 1}</CardTitle>
                    <Button
                      onClick={() => handleDeleteNote(note.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={note.content}
                      onChange={(e) => handleUpdateNote(note.id, e.target.value)}
                      placeholder="Write your note here... Supports Markdown!"
                      className="bg-background border-border min-h-[200px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Create flashcards to help memorize key concepts.</p>
            <Button
              onClick={handleAddFlashcard}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Flashcard
            </Button>
          </div>

          {capsule.flashcards.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No flashcards yet</h3>
                <p className="text-muted-foreground mb-6">Create flashcards to help students memorize key concepts</p>
                <Button onClick={handleAddFlashcard} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Flashcard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {capsule.flashcards.map((card, index) => (
                <Card key={card.id} className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Flashcard {index + 1}</CardTitle>
                    <Button
                      onClick={() => handleDeleteFlashcard(card.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Front (Question)</Label>
                      <Textarea
                        value={card.front}
                        onChange={(e) => handleUpdateFlashcard(card.id, "front", e.target.value)}
                        placeholder="What is the question?"
                        className="bg-background border-border min-h-[80px] text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Back (Answer)</Label>
                      <Textarea
                        value={card.back}
                        onChange={(e) => handleUpdateFlashcard(card.id, "back", e.target.value)}
                        placeholder="What is the answer?"
                        className="bg-background border-border min-h-[80px] text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Create multiple-choice questions to test understanding.</p>
            <Button
              onClick={handleAddQuizQuestion}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>

          {capsule.quiz.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No quiz questions yet</h3>
                <p className="text-muted-foreground mb-6">Add quiz questions to test student understanding</p>
                <Button
                  onClick={handleAddQuizQuestion}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Question
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {capsule.quiz.map((question, index) => (
                <Card key={question.id} className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Question {index + 1}</CardTitle>
                    <Button
                      onClick={() => handleDeleteQuestion(question.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Question</Label>
                      <Textarea
                        value={question.question}
                        onChange={(e) => handleUpdateQuestion(question.id, "question", e.target.value)}
                        placeholder="Enter your question..."
                        className="bg-background border-border min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Choices</Label>
                      {question.choices.map((choice, choiceIndex) => (
                        <div key={choiceIndex} className="flex gap-2 items-center">
                          <input
                            type="radio"
                            checked={question.correctIndex === choiceIndex}
                            onChange={() => handleUpdateQuestion(question.id, "correctIndex", choiceIndex)}
                            className="w-4 h-4"
                          />
                          <Input
                            value={choice}
                            onChange={(e) => handleUpdateChoice(question.id, choiceIndex, e.target.value)}
                            placeholder={`Choice ${choiceIndex + 1}`}
                            className="bg-background border-border"
                          />
                          {question.correctIndex === choiceIndex && (
                            <Badge variant="default" className="bg-primary text-primary-foreground">
                              Correct
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label>Explanation (Optional)</Label>
                      <Textarea
                        value={question.explanation || ""}
                        onChange={(e) => handleUpdateQuestion(question.id, "explanation", e.target.value)}
                        placeholder="Explain why this is the correct answer..."
                        className="bg-background border-border min-h-[60px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Upload files to include with your capsule. Max 5MB per file.
            </p>
            <Button
              onClick={() => document.getElementById("file-upload")?.click()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </Button>
            <input id="file-upload" type="file" multiple onChange={handleFileUpload} className="hidden" />
          </div>

          {capsule.attachments.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <Paperclip className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No files yet</h3>
                <p className="text-muted-foreground mb-6">Upload files to include with your learning capsule</p>
                <Button
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First File
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {capsule.attachments.map((attachment) => (
                <Card key={attachment.id} className="bg-card border-border">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Paperclip className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{attachment.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{formatFileSize(attachment.size)}</span>
                            <span>•</span>
                            <span>{new Date(attachment.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          onClick={() => handleDownloadAttachment(attachment)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
