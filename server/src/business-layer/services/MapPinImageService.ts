import { storage } from "business-layer/security/Firebase"

/**
 * Folder in Firebase Storage that map pin images are uploaded to.
 *
 * Must be kept in sync with `storage.rules`
 */
export const MAP_PIN_IMAGE_FOLDER = "map-pins"

/**
 * Allowed format for the id of an uploaded image (and therefore the id of the pin)
 */
export const MAP_PIN_IMAGE_ID_REGEX = /^[A-Za-z0-9_-]{8,64}$/

/**
 * Handles the images for map pins, which are uploaded directly to Firebase Storage
 * by the client before the pin is created
 */
export default class MapPinImageService {
  /**
   * The path of a pin's image. Members can only upload into their own folder,
   * so building the path from the uid means a member can't claim someone else's image.
   */
  public static imagePathFor(uploaderId: string, imageId: string) {
    return `${MAP_PIN_IMAGE_FOLDER}/${uploaderId}/${imageId}`
  }

  /**
   * The public URL of an image. Map pin images are publicly readable (see `storage.rules`)
   * so no download token is needed.
   */
  public static publicUrlFor(imagePath: string) {
    const bucket = storage.bucket().name
    const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST
      ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`
      : "https://firebasestorage.googleapis.com"
    return `${host}/v0/b/${bucket}/o/${encodeURIComponent(imagePath)}?alt=media`
  }

  /**
   * Checks whether an image has been uploaded to the given path
   */
  public async imageExists(imagePath: string): Promise<boolean> {
    const [exists] = await storage.bucket().file(imagePath).exists()
    return exists
  }

  /**
   * Deletes an image, doing nothing if it doesn't exist
   */
  public async deleteImage(imagePath: string) {
    await storage.bucket().file(imagePath).delete({ ignoreNotFound: true })
  }
}
