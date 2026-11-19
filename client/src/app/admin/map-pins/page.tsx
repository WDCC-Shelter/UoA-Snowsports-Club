"use client"

import WrappedAdminMapPinsView from "@/components/composite/Admin/AdminMapPinsView/WrappedAdminMapPinsView"
import { AdminHeading } from "../AdminHeading"

export default function AdminMapPinsPage() {
  return (
    <>
      <AdminHeading title="Map pins" />
      <WrappedAdminMapPinsView />
    </>
  )
}
