"use client"

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react"

type FacingMode = "environment" | "user"

type CameraStatus = "starting" | "ready" | "unavailable"

export interface ICameraCapture {
  /**
   * Called with the photo taken, or the file chosen from the library
   */
  onCapture: (photo: Blob) => void
}

/**
 * Ideal width of photos taken with the camera, they are resized before upload anyway
 */
const IDEAL_CAPTURE_WIDTH = 1920

const ChooseFromLibraryButton = ({
  onChange,
  prominent
}: {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  prominent?: boolean
}) => (
  <label
    className={
      prominent
        ? "bg-dark-blue-100 cursor-pointer rounded-md px-6 py-3 font-bold uppercase text-white"
        : "cursor-pointer rounded-md bg-white/20 px-3 py-2 text-sm font-bold text-white"
    }
  >
    Choose from library
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={onChange}
    />
  </label>
)

/**
 * Full screen camera viewfinder for taking a photo of a pin. Always offers
 * choosing a photo from the library, and falls back to only that if there is
 * no camera or permission was denied.
 */
const CameraCapture = ({ onCapture }: ICameraCapture) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<CameraStatus>("starting")
  const [facingMode, setFacingMode] = useState<FacingMode>("environment")

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable")
      return
    }

    let stream: MediaStream | undefined
    let cancelled = false
    setStatus("starting")

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode, width: { ideal: IDEAL_CAPTURE_WIDTH } },
        audio: false
      })
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }
        stream = mediaStream
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
        setStatus("ready")
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable")
      })

    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [facingMode])

  const takePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob)
      },
      "image/jpeg",
      0.92
    )
  }, [onCapture])

  const onFileChosen = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) onCapture(file)
      // Allow choosing the same file again
      event.target.value = ""
    },
    [onCapture]
  )

  if (status === "unavailable") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-black p-8 text-center text-white">
        <p>
          The camera isn&apos;t available. Choose a photo of a sticker or
          members instead.
        </p>
        <ChooseFromLibraryButton onChange={onFileChosen} prominent />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />
      {status === "starting" && (
        <p className="absolute inset-0 flex items-center justify-center text-white">
          Starting camera...
        </p>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-4 bg-black/40 px-6 py-6">
        <ChooseFromLibraryButton onChange={onFileChosen} />
        <button
          type="button"
          aria-label="Take photo"
          disabled={status !== "ready"}
          onClick={takePhoto}
          className="size-20 shrink-0 rounded-full border-4 border-white bg-white/80 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() =>
            setFacingMode((mode) =>
              mode === "environment" ? "user" : "environment"
            )
          }
          className="rounded-md bg-white/20 px-3 py-2 text-sm font-bold text-white"
        >
          Flip
        </button>
      </div>
    </div>
  )
}

export default CameraCapture
