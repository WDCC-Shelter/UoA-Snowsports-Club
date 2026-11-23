import dynamic from "next/dynamic"
import { useCallback, useMemo, useState } from "react"
import type { AdminMapPin } from "@/models/MapPin"
import {
  useApproveMapPinMutation,
  useDeleteMapPinMutation,
  useEditMapPinMutation
} from "@/services/MapPin/MapPinMutations"
import {
  useFlaggedMapPinsAdminQuery,
  useLatestMapPinsAdminQuery
} from "@/services/MapPin/MapPinQueries"
import AdminMapPinsView from "./AdminMapPinsView"
import EditMapPinForm from "./EditMapPinForm/EditMapPinForm"

// MapLibre needs `window`, so can't be rendered during static export
const LocationPicker = dynamic(
  () => import("@/components/composite/MapPins/LocationPicker/LocationPicker"),
  { ssr: false }
)

const WrappedAdminMapPinsView = () => {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useLatestMapPinsAdminQuery()
  const { data: flaggedPins } = useFlaggedMapPinsAdminQuery()
  const { mutate: deletePin } = useDeleteMapPinMutation()
  const { mutate: approvePin } = useApproveMapPinMutation()
  const [deletingId, setDeletingId] = useState<string>()
  const [approvingId, setApprovingId] = useState<string>()
  const [editingPin, setEditingPin] = useState<AdminMapPin>()
  const {
    mutate: editPin,
    isPending: isSaving,
    error: editError,
    reset: resetEdit
  } = useEditMapPinMutation()

  const closeEdit = useCallback(() => {
    setEditingPin(undefined)
    resetEdit()
  }, [resetEdit])

  const pins = useMemo(
    () => data?.pages.flatMap((page) => page.data || []) || [],
    [data]
  )

  const onDelete = useCallback(
    (id: string) => {
      if (!window.confirm("Delete this pin? This can't be undone.")) return
      setDeletingId(id)
      deletePin(id, {
        onError: () => window.alert("Failed to delete the pin"),
        onSettled: () => setDeletingId(undefined)
      })
    },
    [deletePin]
  )

  const onApprove = useCallback(
    (id: string) => {
      setApprovingId(id)
      approvePin(id, {
        onError: () => window.alert("Failed to approve the pin"),
        onSettled: () => setApprovingId(undefined)
      })
    },
    [approvePin]
  )

  return (
    <>
      <AdminMapPinsView
        onEdit={setEditingPin}
        pins={pins}
        flaggedPins={flaggedPins}
        onApprove={onApprove}
        approvingId={approvingId}
        isLoading={isLoading || isFetchingNextPage}
        hasMore={hasNextPage}
        onLoadMore={() => fetchNextPage()}
        onDelete={onDelete}
        deletingId={deletingId}
      />
      {editingPin && (
        <EditMapPinForm
          // Remount for each pin so the form starts from that pin's values
          key={editingPin.id}
          pin={editingPin}
          renderLocationPicker={(value, onChange) => (
            <LocationPicker value={value} onChange={onChange} />
          )}
          onSave={(changes) =>
            editPin({ id: editingPin.id, changes }, { onSuccess: closeEdit })
          }
          onCancel={closeEdit}
          isSaving={isSaving}
          error={
            editError ? "Failed to save the pin, please try again." : undefined
          }
        />
      )}
    </>
  )
}

export default WrappedAdminMapPinsView
