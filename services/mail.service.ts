import { CreateEmailOptions, CreateEmailRequestOptions, Resend } from 'resend'

class MailService {
  private resend: Resend

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  public sendEmails({ payload, options }: { payload: CreateEmailOptions; options?: CreateEmailRequestOptions }) {
    return this.resend.emails.send(payload, options)
  }
}

const mailService = new MailService()
export default mailService
