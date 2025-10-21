import CardReminderMail from '@/components/mail-templates/card-reminder-mail'
import prisma from '@/prisma/prisma'
import jobService from '@/services/job.service'
import mailService from '@/services/mail.service'
import { render } from '@react-email/render'
import { format, parseISO } from 'date-fns'
import { cardReminderSchema, CardReminderSchema } from './validations'

export const cardReminderJob = jobService.createJob('send-card-reminder', async (payload: CardReminderSchema) => {
  const result = cardReminderSchema.safeParse(payload)
  if (!result.success) return

  const { boardId, cardId, endDate } = result.data

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      list: {
        include: {
          board: { select: { id: true, name: true, slug: true } }
        }
      },
      assignees: { select: { user: { select: { email: true } } } },
      watchers: { select: { user: { select: { email: true } } } }
    }
  })

  if (!card) return

  const board = card.list.board
  if (!board || board.id !== boardId) return

  const emails = [...card.assignees.map((a) => a.user.email), ...card.watchers.map((w) => w.user.email)].filter(Boolean)

  if (emails.length === 0) return

  const html = await render(
    CardReminderMail({
      boardName: board.name,
      cardTitle: card.title,
      endDate: format(parseISO(endDate), "d 'tháng' M, 'năm' yyyy 'lúc' HH:mm"),
      // TODO: replace with production URL
      cardUrl: `http://localhost:3000/b/${board.slug}/c/${card.slug}`
    })
  )

  await mailService.sendEmails({
    payload: {
      from: 'Trello Clone <system@mail.dahn.work>',
      to: emails,
      subject: `Thẻ ${card.title} trong bảng ${board.name} sắp hết hạn`,
      html
    }
  })
})
