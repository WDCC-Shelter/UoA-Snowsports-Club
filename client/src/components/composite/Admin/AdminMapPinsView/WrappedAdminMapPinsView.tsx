import { useCallback, useMemo, useState } from "react"
import {
  useApproveMapPinMutation,
  useDeleteMapPinMutation
} from "@/services/MapPin/MapPinMutations"
import {
  useFlaggedMapPinsAdminQuery,
  useLatestMapPinsAdminQuery
} from "@/services/MapPin/MapPinQueries"
import AdminMapPinsView from "./AdminMapPinsView"

const WrappedAdminMapPinsView = () => {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useLatestMapPinsAdminQuery()
  const { data: flaggedPins } = useFlaggedMapPinsAdminQuery()
  const { mutate: deletePin } = useDeleteMapPinMutation()
  const { mutate: approvePin } = useApproveMapPinMutation()
  const [deletingId, setDeletingId] = useState<string>()
  const [approvingId, setApprovingId] = useState<string>()

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
    <AdminMapPinsView
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
  )
}

export default WrappedAdminMapPinsView
