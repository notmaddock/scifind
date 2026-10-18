import { useEffect, useRef, useState } from 'react'
import { OrthographicView } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'
import { DeckGL } from '@deck.gl/react'
import { DocumentPreview } from '#/features/documents/document-preview'
import type { EmbeddedDocument } from './api'

const view = new OrthographicView({ id: 'embeddings', flipY: false })
type Color = [number, number, number, number]

export function EmbeddingsPlot({ points }: { points: EmbeddedDocument[] }) {
  const container = useRef<HTMLDivElement>(null)
  const [primary, setPrimary] = useState<Color>([0, 0, 0, 255])
  const [hover, setHover] = useState<{
    document: EmbeddedDocument
    x: number
    y: number
  } | null>(null)
  const [selected, setSelected] = useState<EmbeddedDocument | null>(null)

  // convert theme oklch to rgba for deckgl
  useEffect(() => {
    const context = document.createElement('canvas').getContext('2d')!
    const updateColor = () => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = getComputedStyle(container.current!).color
      context.fillRect(0, 0, 1, 1)
      setPrimary(Array.from(context.getImageData(0, 0, 1, 1).data) as Color)
    }
    updateColor()
    const observer = new MutationObserver(updateColor)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
    return () => observer.disconnect()
  }, [])

  const xs = points.map((point) => point.position[0])
  const ys = points.map((point) => point.position[1])
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2
  const span = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
    1,
  )

  return (
    <>
      <div
        ref={container}
        className="relative min-h-80 flex-1 overflow-hidden rounded-2xl border text-primary"
        aria-label="Document embedding scatterplot"
      >
        <DeckGL
          views={view}
          initialViewState={{ target: [0, 0, 0], zoom: 0 }}
          controller
          pickingRadius={4}
          onViewStateChange={() => setHover(null)}
          getCursor={({ isDragging, isHovering }) =>
            isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
          }
          layers={[
            new ScatterplotLayer<EmbeddedDocument>({
              id: 'documents',
              data: points,
              getPosition: (point) => [
                ((point.position[0] - centerX) / span) * 240,
                ((point.position[1] - centerY) / span) * 240,
              ],
              getFillColor: primary,
              getRadius: 6,
              radiusUnits: 'pixels',
              pickable: true,
              autoHighlight: true,
              updateTriggers: { getPosition: [centerX, centerY, span] },
              onHover: ({ object, x, y }) =>
                setHover(object ? { document: object, x, y } : null),
              onClick: ({ object }) => {
                if (object) {
                  setHover(null)
                  setSelected(object)
                }
              },
            }),
          ]}
        />
        {hover && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 max-w-64 rounded-md border bg-popover px-3 py-2 text-sm wrap-anywhere text-popover-foreground shadow-md"
            style={{
              left: Math.max(
                8,
                Math.min(
                  hover.x + 12,
                  (container.current?.clientWidth ?? 320) - 264,
                ),
              ),
              top: Math.max(8, hover.y - 52),
            }}
          >
            {hover.document.filename}
          </div>
        )}
      </div>
      {selected && (
        <DocumentPreview
          document={selected}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null)
          }}
        />
      )}
    </>
  )
}
