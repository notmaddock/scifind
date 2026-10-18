import { EyeIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { documentUrl } from './api'

type DocumentPreviewProps = {
  document: { id: string; filename: string }
  pageNumber?: number | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DocumentPreview({
  document,
  pageNumber,
  open,
  onOpenChange,
}: DocumentPreviewProps) {
  const previewUrl = documentUrl(document.id, true)
  const viewerUrl = pageNumber ? `${previewUrl}#page=${pageNumber}` : previewUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open === undefined && (
        <DialogTrigger
          render={<Button variant="outline" />}
          aria-label={`Preview ${document.filename}`}
        >
          <EyeIcon />
          Preview
        </DialogTrigger>
      )}
      <DialogContent className="flex h-[85svh] flex-col sm:max-w-5xl">
        <DialogHeader className="pr-8">
          <DialogTitle className="wrap-anywhere">
            {document.filename}
          </DialogTitle>
        </DialogHeader>
        <iframe
          className="min-h-0 w-full flex-1 rounded-lg border bg-white"
          title={`Preview of ${document.filename}`}
          src={viewerUrl}
        />
        <DialogFooter>
          <Button
            nativeButton={false}
            variant="outline"
            render={
              <a href={viewerUrl} target="_blank" rel="noopener noreferrer" />
            }
          >
            Open in new tab
          </Button>
          <Button
            nativeButton={false}
            render={<a href={documentUrl(document.id)} />}
          >
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
