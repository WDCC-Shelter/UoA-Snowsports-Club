import MapPinGrid from "@/components/composite/MapPins/MapPinGrid/MapPinGrid"
import type { AdminMapPin } from "@/models/MapPin"

export interface IAdminMapPinsView {
  pins: AdminMapPin[]
  /**
   * Pins hidden by the automatic check, waiting for review
   */
  flaggedPins?: AdminMapPin[]
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onDelete: (id: string) => void
  deletingId?: string
  onApprove?: (id: string) => void
  approvingId?: string
}

type SafeSearch = NonNullable<AdminMapPin["safe_search"]>

const SAFE_SEARCH_LABELS: Partial<Record<keyof SafeSearch, string>> = {
  adult: "Adult",
  racy: "Racy",
  violence: "Violence"
}

const NOTABLE_LIKELIHOODS = ["POSSIBLE", "LIKELY", "VERY_LIKELY"]

/**
 * Summarises why the automatic check flagged a photo, i.e `Adult: likely`
 */
export const describeSafeSearch = (safeSearch?: SafeSearch) => {
  if (!safeSearch) return undefined
  const notable = (
    Object.entries(SAFE_SEARCH_LABELS) as [keyof SafeSearch, string][]
  )
    .filter(([category]) => NOTABLE_LIKELIHOODS.includes(safeSearch[category]))
    .map(
      ([category, label]) =>
        `${label}: ${safeSearch[category].toLowerCase().replace("_", " ")}`
    )
  return notable.length ? notable.join(", ") : undefined
}

const STATUS_LABELS: Record<AdminMapPin["moderation_status"], string> = {
  pending: "Not checked yet",
  approved: "Approved",
  flagged: "Hidden, needs review"
}

/**
 * Lists pins hidden by the automatic check for review, then the latest map pins,
 * newest first, so admins can remove inappropriate ones
 */
const AdminMapPinsView = ({
  pins,
  flaggedPins = [],
  isLoading,
  hasMore,
  onLoadMore,
  onDelete,
  deletingId,
  onApprove,
  approvingId
}: IAdminMapPinsView) => {
  return (
    <div className="flex w-full max-w-[1200px] flex-col items-center gap-8 px-4">
      {flaggedPins.length > 0 && (
        <section className="flex w-full flex-col gap-4">
          <h3 className="text-dark-blue-100">
            Needs review ({flaggedPins.length})
          </h3>
          <p className="text-gray-4 text-sm">
            These were hidden from the map by the automatic check. Approve them
            to show them again, or delete them.
          </p>
          <MapPinGrid
            pins={flaggedPins}
            canDelete
            onDelete={onDelete}
            deletingId={deletingId}
            renderDetails={(pin) => (
              <div className="flex w-64 flex-col gap-1">
                {describeSafeSearch(pin.safe_search) && (
                  <span className="text-red text-xs">
                    {describeSafeSearch(pin.safe_search)}
                  </span>
                )}
                <span className="text-gray-4 break-all text-xs">
                  Uploaded by {pin.uploader_id}
                </span>
                <button
                  type="button"
                  disabled={approvingId === pin.id}
                  onClick={() => onApprove?.(pin.id)}
                  className="text-dark-blue-100 self-start text-sm font-bold underline disabled:opacity-50"
                >
                  {approvingId === pin.id ? "Approving..." : "Approve pin"}
                </button>
              </div>
            )}
          />
        </section>
      )}

      <section className="flex w-full flex-col items-center gap-4">
        {flaggedPins.length > 0 && (
          <h3 className="text-dark-blue-100 self-start">Latest pins</h3>
        )}
        {!isLoading && pins.length === 0 ? (
          <p className="text-dark-blue-100">No pins have been posted yet.</p>
        ) : (
          <MapPinGrid
            pins={pins}
            canDelete
            onDelete={onDelete}
            deletingId={deletingId}
            renderDetails={(pin) => (
              <div className="flex w-64 flex-col gap-1">
                <span
                  className={`text-xs ${pin.moderation_status === "flagged" ? "text-red" : "text-gray-4"}`}
                >
                  {STATUS_LABELS[pin.moderation_status]}
                </span>
                <span className="text-gray-4 break-all text-xs">
                  Uploaded by {pin.uploader_id}
                </span>
              </div>
            )}
          />
        )}
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
      </section>
    </div>
  )
}

export default AdminMapPinsView
