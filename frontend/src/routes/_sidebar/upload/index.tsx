import { createFileRoute } from '@tanstack/react-router'
import { UploadPage } from '#/features/upload/upload-page'

export const Route = createFileRoute('/_sidebar/upload/')({
  component: UploadPage,
})
