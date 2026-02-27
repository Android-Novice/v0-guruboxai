"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ExternalLink, FileDown, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/auth-provider"
import { useI18n } from "@/components/i18n/i18n-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { getTopScore } from "@/lib/mock-data"
import type { Report } from "@/lib/types"
import { cn } from "@/lib/utils"

export function HistoryTable() {
  const { reports, deleteReport } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const visibleReports = reports.filter((r) => !r.is_deleted)

  const handleDelete = () => {
    if (deleteId) {
      deleteReport(deleteId)
      setDeleteId(null)
      toast(t("report_deleted"))
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (report: Report) => {
    if (report.status === "completed") {
      return (
        <Badge variant="outline" className="border-0 bg-emerald-100 text-emerald-700">
          {t("status_completed")}
        </Badge>
      )
    }
    if (report.status === "generating") {
      return (
        <Badge variant="outline" className="border-0 bg-amber-100 text-amber-700">
          {t("status_generating")}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-0 bg-muted text-muted-foreground">
        {t("status_deleted")}
      </Badge>
    )
  }

  if (visibleReports.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">{t("account_no_reports")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">{t("account_col_input")}</TableHead>
              <TableHead className="text-muted-foreground">{t("account_col_created")}</TableHead>
              <TableHead className="text-muted-foreground">{t("account_col_opportunities")}</TableHead>
              <TableHead className="text-muted-foreground">{t("account_col_top_score")}</TableHead>
              <TableHead className="text-muted-foreground">{t("account_col_status")}</TableHead>
              <TableHead className="text-right text-muted-foreground">{t("account_col_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleReports.map((report, idx) => (
              <TableRow
                key={report.id}
                className="row-animate border-border hover:bg-accent"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <TableCell className="max-w-[200px] truncate text-sm font-medium text-foreground">
                  {report.input_text}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(report.created_at)}
                </TableCell>
                <TableCell className="text-sm tabular-nums text-muted-foreground">
                  {report.total_opportunities}
                </TableCell>
                <TableCell className="tabular-nums text-sm text-muted-foreground">
                  {report.status === "completed" ? getTopScore(report.id) : "-"}
                </TableCell>
                <TableCell>
                  {getStatusBadge(report)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {report.status === "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-foreground hover:text-primary"
                      >
                        <Link href={`/report/${report.id}`}>
                          <ExternalLink className="mr-1 size-3" />
                          {t("account_open")}
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast(t("report_coming_soon"))}
                      className="text-muted-foreground"
                    >
                      <FileDown className="mr-1 size-3" />
                      {t("account_export")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(report.id)}
                      className="text-destructive-foreground hover:text-destructive-foreground"
                    >
                      <Trash2 className="mr-1 size-3" />
                      {t("account_delete")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("report_delete_confirm")}</DialogTitle>
            <DialogDescription>
              {t("report_delete_confirm_desc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
            >
              {t("report_delete_cancel")}
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("report_delete_yes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
