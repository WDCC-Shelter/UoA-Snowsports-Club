import MapPinGrid from "@/components/composite/MapPins/MapPinGrid/MapPinGrid"
import type { AdminMapPin } from "@/models/MapPin"

export interface IAdminMapPinsView {
  pins: AdminMapPin[]
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onDelete: (id: string) => void
  deletingId?: string
}

/**
 * Lists the latest map pins, newest first, so admins can remove inappropriate ones
 */
const AdminMapPinsView = ({
  pins,
  isLoading,
  hasMore,
  onLoadMore,
  onDelete,
  deletingId
}: IAdminMapPinsView) => {
  if (!isLoading && pins.length === 0) {
    return <p className="text-dark-blue-100">No pins have been posted yet.</p>
  }

  return (
    <div className="flex w-full max-w-[1200px] flex-col items-center gap-4 px-4">
      <MapPinGrid
        pins={pins}
        canDelete
        onDelete={onDelete}
        deletingId={deletingId}
        renderDetails={(pin) => (
          <span className="text-gray-4 w-64 break-all text-xs">
            Uploaded by {pin.uploader_id}
          </span>
        )}
      />
      {isLoading && <p className="text-dark-blue-100">Loading...</p>}
      {hasMore && !isLoading && (
        <button
          type="button"
          onClick={onLoadMore}
          className="text-dark-blue-100 font-bold underline"
        >
          Load more
        </button>
      )}
    </div>
  )
}

export default AdminMapPinsView
