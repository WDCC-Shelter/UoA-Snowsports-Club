import { request } from "../routes.setup"
import { signupUserMock } from "test-config/mocks/User.mock"
import AuthService from "business-layer/services/AuthService"
import { auth } from "business-layer/security/Firebase"
import { StatusCodes } from "http-status-codes"

describe("SignupController endpoint tests", () => {
  describe("/signup", () => {
    it("should return a JWT token for guest /signup POST endpoint", async () => {
      const res = await request.post("/signup").send({
        email: "test@mail.com",
        password: "Password123",
        user: signupUserMock
      })
      expect(res.status).toEqual(StatusCodes.OK)
      // check if user custom claims exist
      const { uid } = res.body
      const claims = await new AuthService().getCustomerUserClaim(uid)
      expect(claims).toEqual(undefined)
    })
    it("should return a 409 conflict when an email is already in use", async () => {
      let res = await request.post("/signup").send({
        email: "test@mail.com",
        password: "Password123",
        user: signupUserMock
      })
      expect(res.status).toEqual(StatusCodes.OK)

      res = await request.post("/signup").send({
        email: "test@mail.com",
        password: "Password123",
        user: signupUserMock
      })
      // check for conflict
      expect(res.status).toEqual(StatusCodes.CONFLICT)
    })
    it("should return a jwtToken with no claims", async () => {
      const res = await request.post("/signup").send({
        email: "testadmin@mail.com",
        password: "Password123",
        user: signupUserMock
      })
      expect(res.status).toEqual(StatusCodes.OK)
      // check if user custom claims exist
      const claims = await new AuthService().getCustomerUserClaim(res.body.uid)
      expect(claims).toEqual(undefined)
    })
    it("should create the account with the provided password", async () => {
      const res = await request.post("/signup").send({
        email: "withpassword@mail.com",
        password: "Password123",
        user: signupUserMock
      })
      expect(res.status).toEqual(StatusCodes.OK)
      const userRecord = await auth.getUser(res.body.uid)
      expect(userRecord.providerData.map((p) => p.providerId)).toContain(
        "password"
      )
    })
    it("should reject sign ups without a password", async () => {
      const res = await request.post("/signup").send({
        email: "nopassword@mail.com",
        user: signupUserMock
      })
      expect(res.status).toEqual(StatusCodes.BAD_REQUEST)
      await expect(auth.getUserByEmail("nopassword@mail.com")).rejects.toThrow()
    })
    it("should reject passwords that do not meet the policy", async () => {
      const res = await request.post("/signup").send({
        email: "weakpassword@mail.com",
        password: "password",
        user: signupUserMock
      })
      expect(res.status).toEqual(StatusCodes.BAD_REQUEST)
      await expect(
        auth.getUserByEmail("weakpassword@mail.com")
      ).rejects.toThrow()
    })
  })
})
