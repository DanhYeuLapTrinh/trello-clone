import { Body, Container, Head, Html, Preview, Section, Tailwind, Text } from '@react-email/components'

interface CardExpiryEmailProps {
  boardName: string
  cardTitle: string
  endDate: string
  cardUrl: string
}

export default function CardExpiryEmail({ boardName, cardTitle, endDate, cardUrl }: CardExpiryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        ⏰ Thẻ &quot;{cardTitle}&quot; trên {boardName} sẽ hết hạn vào {endDate}!
      </Preview>
      <Tailwind>
        <Body className='bg-gray-50 font-sans'>
          <Section className='py-12'>
            <Container className='mx-auto max-w-md rounded-2xl bg-white p-8 shadow'>
              <Section>
                <Text className='text-xl font-semibold text-gray-900 mb-3'>⏰ Thẻ sắp hết hạn</Text>
                <Text className='text-sm leading-6 text-gray-700'>
                  Thẻ <span className='font-medium'>{cardTitle}</span> trong bảng{' '}
                  <span className='font-medium'>{boardName}</span> sẽ hết hạn vào{' '}
                  <span className='font-semibold'>{endDate}</span>.
                </Text>
                <Text className='text-sm leading-6 text-gray-700 mt-2'>
                  Vui lòng xem lại hoặc cập nhật thẻ trước khi hết hạn.
                </Text>
                <a
                  href={cardUrl}
                  className='inline-block mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white no-underline'
                >
                  Xem Thẻ
                </a>
              </Section>
              <Text className='mt-8 text-center text-xs text-gray-400'>
                Trello Clone • Giữ vững tiến độ công việc của bạn
              </Text>
            </Container>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  )
}
