"use client"

import { useState, useEffect } from "react"
import { getCapsule, getProgress, saveProgress, type Capsule, type Progress, type Attachment } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  FileText,
  Brain,
  ClipboardList,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  Paperclip,
  Download,
  ExternalLink,
} from "lucide-react"
import { Progress as ProgressBar } from "@/components/ui/progress"

interface LearnProps {
  capsuleId: string
  onBack: () => void
}

export function Learn({ capsuleId, onBack }: LearnProps) {
  const [capsule, setCapsule] = useState<Capsule | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [activeTab, setActiveTab] = useState("notes")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showQuizResult, setShowQuizResult] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([])

  useEffect(() => {
    const loadedCapsule = getCapsule(capsuleId)
    if (loadedCapsule) {
      setCapsule(loadedCapsule)
      const loadedProgress = getProgress(capsuleId)
      setProgress(loadedProgress)
    }
  }, [capsuleId])

  useEffect(() => {
    if (progress) {
      saveProgress(progress)
    }
  }, [progress])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (activeTab === "flashcards" && capsule && capsule.flashcards.length > 0) {
        if (e.key === " ") {
          e.preventDefault()
          setIsFlipped(!isFlipped)
        } else if (e.key === "[") {
          e.preventDefault()
          handlePreviousFlashcard()
        } else if (e.key === "]") {
          e.preventDefault()
          handleNextFlashcard()
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [activeTab, isFlipped, currentFlashcardIndex, capsule])

  if (!capsule) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Loading capsule...</p>
      </div>
    )
  }

  const handlePreviousFlashcard = () => {
    if (currentFlashcardIndex > 0) {
      setCurrentFlashcardIndex(currentFlashcardIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleNextFlashcard = () => {
    if (currentFlashcardIndex < capsule.flashcards.length - 1) {
      setCurrentFlashcardIndex(currentFlashcardIndex + 1)
      setIsFlipped(false)
    }
  }

  const handleMarkKnown = () => {
    if (!progress) return
    const cardId = capsule.flashcards[currentFlashcardIndex].id
    const newProgress = {
      ...progress,
      knownFlashcards: [...progress.knownFlashcards.filter((id) => id !== cardId), cardId],
      unknownFlashcards: progress.unknownFlashcards.filter((id) => id !== cardId),
      lastStudied: new Date().toISOString(),
    }
    setProgress(newProgress)
    handleNextFlashcard()
  }

  const handleMarkUnknown = () => {
    if (!progress) return
    const cardId = capsule.flashcards[currentFlashcardIndex].id
    const newProgress = {
      ...progress,
      unknownFlashcards: [...progress.unknownFlashcards.filter((id) => id !== cardId), cardId],
      knownFlashcards: progress.knownFlashcards.filter((id) => id !== cardId),
      lastStudied: new Date().toISOString(),
    }
    setProgress(newProgress)
    handleNextFlashcard()
  }

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    const isCorrect = answerIndex === capsule.quiz[currentQuizIndex].correctIndex
    const newAnswers = [...quizAnswers]
    newAnswers[currentQuizIndex] = isCorrect
    setQuizAnswers(newAnswers)

    if (isCorrect) {
      setQuizScore(quizScore + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuizIndex < capsule.quiz.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1)
      setSelectedAnswer(null)
    } else {
      setShowQuizResult(true)
      if (progress && quizScore + 1 > progress.bestQuizScore) {
        const newProgress = {
          ...progress,
          bestQuizScore: quizScore + 1,
          lastStudied: new Date().toISOString(),
        }
        setProgress(newProgress)
      }
    }
  }

  const handleRestartQuiz = () => {
    setCurrentQuizIndex(0)
    setSelectedAnswer(null)
    setShowQuizResult(false)
    setQuizScore(0)
    setQuizAnswers([])
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

  const isImage = (type: string): boolean => {
    return type.startsWith("image/")
  }

  const filteredNotes = capsule.notes.filter((note) => note.content.toLowerCase().includes(searchQuery.toLowerCase()))

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering
    let html = content
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // Code blocks
    html = html.replace(
      /```(.*?)```/gs,
      '<pre class="bg-muted p-3 rounded-lg my-2 overflow-x-auto"><code>$1</code></pre>',
    )
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
    // Line breaks
    html = html.replace(/\n/g, "<br />")

    return html
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Button>
        <div className="text-right">
          <h2 className="text-xl font-bold">{capsule.title}</h2>
          <p className="text-sm text-muted-foreground">{capsule.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{capsule.notes.length}</p>
                <p className="text-sm text-muted-foreground">Notes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{capsule.flashcards.length}</p>
                <p className="text-sm text-muted-foreground">
                  Flashcards ({progress?.knownFlashcards.length || 0} known)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{capsule.quiz.length}</p>
                <p className="text-sm text-muted-foreground">Questions (Best: {progress?.bestQuizScore || 0})</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Paperclip className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{capsule.attachments.length}</p>
                <p className="text-sm text-muted-foreground">Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="w-4 h-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="gap-2">
            <Brain className="w-4 h-4" />
            Flashcards
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Quiz
          </TabsTrigger>
          <TabsTrigger value="attachments" className="gap-2">
            <Paperclip className="w-4 h-4" />
            Files
          </TabsTrigger>
        </TabsList>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {filteredNotes.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No notes found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "This capsule has no notes yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note, index) => (
                <Card key={note.id} className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Note {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="space-y-4">
          {capsule.flashcards.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No flashcards yet</h3>
                <p className="text-muted-foreground">This capsule has no flashcards to study</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Card {currentFlashcardIndex + 1} of {capsule.flashcards.length}
                  </span>
                  <span className="text-muted-foreground">
                    Known: {progress?.knownFlashcards.length || 0} / {capsule.flashcards.length}
                  </span>
                </div>
                <ProgressBar value={((currentFlashcardIndex + 1) / capsule.flashcards.length) * 100} className="h-2" />
              </div>

              {/* Flashcard */}
              <div className="perspective-1000">
                <Card
                  className={`bg-card border-border min-h-[400px] cursor-pointer transition-all duration-500 ${
                    isFlipped ? "rotate-y-180" : ""
                  }`}
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  <CardContent className="flex items-center justify-center min-h-[400px] p-8">
                    <div
                      className="text-center"
                      style={{
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                    >
                      <Badge variant="secondary" className="mb-4">
                        {isFlipped ? "Answer" : "Question"}
                      </Badge>
                      <p className="text-2xl font-medium leading-relaxed">
                        {isFlipped
                          ? capsule.flashcards[currentFlashcardIndex].back
                          : capsule.flashcards[currentFlashcardIndex].front}
                      </p>
                      <p className="text-sm text-muted-foreground mt-6">Click or press Space to flip</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <div className="flex gap-2 justify-between items-center">
                <Button
                  onClick={handlePreviousFlashcard}
                  disabled={currentFlashcardIndex === 0}
                  variant="outline"
                  className="border-border bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous [
                </Button>

                <div className="flex gap-2">
                  <Button onClick={handleMarkUnknown} variant="outline" className="border-border gap-2 bg-transparent">
                    <X className="w-4 h-4" />
                    Unknown
                  </Button>
                  <Button
                    onClick={handleMarkKnown}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Known
                  </Button>
                </div>

                <Button
                  onClick={handleNextFlashcard}
                  disabled={currentFlashcardIndex === capsule.flashcards.length - 1}
                  variant="outline"
                  className="border-border bg-transparent"
                >
                  Next ]<ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Keyboard shortcuts hint */}
              <Card className="bg-muted/50 border-border">
                <CardContent className="py-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Keyboard shortcuts: <kbd className="px-2 py-1 bg-background rounded">Space</kbd> to flip,{" "}
                    <kbd className="px-2 py-1 bg-background rounded">[</kbd> previous,{" "}
                    <kbd className="px-2 py-1 bg-background rounded">]</kbd> next
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="space-y-4">
          {capsule.quiz.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No quiz questions yet</h3>
                <p className="text-muted-foreground">This capsule has no quiz questions</p>
              </CardContent>
            </Card>
          ) : showQuizResult ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-3xl font-bold mb-2">Quiz Complete!</h3>
                <p className="text-5xl font-bold text-primary my-6">
                  {quizScore} / {capsule.quiz.length}
                </p>
                <p className="text-muted-foreground mb-2">
                  You scored {Math.round((quizScore / capsule.quiz.length) * 100)}%
                </p>
                {progress && quizScore > progress.bestQuizScore && (
                  <Badge variant="default" className="bg-primary text-primary-foreground mb-6">
                    New Best Score!
                  </Badge>
                )}
                <div className="mt-8">
                  <Button
                    onClick={handleRestartQuiz}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Question {currentQuizIndex + 1} of {capsule.quiz.length}
                  </span>
                  <span className="text-muted-foreground">
                    Score: {quizScore} / {currentQuizIndex + (selectedAnswer !== null ? 1 : 0)}
                  </span>
                </div>
                <ProgressBar value={((currentQuizIndex + 1) / capsule.quiz.length) * 100} className="h-2" />
              </div>

              {/* Question */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-2xl leading-relaxed">{capsule.quiz[currentQuizIndex].question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {capsule.quiz[currentQuizIndex].choices.map((choice, index) => {
                    const isSelected = selectedAnswer === index
                    const isCorrect = index === capsule.quiz[currentQuizIndex].correctIndex
                    const showResult = selectedAnswer !== null

                    return (
                      <button
                        key={index}
                        onClick={() => !showResult && handleQuizAnswer(index)}
                        disabled={showResult}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          showResult
                            ? isCorrect
                              ? "border-primary bg-primary/10"
                              : isSelected
                                ? "border-destructive bg-destructive/10"
                                : "border-border bg-card"
                            : isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{choice}</span>
                          {showResult && isCorrect && <Check className="w-5 h-5 text-primary" />}
                          {showResult && isSelected && !isCorrect && <X className="w-5 h-5 text-destructive" />}
                        </div>
                      </button>
                    )
                  })}

                  {selectedAnswer !== null && capsule.quiz[currentQuizIndex].explanation && (
                    <Card className="bg-muted border-border mt-4">
                      <CardContent className="pt-4">
                        <p className="text-sm font-semibold mb-2">Explanation:</p>
                        <p className="text-sm text-muted-foreground">{capsule.quiz[currentQuizIndex].explanation}</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Next Button */}
              {selectedAnswer !== null && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {currentQuizIndex === capsule.quiz.length - 1 ? "Finish Quiz" : "Next Question"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          {capsule.attachments.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center">
                <Paperclip className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No files attached</h3>
                <p className="text-muted-foreground">This capsule has no attached files</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {capsule.attachments.map((attachment) => (
                <Card key={attachment.id} className="bg-card border-border overflow-hidden">
                  {isImage(attachment.type) && (
                    <div className="w-full h-48 bg-muted flex items-center justify-center overflow-hidden">
                      <img
                        src={attachment.dataUrl || "/placeholder.svg"}
                        alt={attachment.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
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
                        {isImage(attachment.type) && (
                          <Button
                            onClick={() => window.open(attachment.dataUrl, "_blank")}
                            variant="outline"
                            size="sm"
                            className="border-border bg-transparent gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                          size="sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
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
