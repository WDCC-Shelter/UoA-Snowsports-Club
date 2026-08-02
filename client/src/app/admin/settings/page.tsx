"use client"

import { type FormEvent, useEffect, useState } from "react"
import { AdminHeading } from "@/app/admin/AdminHeading"
import Button from "@/components/generic/ReusableButtons/Button"
import TextInput from "@/components/generic/TextInputComponent/TextInput"
import { useUpdateMailConfigMutation } from "@/services/Admin/AdminMutations"
import { useMailConfigQuery } from "@/services/Admin/AdminQueries"

export default function AdminSettingsPage() {
  const { data: mailConfig, isLoading } = useMailConfigQuery()
  const { mutate: updateMailConfig, isPending } = useUpdateMailConfigMutation()

  const [custodianName, setCustodianName] = useState("")
  const [doorCode, setDoorCode] = useState("")

  // Populate the form once the current config has loaded
  useEffect(() => {
    if (mailConfig) {
      setCustodianName(mailConfig.custodianName ?? "")
      setDoorCode(mailConfig.doorCode ?? "")
    }
  }, [mailConfig])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateMailConfig({ custodianName, doorCode })
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <AdminHeading title="Email Settings" />
      <p className="text-dark-blue-60 text-sm">
        These values are injected into the booking confirmation email.
      </p>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextInput
          id="custodianName"
          label="Custodian Name"
          description="The current lodge custodian's name"
          value={custodianName}
          disabled={isLoading}
          onChange={(e) => setCustodianName(e.target.value)}
        />
        <TextInput
          id="doorCode"
          label="Door Code"
          description="The code used to enter the lodge"
          value={doorCode}
          disabled={isLoading}
          onChange={(e) => setDoorCode(e.target.value)}
        />
        <div>
          <Button
            variant="small"
            props={{ type: "submit", disabled: isLoading || isPending }}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  )
}
