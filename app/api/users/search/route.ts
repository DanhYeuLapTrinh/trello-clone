import { getMe } from '@/features/users/actions'
import prisma from '@/prisma/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    await getMe()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const boardSlug = searchParams.get('boardSlug')

    if (!query || !boardSlug || query.trim().length === 0) {
      return NextResponse.json([])
    }

    const board = await prisma.board.findUnique({
      where: {
        slug: boardSlug
      }
    })

    if (!board) {
      return NextResponse.json([])
    }

    const members = await prisma.boardMember.findMany({
      where: {
        boardId: board.id
      }
    })

    const memberIds = Array.from(new Set([...members.map((member) => member.userId), board.ownerId]))

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ],
        NOT: {
          id: { in: memberIds }
        }
      },
      take: 5
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}
