import dynamic from "next/dynamic"
import Link from "next/link"
import { useCallback, useState } from "react"
import MapPinGrid from "@/components/composite/MapPins/MapPinGrid/MapPinGrid"
import ProfileInformationPanel from "@/components/generic/ProfileInformationPanel/ProfileInformationPanel"
import { useDeleteMapPinMutation } from "@/services/MapPin/MapPinMutations"
import { useOwnMapPinsQuery } from "@/services/MapPin/MapPinQueries"

// MapLibre needs `window`, so can't be rendered during static export
const PinMap = dynamic(
  () => import("@/components/composite/MapPins/PinMap/PinMap"),
  { ssr: false }
)

export interface IMyMapPinsPanel {
  /**
   * Whether the user can still manage their pins (i.e is a member or admin)
   */
  canDelete: boolean
}

/**
 * Overview of the pins the current user has posted
 */
const MyMapPinsPanel = ({ canDelete }: IMyMapPinsPanel) => {
  const { data: pins, isLoading } = useOwnMapPinsQuery()
  const { mutate: deletePin } = useDeleteMapPinMutation()
  const [deletingId, setDeletingId] = useState<string>()

  const onDelete = useCallback(
    (id: string) => {
      if (!window.confirm("Delete this pin? This can't be undone.")) return
      setDeletingId(id)
      deletePin(id, { onSettled: () => setDeletingId(undefined) })
    },
    [deletePin]
  )

  return (
    <ProfileInformationPanel title="My pins">
      {isLoading ? (
        <p>Loading...</p>
      ) : !pins?.length ? (
        <p>
          You haven&apos;t posted any pins yet.{" "}
          <Link href="/map" className="text-dark-blue-100 underline">
            View the map
          </Link>
        </p>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <div className="border-gray-3 h-64 w-full overflow-hidden rounded-md border">
            <PinMap pins={pins} showGeolocate={false} />
          </div>
          <MapPinGrid
            pins={pins}
            canDelete={canDelete}
            onDelete={onDelete}
            deletingId={deletingId}
            renderDetails={(pin) =>
              pin.moderation_status === "flagged" && (
                <span className="text-red w-64 text-xs">
                  Hidden from the map until an admin reviews it
                </span>
              )
            }
          />
        </div>
      )}
    </ProfileInformationPanel>
  )
}

export default MyMapPinsPanel
