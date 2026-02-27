"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, FileDown, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/auth-provider"
import { useI18n } from "@/components/i18n/i18n-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface ExportButtonsProps {
  reportId: string
}

export function ExportButtons({ reportId }: ExportButtonsProps) {
  const { t } = useI18n()
  const { deleteReport } = useAuth()
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleExportPdf = () => {
    toast(t("report_coming_soon"))
  }

  const handleExportDocs = () => {
    toast(t("report_coming_soon"))
  }

  const handleDelete = () => {
    deleteReport(reportId)
    setDeleteOpen(false)
    toast(t("report_deleted"))
    router.push("/account")
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        onClick={handleExportPdf}
        className="btn-glow gap-2"
      >
        <FileText className="size-4" />
        {t("report_export_pdf")}
      </Button>
      <Button
        variant="outline"
        onClick={handleExportDocs}
        className="btn-glow gap-2"
      >
        <FileDown className="size-4" />
        {t("report_export_docs")}
      </Button>
      <div className="flex-1" />
      <Button
        variant="outline"
        onClick={() => setDeleteOpen(true)}
        className="gap-2 border-destructive/30 text-destructive-foreground hover:bg-destructive/10"
      >
        <Trash2 className="size-4" />
        {t("report_delete")}
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
              onClick={() => setDeleteOpen(false)}
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
