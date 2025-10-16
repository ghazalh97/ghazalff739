"use client"

import { useState, useEffect } from "react"
import {
  getAllCapsules,
  deleteCapsule,
  exportCapsule,
  getCapsule,
  importCapsule,
  saveCapsule,
  initStorage,
  type CapsuleMetadata,
} from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, BookOpen, Edit, Download, Trash2, Upload, FileText, Brain, ClipboardList } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface LibraryProps {
  onCreateNew: () => void
  onEdit: (id: string) => void
  onLearn: (id: string) => void
}

export function Library({ onCreateNew, onEdit, onLearn }: LibraryProps) {
  const [capsules, setCapsules] = useState<CapsuleMetadata[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importJson, setImportJson] = useState("")
  const [importError, setImportError] = useState("")

  useEffect(() => {
    initStorage()
    loadCapsules()
  }, [])

  const loadCapsules = () => {
    setCapsules(getAllCapsules())
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this capsule?")) {
      deleteCapsule(id)
      loadCapsules()
    }
  }

  const handleExport = (id: string) => {
    const capsule = getCapsule(id)
    if (!capsule) return

    const json = exportCapsule(capsule)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${capsule.title.replace(/\s+/g, "-").toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    try {
      setImportError("")
      const capsule = importCapsule(importJson)
      saveCapsule(capsule)
      loadCapsules()
      setImportDialogOpen(false)
      setImportJson("")
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Invalid JSON format")
    }
  }

  const filteredCapsules = capsules.filter(
    (capsule) =>
      capsule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capsule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capsule.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h2 className="text-4xl font-bold gradient-text">Your Learning Library</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Create, organize, and study your learning capsules offline. Everything stays on your device.
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search capsules by title, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={onCreateNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            New Capsule
          </Button>
          <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="border-border">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Capsules Grid */}
      {filteredCapsules.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No capsules found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "Try a different search term" : "Create your first learning capsule to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={onCreateNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Capsule
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCapsules.map((capsule) => (
            <Card key={capsule.id} className="bg-card border-border card-hover group">
              <CardHeader>
                <CardTitle className="text-xl line-clamp-1">{capsule.title}</CardTitle>
                <CardDescription className="line-clamp-2">{capsule.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4 text-info" />
                    <span>{capsule.noteCount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Brain className="w-4 h-4 text-primary" />
                    <span>{capsule.flashcardCount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ClipboardList className="w-4 h-4 text-secondary" />
                    <span>{capsule.quizCount}</span>
                  </div>
                </div>

                {/* Tags */}
                {capsule.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {capsule.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {capsule.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{capsule.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  onClick={() => onLearn(capsule.id)}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Learn
                </Button>
                <Button onClick={() => onEdit(capsule.id)} variant="outline" size="icon" className="border-border">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleExport(capsule.id)}
                  variant="outline"
                  size="icon"
                  className="border-border"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(capsule.id)}
                  variant="outline"
                  size="icon"
                  className="border-border hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Import Capsule</DialogTitle>
            <DialogDescription>Paste the JSON content of a capsule to import it into your library.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-json">Capsule JSON</Label>
              <Textarea
                id="import-json"
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{"id": "...", "title": "...", ...}'
                className="font-mono text-sm min-h-[200px] bg-muted border-border"
              />
            </div>
            {importError && <p className="text-sm text-destructive">{importError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)} className="border-border">
              Cancel
            </Button>
            <Button onClick={handleImport} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
