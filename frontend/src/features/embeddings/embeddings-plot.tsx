import { useEffect, useRef, useState } from 'react'
import { OrthographicView } from '@deck.gl/core'
import type { OrthographicViewState } from '@deck.gl/core'
import { BoxesIcon, LocateFixedIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ScatterplotLayer } from '@deck.gl/layers'
import { DeckGL } from '@deck.gl/react'
import { DocumentPreview } from '#/features/documents/document-preview'
import type { EmbeddedDocument } from './api'

const clusterColors: Color[] = [
  [37, 99, 235, 255],
  [234, 88, 12, 255],
  [22, 163, 74, 255],
  [147, 51, 234, 255],
  [220, 38, 38, 255],
  [8, 145, 178, 255],
  [202, 138, 4, 255],
  [219, 39, 119, 255],
  [79, 70, 229, 255],
  [101, 163, 13, 255],
]

export function clusterColor(cluster: number): Color {
  return clusterColors[cluster % clusterColors.length]
}

const view = new OrthographicView({ id: 'embeddings', flipY: false })
type Color = [number, number, number, number]

export function EmbeddingsPlot({
  points,
  labels,
  documentId,
  onClearFocus,
  onConfigureClustering,
}: {
  labels?: Record<string, number>
  points: EmbeddedDocument[]
  documentId?: string
  onConfigureClustering: () => void
  onClearFocus: () => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [primary, setPrimary] = useState<Color>([0, 0, 0, 255])
  const [hover, setHover] = useState<{
    document: EmbeddedDocument
    x: number
    y: number
  } | null>(null)
  const [selected, setSelected] = useState<EmbeddedDocument | null>(null)

  const xs = points.map((point) => point.position[0])
  const ys = points.map((point) => point.position[1])
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2
  const span = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
    1,
  )

  const position = (point: EmbeddedDocument): [number, number, number] => [
    ((point.position[0] - centerX) / span) * 240,
    ((point.position[1] - centerY) / span) * 240,
    0,
  ]
  const focused = points.find((point) => point.id === documentId)
  const [viewState, setViewState] = useState<OrthographicViewState>(() => ({
    target: focused ? position(focused) : [0, 0, 0],
    zoom: focused ? 2 : 0,
  }))

  useEffect(() => {
    if (focused) {
      setViewState({
        target: [
          ((focused.position[0] - centerX) / span) * 240,
          ((focused.position[1] - centerY) / span) * 240,
          0,
        ],
        zoom: 2,
      })
    }
  }, [focused, centerX, centerY, span])

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

  const color = (point: EmbeddedDocument): Color =>
    labels?.[point.id] !== undefined ? clusterColor(labels[point.id]) : primary

  return (
    <>
      <div
        ref={container}
        className="relative min-h-80 flex-1 overflow-hidden rounded-3xl border text-primary"
        aria-label="Document embedding scatterplot"
      >
        <DeckGL
          views={view}
          viewState={viewState}
          controller
          pickingRadius={4}
          onClick={({ object }) => {
            if (!object) {
              setHover(null)
              onClearFocus()
            }
          }}
          onViewStateChange={({ viewState: nextViewState }) => {
            setViewState(nextViewState)
            setHover(null)
          }}
          getCursor={({ isDragging, isHovering }) =>
            isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
          }
          layers={[
            new ScatterplotLayer<EmbeddedDocument>({
              id: 'documents',
              data: points,
              getPosition: position,
              getFillColor: (point) => {
                const fill = color(point)
                return focused ? [fill[0], fill[1], fill[2], 45] : fill
              },
              getRadius: 6,
              radiusUnits: 'pixels',
              pickable: true,
              autoHighlight: true,
              updateTriggers: {
                getPosition: [centerX, centerY, span],
                getFillColor: [labels, primary, focused],
              },
              onHover: ({ object, x, y }) =>
                setHover(object ? { document: object, x, y } : null),
              onClick: ({ object }) => {
                if (object) {
                  setHover(null)
                  setSelected(object)
                }
              },
            }),
            focused &&
              new ScatterplotLayer<EmbeddedDocument>({
                id: 'located-document',
                data: [focused],
                getPosition: position,
                getFillColor: color,
                getRadius: 16,
                radiusUnits: 'pixels',
                stroked: true,
                getLineColor: [255, 255, 255, 255],
                getLineWidth: 3,
                lineWidthUnits: 'pixels',
                parameters: { depthCompare: 'always' },
                pickable: true,
                updateTriggers: {
                  getPosition: [centerX, centerY, span],
                  getFillColor: [labels, primary],
                },
                onHover: ({ object, x, y }) =>
                  setHover(object ? { document: object, x, y } : null),
                onClick: () => {
                  setHover(null)
                  setSelected(focused)
                },
              }),
          ]}
        />
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Button
            variant="outline"
            className="rounded-2xl bg-background"
            onClick={onConfigureClustering}
          >
            <BoxesIcon />
            Clustering
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl bg-background"
            onClick={() => {
              setViewState({ target: [0, 0, 0], zoom: 0 })
              setHover(null)
            }}
          >
            <LocateFixedIcon />
            Recenter
          </Button>
        </div>
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
            {labels?.[hover.document.id] !== undefined &&
              ` · Cluster ${labels[hover.document.id] + 1}`}
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
