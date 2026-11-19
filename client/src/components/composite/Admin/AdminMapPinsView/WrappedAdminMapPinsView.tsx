import { useCallback, useMemo, useState } from "react"
import { useDeleteMapPinMutation } from "@/services/MapPin/MapPinMutations"
import { useLatestMapPinsAdminQuery } from "@/services/MapPin/MapPinQueries"
import AdminMapPinsView from "./AdminMapPinsView"

const WrappedAdminMapPinsView = () => {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useLatestMapPinsAdminQuery()
  const { mutate: deletePin } = useDeleteMapPinMutation()
  const [deletingId, setDeletingId] = useState<string>()

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

  return (
    <AdminMapPinsView
      pins={pins}
      isLoading={isLoading || isFetchingNextPage}
      hasMore={hasNextPage}
      onLoadMore={() => fetchNextPage()}
      onDelete={onDelete}
      deletingId={deletingId}
    />
  )
}

export default WrappedAdminMapPinsView
