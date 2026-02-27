"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User, Report, Task } from "@/lib/types"
import { MOCK_USER, MOCK_REPORTS, MOCK_TASKS, MOCK_OPPORTUNITIES, getOpportunitiesForReport } from "@/lib/mock-data"

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  login: () => void
  logout: () => void
  reports: Report[]
  tasks: Task[]
  runningTask: Task | null
  addReport: (report: Report) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteReport: (reportId: string) => void
  getReport: (reportId: string) => Report | undefined
  getTask: (taskId: string) => Task | undefined
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("gurubox_auth")
    if (saved === "true") {
      setUser(MOCK_USER)
      setReports([...MOCK_REPORTS])
      setTasks([...MOCK_TASKS])
    }
  }, [])

  const login = useCallback(() => {
    setUser(MOCK_USER)
    setReports([...MOCK_REPORTS])
    setTasks([...MOCK_TASKS])
    localStorage.setItem("gurubox_auth", "true")
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setReports([])
    setTasks([])
    localStorage.removeItem("gurubox_auth")
  }, [])

  const runningTask = tasks.find((t) => t.status === "running") ?? null

  const addReport = useCallback((report: Report) => {
    setReports((prev) => [report, ...prev])
  }, [])

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [task, ...prev])
  }, [])

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    )
  }, [])

  const deleteReport = useCallback((reportId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, is_deleted: true, status: "deleted" as const } : r
      )
    )
  }, [])

  const getReport = useCallback(
    (reportId: string) => reports.find((r) => r.id === reportId),
    [reports]
  )

  const getTask = useCallback(
    (taskId: string) => tasks.find((t) => t.id === taskId),
    [tasks]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        logout,
        reports,
        tasks,
        runningTask,
        addReport,
        addTask,
        updateTask,
        deleteReport,
        getReport,
        getTask,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
