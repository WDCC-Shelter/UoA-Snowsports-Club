import {
  EMULATOR_AUTH_PORT,
  EMULATOR_FIRESTORE_PORT,
  EMULATOR_HOST,
  EMULATOR_STORAGE_BUCKET,
  EMULATOR_STORAGE_PORT
} from "data-layer/adapters/EmulatorConfig"
import * as _admin from "firebase-admin"

const IS_JEST = process.env.JEST_WORKER_ID !== undefined

const keysEnvVar = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

if (!keysEnvVar && !IS_JEST) {
  throw new Error("The service account environment variable was not found!")
}

const keys = JSON.parse(keysEnvVar ?? "{}")

if (IS_JEST) {
  process.env.FIRESTORE_EMULATOR_HOST = `${EMULATOR_HOST}:${EMULATOR_FIRESTORE_PORT}`
  process.env.FIRESTORE_AUTH_EMULATOR_HOST = `${EMULATOR_HOST}:${EMULATOR_AUTH_PORT}`
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${EMULATOR_HOST}:${EMULATOR_STORAGE_PORT}`
  process.env.STORAGE_EMULATOR_HOST = `http://${EMULATOR_HOST}:${EMULATOR_STORAGE_PORT}`
}

/**
 * The Firebase Storage bucket used for user uploaded images (e.g. map pins)
 */
const storageBucket = IS_JEST
  ? EMULATOR_STORAGE_BUCKET
  : process.env.FIREBASE_STORAGE_BUCKET

const firebase = _admin.initializeApp(
  Object.keys(keys).length > 0
    ? {
        credential: _admin.credential.cert(keys),
        storageBucket
      }
    : { storageBucket }
)

export const admin = _admin

export const auth = firebase.auth()

export const storage = firebase.storage()
