import { useSignUpFormData } from "@/store/SignUpForm"
import TextInput from "@/components/generic/TextInputComponent/TextInput"

export const ContactSection = () => {
  const [
    {
      emergency_contact,
      email,
      confirmEmail,
      password,
      confirmPassword,
      phone_number
    },
    { updateFormData }
  ] = useSignUpFormData()

  return (
    <div className="flex max-w-sm flex-col gap-5">
      <TextInput
        type="email"
        label="Email"
        id="Email"
        defaultValue={email}
        onChange={(e) => updateFormData({ email: e.target.value })}
        placeholder="email@domain.com"
        required
      />
      <TextInput
        type="email"
        label="Confirm Email"
        id="ConfirmEmail"
        defaultValue={confirmEmail}
        onChange={(e) => updateFormData({ confirmEmail: e.target.value })}
        placeholder="email@domain.com"
        required
      />
      <TextInput
        type="password"
        label="Password"
        description="You'll use this with your email to log in. At least 8 characters, with a number, a lowercase and an uppercase letter"
        id="Password"
        autoComplete="new-password"
        defaultValue={password}
        onChange={(e) => updateFormData({ password: e.target.value })}
        required
      />
      <TextInput
        type="password"
        label="Confirm Password"
        id="ConfirmPassword"
        autoComplete="new-password"
        defaultValue={confirmPassword}
        onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
        required
      />
      <TextInput
        type="tel"
        label="Mobile Number"
        id="MobileNumber"
        onChange={(e) =>
          updateFormData({ phone_number: Number.parseInt(e.target.value) })
        }
        defaultValue={phone_number}
        placeholder="000 000 0000"
        required
      />
      <TextInput
        type="text"
        label="Emergency contact info"
        description="Name, relationship to you, their mobile number"
        id="EmergencyContactInfo"
        defaultValue={emergency_contact}
        onChange={(e) => {
          updateFormData({ emergency_contact: e.target.value })
        }}
        required
      />
    </div>
  )
}
