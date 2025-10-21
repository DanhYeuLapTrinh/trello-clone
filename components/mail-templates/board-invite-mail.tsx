import { Body, Container, Head, Html, Preview, Section, Tailwind, Text } from '@react-email/components'

interface BoardInviteEmailProps {
  inviterName: string
  boardName: string
  boardUrl: string
  description: string
}

export default function BoardInviteEmail({ inviterName, boardName, boardUrl, description }: BoardInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} đã mời bạn vào bảng {boardName} trên Trello Clone
      </Preview>
      <Tailwind>
        <Body className='bg-gray-50 font-sans'>
          <Section className='py-12'>
            <Container className='mx-auto max-w-md rounded-2xl bg-white p-8 shadow'>
              <Section>
                <Text className='text-xl font-bold text-gray-900 mb-3'>
                  {inviterName} đã mời bạn vào bảng của họ <span className='font-medium'>{boardName}</span>
                </Text>

                <Text className='text-sm leading-6 text-gray-700'>{description}</Text>

                <a
                  href={boardUrl}
                  className='inline-block mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white no-underline'
                >
                  Đến bảng
                </a>

                <Text className='text-sm leading-6 text-gray-700 mt-6'>
                  <span className='font-semibold'>Trello Clone</span> là công cụ siêu năng suất của bạn.
                </Text>

                <Text className='text-sm leading-6 text-gray-700 mt-2'>
                  Sắp xếp ngăn nắp và làm việc hiệu quả với <span className='font-medium'>Hộp thư đến</span>,{' '}
                  <span className='font-medium'>Bảng</span> và <span className='font-medium'>Trình lập kế hoạch</span>.
                  Mọi việc cần làm, ý tưởng hay trách nhiệm — dù nhỏ đến đâu — đều có chỗ đứng riêng, giúp bạn luôn đạt
                  phong độ đỉnh cao.
                </Text>

                <Text className='text-sm leading-6 text-gray-700 mt-3'>
                  <span className='font-medium'>Hộp thư đến:</span> Việc mà bạn lưu tâm sẽ nằm trong Hộp thư đến của
                  bạn. Nắm bắt việc cần làm mọi lúc, mọi nơi.
                </Text>

                <Text className='text-sm leading-6 text-gray-700 mt-2'>
                  <span className='font-medium'>Bảng:</span> Danh sách việc cần làm có thể dài, nhưng bạn sẽ làm được!
                  Theo dõi mọi thứ, từ “việc cần giải quyết” đến “nhiệm vụ đã hoàn thành”!
                </Text>

                <Text className='text-sm leading-6 text-gray-700 mt-2'>
                  <span className='font-medium'>Trình lập kế hoạch:</span> Kéo, thả, hoàn thành công việc. Lên lịch
                  trình cho việc cần làm nhất và bố trí thời gian cho những điều thực sự quan trọng.
                </Text>
              </Section>

              <Text className='mt-8 text-center text-xs text-gray-400'>
                Trello Clone • Làm việc hiệu quả hơn mỗi ngày
              </Text>
            </Container>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  )
}
