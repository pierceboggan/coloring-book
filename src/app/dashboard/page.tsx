'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useImages } from '@/hooks/useImages'
import { useImageActions } from '@/hooks/useImageActions'
import { useCollaborativeSession } from '@/hooks/useCollaborativeSession'
import { ColoringPageGrid } from '@/components/Dashboard/ColoringPageGrid'
import { DashboardEmptyState } from '@/components/Dashboard/DashboardEmptyState'
import { DashboardHeader } from '@/components/Dashboard/DashboardHeader'
import { DashboardLoadingState } from '@/components/Dashboard/DashboardLoadingState'
import { DashboardStatusBanner } from '@/components/Dashboard/DashboardStatusBanner'
import { DashboardToolbar, type LayoutMode, type ViewMode } from '@/components/Dashboard/DashboardToolbar'
import { UploadGrid } from '@/components/Dashboard/UploadGrid'
import { UploaderModal } from '@/components/Dashboard/UploaderModal'
import {
  ColoringCanvasModal,
  FamilyAlbumCreator,
  PhotobookCreator,
  PromptRemixModal,
  RegenerateModal,
  VariantsModal,
} from '@/components/Dashboard/dynamicModals'
import type { UserImage } from '@/components/Dashboard/types'
import { buildColoringDisplayItems, getVariantSummaries, sortUploads } from '@/components/Dashboard/utils'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const userId = user?.id ?? null

  const { images, loading, setImages, refetch } = useImages(userId)
  const {
    archiveImage,
    toggleFavorite,
    retryStuckImages,
    retryingProcessing,
    renameImage,
    renamingImageId,
    applyVariantAsPrimary,
    downloadColoringPage,
  } = useImageActions({ userId, setImages, refetch })
  const { collabSession, startCollaborativeSession, endCollaborativeSession } = useCollaborativeSession()

  const [showPhotobookCreator, setShowPhotobookCreator] = useState(false)
  const [showFamilyAlbumCreator, setShowFamilyAlbumCreator] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [regenerateImage, setRegenerateImage] = useState<UserImage | null>(null)
  const [activeDrawingImage, setActiveDrawingImage] = useState<UserImage | null>(null)
  const [promptRemixImage, setPromptRemixImage] = useState<UserImage | null>(null)
  const [variantsImage, setVariantsImage] = useState<UserImage | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('coloring')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('compact')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  const totalImages = images.length
  const completedImages = useMemo(
    () => images.filter(img => img.status === 'completed' && img.coloring_page_url),
    [images]
  )
  const processingCount = images.filter(img => img.status === 'processing').length

  const coloringDisplayItems = useMemo(() => buildColoringDisplayItems(images), [images])
  const sortedUploads = useMemo(() => sortUploads(images), [images])

  const filteredColoringItems = favoritesOnly
    ? coloringDisplayItems.filter(item => item.isFavorite)
    : coloringDisplayItems
  const filteredUploads = favoritesOnly
    ? sortedUploads.filter(image => image.is_favorite ?? false)
    : sortedUploads

  const handleStartCollab = async (image: UserImage) => {
    await startCollaborativeSession(image)
    if (image.coloring_page_url) {
      setActiveDrawingImage(image)
    }
  }

  if (authLoading || loading) {
    return <DashboardLoadingState authLoading={authLoading} loading={loading} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <DashboardHeader
        userEmail={user?.email}
        hasCompletedImages={completedImages.length > 0}
        onShowFamilyAlbumCreator={() => setShowFamilyAlbumCreator(true)}
        onShowPhotobookCreator={() => setShowPhotobookCreator(true)}
        onShowUploader={() => setShowUploader(true)}
      />

      <main className="container mx-auto px-4 pb-10 pt-2.5">
        <DashboardStatusBanner
          totalImages={totalImages}
          completedCount={coloringDisplayItems.length}
          processingCount={processingCount}
          retryingProcessing={retryingProcessing}
          onRetryStuck={retryStuckImages}
        />

        <section className="mt-3 space-y-3">
          <DashboardToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
            favoritesOnly={favoritesOnly}
            onFavoritesOnlyToggle={() => setFavoritesOnly(prev => !prev)}
            showLayoutSwitch={viewMode === 'coloring' && filteredColoringItems.length > 0}
          />

          {viewMode === 'coloring' ? (
            filteredColoringItems.length === 0 ? (
              <DashboardEmptyState
                variant="coloring"
                favoritesOnly={favoritesOnly}
                onShowAll={() => setFavoritesOnly(false)}
                onShowUploader={() => setShowUploader(true)}
              />
            ) : (
              <ColoringPageGrid
                items={filteredColoringItems}
                layoutMode={layoutMode}
                onColor={(image, coloringPageUrl) => setActiveDrawingImage({ ...image, coloring_page_url: coloringPageUrl })}
                onCollaborate={handleStartCollab}
                onToggleFavorite={toggleFavorite}
                onOpenVariants={setVariantsImage}
                onRegenerate={setRegenerateImage}
                onArchive={archiveImage}
              />
            )
          ) : filteredUploads.length === 0 ? (
            <DashboardEmptyState
              variant="uploads"
              favoritesOnly={favoritesOnly}
              onShowAll={() => setFavoritesOnly(false)}
              onShowUploader={() => setShowUploader(true)}
            />
          ) : (
            <UploadGrid
              images={filteredUploads}
              renamingImageId={renamingImageId}
              onRename={renameImage}
              onOpenVariants={setVariantsImage}
              onOpenPromptRemix={setPromptRemixImage}
              onColor={(image) => setActiveDrawingImage(image)}
              onDownload={downloadColoringPage}
              onToggleFavorite={toggleFavorite}
              onRegenerate={setRegenerateImage}
              onArchive={archiveImage}
            />
          )}
        </section>

        <footer className="mt-6 pb-2 text-center text-xs font-semibold text-[#594144]/70">
          made with love by pierceboggan
        </footer>
      </main>

      {showUploader && (
        <UploaderModal
          onClose={() => setShowUploader(false)}
          onUploadComplete={() => {
            setShowUploader(false)
            refetch()
          }}
        />
      )}

      {showFamilyAlbumCreator && (
        <FamilyAlbumCreator
          images={images}
          onClose={() => setShowFamilyAlbumCreator(false)}
        />
      )}

      {showPhotobookCreator && (
        <PhotobookCreator
          images={images}
          onClose={() => setShowPhotobookCreator(false)}
        />
      )}

      {regenerateImage && (
        <RegenerateModal
          isOpen={true}
          onClose={() => setRegenerateImage(null)}
          imageId={regenerateImage.id}
          imageName={regenerateImage.name}
          currentColoringPageUrl={regenerateImage.coloring_page_url || ''}
          onRegenerateComplete={(regeneratedUrl) => {
            setImages(prev =>
              prev.map(img =>
                img.id === regenerateImage.id
                  ? { ...img, coloring_page_url: regeneratedUrl }
                  : img
              )
            )
            setRegenerateImage(null)
          }}
        />
      )}

      {activeDrawingImage && activeDrawingImage.coloring_page_url && !collabSession && (
        <ColoringCanvasModal
          imageUrl={activeDrawingImage.coloring_page_url}
          imageName={activeDrawingImage.name}
          onClose={() => setActiveDrawingImage(null)}
        />
      )}

      {collabSession && activeDrawingImage?.coloring_page_url && (
        <ColoringCanvasModal
          imageUrl={activeDrawingImage.coloring_page_url}
          imageName={activeDrawingImage.name}
          onClose={() => {
            endCollaborativeSession()
            setActiveDrawingImage(null)
          }}
          collaboration={collabSession}
        />
      )}

      {variantsImage && (
        <VariantsModal
          isOpen={true}
          onClose={() => setVariantsImage(null)}
          imageId={variantsImage.id}
          imageName={variantsImage.name}
          originalUrl={variantsImage.original_url}
          variants={getVariantSummaries(variantsImage)}
          onVariantsUpdated={(updatedVariants) => {
            const imageId = variantsImage.id
            const urls = updatedVariants.map(variant => variant.url)
            const prompts = updatedVariants.map(variant => variant.prompt)

            setImages(prev =>
              prev.map(img =>
                img.id === imageId
                  ? { ...img, variant_urls: urls, variant_prompts: prompts }
                  : img
              )
            )

            setVariantsImage(prev =>
              prev ? { ...prev, variant_urls: urls, variant_prompts: prompts } : prev
            )
          }}
          onUseVariant={async (variantUrl) => {
            await applyVariantAsPrimary(variantsImage, variantUrl)
            setVariantsImage(prev =>
              prev ? { ...prev, coloring_page_url: variantUrl } : prev
            )
          }}
        />
      )}

      {promptRemixImage && (
        <PromptRemixModal
          isOpen={true}
          onClose={() => setPromptRemixImage(null)}
          imageName={promptRemixImage.name}
          imageUrl={promptRemixImage.original_url}
        />
      )}
    </div>
  )
}
