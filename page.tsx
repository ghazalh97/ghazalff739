"use client"

import { useState } from "react"
import { Library } from "@/components/library"
import { Author } from "@/components/author"
import { Learn } from "@/components/learn"
import { BookOpen, GraduationCap } from "lucide-react"

export type Mode = "library" | "author" | "learn"

export default function Home() {
  const [mode, setMode] = useState<Mode>("library")
  const [editingCapsuleId, setEditingCapsuleId] = useState<string | null>(null)
  const [learningCapsuleId, setLearningCapsuleId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setMode("library")
                setEditingCapsuleId(null)
                setLearningCapsuleId(null)
              }}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold gradient-text">Pocket Classroom</h1>
                <p className="text-xs text-muted-foreground">Offline Learning Capsules</p>
              </div>
            </button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span>Learn Anywhere, Anytime</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {mode === "library" && (
          <Library
            onCreateNew={() => {
              setEditingCapsuleId(null)
              setMode("author")
            }}
            onEdit={(id) => {
              setEditingCapsuleId(id)
              setMode("author")
            }}
            onLearn={(id) => {
              setLearningCapsuleId(id)
              setMode("learn")
            }}
          />
        )}

        {mode === "author" && <Author capsuleId={editingCapsuleId} onBack={() => setMode("library")} />}

        {mode === "learn" && learningCapsuleId && (
          <Learn capsuleId={learningCapsuleId} onBack={() => setMode("library")} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built with ❤️ for offline learning • All data stored locally</p>
        </div>
      </footer>
    </div>
  )
}
