import { storage } from "@/firebase"
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes
} from "firebase/storage"

// https://stackoverflow.com/a/19842865
const uid = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * Folder map pin images are uploaded to, must match `storage.rules` and the server
 */
const MAP_PIN_IMAGE_FOLDER = "map-pins"

const StorageService = {
  /**
   * Uploads the photo for a new map pin to the member's own folder
   *
   * @returns the id of the image, used to create the pin
   */
  uploadMapPinImage: async (uploaderId: string, image: Blob) => {
    const imageId = crypto.randomUUID()
    const imageRef = storageRef(
      storage,
      `${MAP_PIN_IMAGE_FOLDER}/${uploaderId}/${imageId}`
    )
    await uploadBytes(imageRef, image, {
      contentType: image.type,
      cacheControl: "public, max-age=31536000, immutable"
    })
    return imageId
  },
  uploadEventImage: async (file: File) => {
    if (file === null) {
      return
    }

    try {
      const imageRef = storageRef(storage, `event-images/${uid()}`)
      const snapshot = await uploadBytes(imageRef, file)
      const url = getDownloadURL(snapshot.ref)

      return url
    } catch (e) {
      console.error("failed to upload image", e)
      return undefined
    }
  }
}

export default StorageService
