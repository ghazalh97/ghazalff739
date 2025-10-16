import type { Progress } from "@/components/ui/progress"
// Storage schema version
const SCHEMA_VERSION = "pocket-classroom/v1"

// Storage keys
const KEYS = {
  INDEX: "pc_capsules_index",
  CAPSULE_PREFIX: "pc_capsule_",
  PROGRESS_PREFIX: "pc_progress_",
}

export interface Capsule {
  id: string
  version: string
  title: string
  description: string
  author: string
  tags: string[]
  createdAt: string
  updatedAt: string
  notes: Note[]
  flashcards: Flashcard[]
  quiz: QuizQuestion[]
  attachments: Attachment[]
}

export interface Note {
  id: string
  content: string
}

export interface Flashcard {
  id: string
  front: string
  back: string
}

export interface QuizQuestion {
  id: string
  question: string
  choices: string[]
  correctIndex: number
  explanation?: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  dataUrl: string
  uploadedAt: string
}

export interface CapsuleMetadata {
  id: string
  title: string
  description: string
  author: string
  tags: string[]
  createdAt: string
  updatedAt: string
  noteCount: number
  flashcardCount: number
  quizCount: number
  attachmentCount: number
}

// Initialize storage
export function initStorage(): void {
  if (typeof window === "undefined") return

  const index = localStorage.getItem(KEYS.INDEX)
  if (!index) {
    localStorage.setItem(KEYS.INDEX, JSON.stringify([]))

    // Add sample capsule
    const sampleCapsule = createSampleCapsule()
    saveCapsule(sampleCapsule)
  }
}

// Get all capsule metadata
export function getAllCapsules(): CapsuleMetadata[] {
  if (typeof window === "undefined") return []

  const indexStr = localStorage.getItem(KEYS.INDEX)
  if (!indexStr) return []

  try {
    return JSON.parse(indexStr)
  } catch {
    return []
  }
}

// Get a single capsule
export function getCapsule(id: string): Capsule | null {
  if (typeof window === "undefined") return null

  const capsuleStr = localStorage.getItem(KEYS.CAPSULE_PREFIX + id)
  if (!capsuleStr) return null

  try {
    return JSON.parse(capsuleStr)
  } catch {
    return null
  }
}

// Save a capsule
export function saveCapsule(capsule: Capsule): void {
  if (typeof window === "undefined") return

  // Save full capsule data
  localStorage.setItem(KEYS.CAPSULE_PREFIX + capsule.id, JSON.stringify(capsule))

  // Update index
  const index = getAllCapsules()
  const existingIndex = index.findIndex((c) => c.id === capsule.id)

  const metadata: CapsuleMetadata = {
    id: capsule.id,
    title: capsule.title,
    description: capsule.description,
    author: capsule.author,
    tags: capsule.tags,
    createdAt: capsule.createdAt,
    updatedAt: capsule.updatedAt,
    noteCount: capsule.notes.length,
    flashcardCount: capsule.flashcards.length,
    quizCount: capsule.quiz.length,
    attachmentCount: capsule.attachments.length,
  }

  if (existingIndex >= 0) {
    index[existingIndex] = metadata
  } else {
    index.push(metadata)
  }

  localStorage.setItem(KEYS.INDEX, JSON.stringify(index))
}

// Delete a capsule
export function deleteCapsule(id: string): void {
  if (typeof window === "undefined") return

  // Remove capsule data
  localStorage.removeItem(KEYS.CAPSULE_PREFIX + id)
  localStorage.removeItem(KEYS.PROGRESS_PREFIX + id)

  // Update index
  const index = getAllCapsules().filter((c) => c.id !== id)
  localStorage.setItem(KEYS.INDEX, JSON.stringify(index))
}

// Get progress for a capsule
export function getProgress(capsuleId: string): Progress {
  if (typeof window === "undefined") {
    return {
      capsuleId,
      knownFlashcards: [],
      unknownFlashcards: [],
      bestQuizScore: 0,
      lastStudied: new Date().toISOString(),
    }
  }

  const progressStr = localStorage.getItem(KEYS.PROGRESS_PREFIX + capsuleId)
  if (!progressStr) {
    return {
      capsuleId,
      knownFlashcards: [],
      unknownFlashcards: [],
      bestQuizScore: 0,
      lastStudied: new Date().toISOString(),
    }
  }

  try {
    return JSON.parse(progressStr)
  } catch {
    return {
      capsuleId,
      knownFlashcards: [],
      unknownFlashcards: [],
      bestQuizScore: 0,
      lastStudied: new Date().toISOString(),
    }
  }
}

// Save progress
export function saveProgress(progress: Progress): void {
  if (typeof window === "undefined") return

  localStorage.setItem(KEYS.PROGRESS_PREFIX + progress.capsuleId, JSON.stringify(progress))
}

// Export capsule as JSON
export function exportCapsule(capsule: Capsule): string {
  return JSON.stringify(capsule, null, 2)
}

// Import capsule from JSON
export function importCapsule(jsonStr: string): Capsule {
  const capsule = JSON.parse(jsonStr)

  // Validate schema
  if (capsule.version !== SCHEMA_VERSION) {
    throw new Error("Invalid capsule version")
  }

  // Validate required fields
  if (!capsule.id || !capsule.title || !capsule.notes || !capsule.flashcards || !capsule.quiz) {
    throw new Error("Invalid capsule format")
  }

  return capsule
}

// Create a new empty capsule
export function createNewCapsule(): Capsule {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    version: SCHEMA_VERSION,
    title: "Untitled Capsule",
    description: "",
    author: "",
    tags: [],
    createdAt: now,
    updatedAt: now,
    notes: [],
    flashcards: [],
    quiz: [],
    attachments: [],
  }
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Create sample capsule
function createSampleCapsule(): Capsule {
  const now = new Date().toISOString()
  return {
    id: "sample-" + generateId(),
    version: SCHEMA_VERSION,
    title: "Introduction to JavaScript",
    description: "Learn the basics of JavaScript programming",
    author: "Pocket Classroom",
    tags: ["programming", "javascript", "beginner"],
    createdAt: now,
    updatedAt: now,
    notes: [
      {
        id: generateId(),
        content:
          '# Variables\n\nVariables are containers for storing data values. In JavaScript, you can declare variables using `let`, `const`, or `var`.\n\n**Example:**\n```javascript\nlet name = "John";\nconst age = 30;\n```',
      },
      {
        id: generateId(),
        content:
          '# Functions\n\nFunctions are reusable blocks of code that perform specific tasks.\n\n**Example:**\n```javascript\nfunction greet(name) {\n  return "Hello, " + name;\n}\n```',
      },
    ],
    flashcards: [
      {
        id: generateId(),
        front: "What is a variable?",
        back: "A variable is a container for storing data values.",
      },
      {
        id: generateId(),
        front: "What are the three ways to declare a variable in JavaScript?",
        back: "let, const, and var",
      },
      {
        id: generateId(),
        front: "What is a function?",
        back: "A function is a reusable block of code that performs a specific task.",
      },
    ],
    quiz: [
      {
        id: generateId(),
        question: "Which keyword is used to declare a constant in JavaScript?",
        choices: ["var", "let", "const", "constant"],
        correctIndex: 2,
        explanation: "The `const` keyword is used to declare constants that cannot be reassigned.",
      },
      {
        id: generateId(),
        question: "What does a function return if no return statement is specified?",
        choices: ["null", "undefined", "0", "false"],
        correctIndex: 1,
        explanation: "Functions return `undefined` by default if no return statement is specified.",
      },
    ],
    attachments: [],
  }
}
