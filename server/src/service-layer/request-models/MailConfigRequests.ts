import type { MailConfig } from "../../data-layer/models/MailConfig"

/**
 * The subset of {@link MailConfig} fields that can be edited through the
 * admin mail configuration endpoint.
 *
 * Restricting the request body to these fields prevents extra properties
 * (such as the sensitive `password`, or `email`/`fromHeader`) that are
 * returned by the GET endpoint from being echoed back and rejected by the
 * request validator.
 */
export type EditableMailConfig = Pick<MailConfig, "custodianName" | "doorCode">

export interface UpdateMailConfigRequestBody {
  /**
   * The updated mail configuration settings
   */
  config: EditableMailConfig
}

export interface UpdateEmailTemplateRequestBody {
  /**
   * The template ID
   * @example "booking_confirmation"
   */
  id: string

  /**
   * The template name
   * @example "Booking Confirmation"
   */
  name: string

  /**
   * The template content in Pug format
   */
  content: string

  /**
   * An optional description of the template's purpose
   */
  description?: string
}
