/**
 * @jest-environment node
 */

import { sendDirectMessage } from '../../helpers/discordBot'

jest.mock('../../helpers/discordBot')

import prismaMock from '../../__tests__/utils/prismaMock'
import { addComment } from './addComment'
import {
  C0D3_ICON_URL,
  CURRICULUM_URL,
  getLessonCoverPNG,
  PRIMARY_COLOR_HEX,
  PROFILE_URL
} from '../../constants'
import { getDiscordMessageUserIdString } from '../../helpers/getDiscordMessageUserIdString'

const lessonMock = {
  id: 1,
  order: 1,
  title: 'Fake Lesson Title',
  slug: 'js1'
}

const userMock = {
  id: 1,
  username: 'fakeusername',
  discordId: 'fakeId'
}

const authorMock = {
  id: 2,
  name: 'Leet Coder',
  discordId: 'fakeAuthorId',
  username: 'leetcoder'
}

const submissionMock = {
  challenge: {
    id: 1,
    title: 'Fake challenge'
  },
  user: userMock,
  lesson: lessonMock
}

const mockAddCommentArgs = {
  line: 1,
  submissionId: 1,
  fileName: 'testFile.js',
  content: 'testing'
}

const mockCtx = { req: { user: { id: 1 } } }
describe('Add comment resolver', () => {
  test('should invoke prismaMock create', () => {
    const mockCommentCreate = {
      author: authorMock,
      submission: submissionMock,
      ...mockAddCommentArgs
    }
    prismaMock.comment.create.mockResolvedValue(mockCommentCreate)
    expect(addComment({}, mockAddCommentArgs, mockCtx)).resolves.toEqual(
      mockCommentCreate
    )
  })
  test('should throw error if no user.id in context', () => {
    expect(addComment({}, mockAddCommentArgs, { req: {} })).rejects.toEqual(
      new Error('No authorId field')
    )
  })
})

describe('Should send required discord notifications', () => {
  test('Should not notify if comment author and submission user are same', async () => {
    prismaMock.comment.create.mockResolvedValue({
      author: authorMock,
      submission: { ...submissionMock, user: authorMock }
    })
    await addComment({}, mockAddCommentArgs, mockCtx)
    expect(sendDirectMessage).not.toBeCalled()
  })
  test('Should not notify if user does not have discord id', async () => {
    prismaMock.comment.create.mockResolvedValue({
      author: authorMock,
      submission: { ...submissionMock, user: { ...userMock, discordId: null } }
    })
    await addComment({}, mockAddCommentArgs, mockCtx)
    expect(sendDirectMessage).not.toBeCalled()
  })
  test('Should send a message embed to user with comment notification', async () => {
    prismaMock.comment.create.mockResolvedValue({
      author: authorMock,
      submission: submissionMock,
      ...mockAddCommentArgs
    })
    await addComment({}, mockAddCommentArgs, mockCtx)
    const mockEmbed = {
      color: PRIMARY_COLOR_HEX,
      title: 'New comment on submission',
      url: `${CURRICULUM_URL}/${submissionMock.lesson.slug}`,
      thumbnail: {
        url: getLessonCoverPNG(submissionMock.lesson.order)
      },
      author: {
        name: authorMock.name,
        url: `${PROFILE_URL}/${authorMock.username}`,
        icon_url: C0D3_ICON_URL
      },
      description: `${getDiscordMessageUserIdString(
        authorMock
      )} commented on your submission to the challenge **${
        submissionMock.challenge.title
      }** on **Line ${mockAddCommentArgs.line}**.`,
      fields: [
        {
          name: 'Comment',
          value: mockAddCommentArgs.content
        }
      ]
    }

    expect(sendDirectMessage).toHaveBeenCalledWith(
      userMock.discordId,
      '',
      mockEmbed
    )
  })
  test('Should not include line in notification if not present.', async () => {
    prismaMock.comment.create.mockResolvedValue({
      author: authorMock,
      submission: submissionMock,
      ...{
        ...mockAddCommentArgs,
        line: null
      }
    })
    await addComment(
      {},
      {
        ...mockAddCommentArgs,
        line: null
      },
      mockCtx
    )
    const mockEmbed = {
      color: PRIMARY_COLOR_HEX,
      title: 'New comment on submission',
      url: `${CURRICULUM_URL}/${submissionMock.lesson.slug}`,
      thumbnail: {
        url: getLessonCoverPNG(submissionMock.lesson.order)
      },
      author: {
        name: authorMock.name,
        url: `${PROFILE_URL}/${authorMock.username}`,
        icon_url: C0D3_ICON_URL
      },
      description: `${getDiscordMessageUserIdString(
        authorMock
      )} commented on your submission to the challenge **${
        submissionMock.challenge.title
      }**.`,
      fields: [
        {
          name: 'Comment',
          value: mockAddCommentArgs.content
        }
      ]
    }

    expect(sendDirectMessage).toHaveBeenCalledWith(
      userMock.discordId,
      '',
      mockEmbed
    )
  })
})
