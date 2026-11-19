"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import CameraCapture from "@/components/composite/MapPins/CameraCapture/CameraCapture"
import NewPinDetailsForm from "@/components/composite/MapPins/NewPinDetailsForm/NewPinDetailsForm"
import Loader from "@/components/generic/SuspenseComponent/Loader"
import type { MapPinType } from "@/models/MapPin"
import {
  type GpsLocation,
  prepareMapPinImage,
  readExifGps
} from "@/services/MapPin/ImageUtils"
import { useCreateMapPinMutation } from "@/services/MapPin/MapPinMutations"
import { mapPinHref } from "@/services/MapPin/MapPinUtils"
import { useAppData } from "@/store/Store"

// MapLibre needs `window`, so can't be rendered during static export
const LocationPicker = dynamic(
  () => import("@/components/composite/MapPins/LocationPicker/LocationPicker"),
  { ssr: false, loading: () => <Loader /> }
)

type LocationSource = "photo" | "device" | "map"

const GEOLOCATION_TIMEOUT_MS = 10_000

const getCurrentPosition = () =>
  new Promise<GpsLocation>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location isn't supported on this device"))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
      () => reject(new Error("Couldn't get your location")),
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS }
    )
  })

/**
 * Shown to anyone who can't post pins
 */
const NotAllowed = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <div className="flex h-[calc(100dvh-51px)] flex-col items-center justify-center gap-4 p-8 text-center">
    <p className="text-dark-blue-100">Only members can upload pins.</p>
    {!isLoggedIn && (
      <Link href="/login" className="text-dark-blue-100 font-bold underline">
        Log in
      </Link>
    )}
    <Link href="/map" className="text-dark-blue-100 underline">
      Back to the map
    </Link>
  </div>
)

const NewMapPinPage = () => {
  const router = useRouter()
  const [{ currentUser, currentUserClaims }] = useAppData()
  const canPost = !!currentUserClaims?.member || !!currentUserClaims?.admin

  const [photo, setPhoto] = useState<Blob>()
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [location, setLocation] = useState<GpsLocation>()
  const [locationSource, setLocationSource] = useState<LocationSource>()
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string>()
  const [type, setType] = useState<MapPinType>("sticker")
  const [caption, setCaption] = useState("")
  const [error, setError] = useState<string>()

  const { mutateAsync: createPin, isPending: isSubmitting } =
    useCreateMapPinMutation()

  // Release the preview when it's replaced or the page is left
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const locateDevice = useCallback(async () => {
    setIsLocating(true)
    setLocationError(undefined)
    try {
      setLocation(await getCurrentPosition())
      setLocationSource("device")
    } catch (e) {
      setLocationError((e as Error).message)
    } finally {
      setIsLocating(false)
    }
  }, [])

  const onCapture = useCallback(
    async (captured: Blob) => {
      setError(undefined)
      setPhoto(captured)
      setPreviewUrl(URL.createObjectURL(captured))

      // Photos from the library may have been taken elsewhere, so prefer where
      // the photo says it was taken over where the member is now
      const fromPhoto = readExifGps(await captured.arrayBuffer())
      if (fromPhoto) {
        setLocation(fromPhoto)
        setLocationSource("photo")
      } else {
        locateDevice()
      }
    },
    [locateDevice]
  )

  const onRetake = useCallback(() => {
    setPhoto(undefined)
    setPreviewUrl(undefined)
    setLocation(undefined)
    setLocationSource(undefined)
    setLocationError(undefined)
    setError(undefined)
  }, [])

  const onSubmit = useCallback(async () => {
    if (!photo || !location || !currentUser) return
    setError(undefined)

    let image: Blob
    try {
      image = await prepareMapPinImage(photo)
    } catch {
      setError("Couldn't read that photo, try taking or choosing another one.")
      return
    }

    try {
      const pin = await createPin({
        uploaderId: currentUser.uid,
        image,
        type,
        caption: caption.trim() || undefined,
        ...location
      })
      router.push(mapPinHref(pin))
    } catch {
      setError("Something went wrong posting your pin, please try again.")
    }
  }, [photo, location, currentUser, createPin, type, caption, router])

  if (!canPost) {
    return <NotAllowed isLoggedIn={!!currentUser} />
  }

  if (!photo || !previewUrl) {
    return (
      <div className="h-[calc(100dvh-51px)] w-full">
        <CameraCapture onCapture={onCapture} />
      </div>
    )
  }

  return (
    <NewPinDetailsForm
      previewUrl={previewUrl}
      locationPicker={
        <LocationPicker
          value={location}
          onChange={(picked) => {
            setLocation(picked)
            setLocationSource("map")
            setLocationError(undefined)
          }}
        />
      }
      hasLocation={!!location}
      locationSource={locationSource}
      onUseCurrentLocation={locateDevice}
      isLocating={isLocating}
      locationError={locationError}
      type={type}
      onTypeChange={setType}
      caption={caption}
      onCaptionChange={setCaption}
      onRetake={onRetake}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      error={error}
    />
  )
}

export default NewMapPinPage
