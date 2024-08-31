import React, { useEffect } from 'react'
import Conversation from '..'
import {
  Divider,
  Flex,
  Text,
  Tooltip,
  Avatar,
  createStyles,
  getStylesRef,
} from '@mantine/core'
import { useAppContext } from '../../../../providers/app-provider'
import { IoMdClose } from 'react-icons/io'
import { useRouter } from 'next/router'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import { useQuery } from '@tanstack/react-query'
import axios from '../../../../services/axios'
import dynamic from 'next/dynamic'
const Message = dynamic(() => import('../../../../components/message'), {
  ssr: false,
})
import DOMPurify from 'dompurify'
import { formatDate } from '../../../../utils/helpers'
import { Thread } from '../../../../utils/interfaces'

const useStyles = createStyles((theme) => ({
  message: {
    padding: theme.spacing.sm,
    position: 'relative',
    '&:hover': {
      // backgroundColor: theme.colors.dark[7],
      [`& .${getStylesRef('actions')}`]: {
        display: 'flex !important',
      },
    },
  },
  actions: {
    ref: getStylesRef('actions'),
    display: 'none !important',
    position: 'absolute',
    right: 0,
    top: -20,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.dark[8],
    border: `1px solid ${theme.colors.dark[4]}`,
    '& > *': {
      cursor: 'pointer',
      paddingInline: theme.spacing.sm,
      paddingBlock: theme.spacing.xs,
      borderRadius: theme.radius.md,
      '&:hover': {
        backgroundColor: theme.colors.dark[5],
      },
    },
  },
  reaction: {
    color: theme.colors.dark[1],
    paddingInline: theme.spacing.sm,
    paddingBlock: theme.spacing.xs,
    cursor: 'pointer',
    borderRadius: 10,
    border: `1px solid ${theme.colors.dark[5]}`,
    transition: 'all .2s ease',
    '&:hover': {
      backgroundColor: theme.colors.dark[5],
    },
  },
}))

export default function ThreadPage() {
  const {
    theme,
    socket,
    data,
    selected,
    setThreadMessages,
    selectedMessage,
    setSelectedMessage,
  } = useAppContext()
  const router = useRouter()
  const { threadId, id } = router.query
  const { classes } = useStyles()
  const userId = data?.profile?._id

  const query = useQuery(
    [`messages`, threadId],
    () => axios.get(`/messages/${threadId}`),
    {
      refetchOnMount: false,
      onSuccess(data) {
        setSelectedMessage(data?.data?.data)
      },
    }
  )

  function handleReaction(emoji: string, id: string) {
    socket.emit('reaction', { emoji, id, userId })
  }

  useEffect(() => {
    socket.on('thread-message', ({ newMessage }) => {
      setThreadMessages((prevMessages) => [
        ...(prevMessages as Thread[]),
        newMessage,
      ])
    })
    return () => {
      socket.off('thread-message')
    }
  }, [])

  return (
    <Conversation>
      <Flex
        bg="white"
        py="2rem"
        px="1.85rem"
        align="center"
        gap="sm"
        style={{
          borderBottom: `2px solid ${theme.colors.dark[0]}`,
        }}
      >
        <Text fw="bold" color="black">
          スレッド
        </Text>
        <Text fz="xs" color="black">
          # {String(selected?.name)?.toLowerCase()}
        </Text>
        <IoMdClose
          onClick={() => router.push(`/c/${id}`)}
          style={{
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        />
      </Flex>

      <div
        className="h-[calc(100vh_-_67px)] overflow-y-auto"
        id="threadScroll"
      >
        {!query.isLoading && (
          <Flex className={classes.message} gap="sm" direction="column">
            <Flex className={classes.message} gap="sm">
              <Flex className={classes.actions} gap="xs" align="center">
                <Tooltip
                  label="完了"
                  withArrow
                  position="top"
                  onClick={() =>
                    handleReaction('✅', selectedMessage?._id as string)
                  }
                >
                  <Text fz="md" tt="lowercase" c={theme.colors.dark[3]} span>
                    ✅
                  </Text>
                </Tooltip>
                <Tooltip
                  label="見てみる"
                  withArrow
                  position="top"
                  onClick={() =>
                    handleReaction('👀', selectedMessage?._id as string)
                  }
                >
                  <Text fz="md" tt="lowercase" c={theme.colors.dark[3]} span>
                    👀
                  </Text>
                </Tooltip>
                <Tooltip
                  label="いいね"
                  withArrow
                  position="top"
                  onClick={() =>
                    handleReaction('👍', selectedMessage?._id as string)
                  }
                >
                  <Text fz="md" tt="lowercase" c={theme.colors.dark[3]} span>
                    👍
                  </Text>
                </Tooltip>
                <Tooltip
                  label="ハート"
                  withArrow
                  position="top"
                  onClick={() =>
                    handleReaction('💖', selectedMessage?._id as string)
                  }
                >
                  <Text fz="md" tt="lowercase" c={theme.colors.dark[3]} span>
                    💖
                  </Text>
                </Tooltip>
              </Flex>             

              <img
                crossOrigin="anonymous"
                src={
                  selectedMessage?.sender?.avatar
                    ? `${process.env.NEXT_PUBLIC_API}/static/avatar/${selectedMessage?.sender?.avatar}`
                    : `/avatars/${/^[a-z]$/i.test(selectedMessage?.sender?.username?.[0].toLowerCase() as string) ? selectedMessage?.sender?.username?.[0].toLowerCase() : 'default'}.png`
                }
                className="w-12 h-12 rounded-lg"
                onError={(e) =>
                  (e.currentTarget.src = `/avatars/${/^[a-z]$/i.test(selectedMessage?.sender?.username?.[0].toLowerCase() as string) ? selectedMessage?.sender?.username?.[0].toLowerCase() : 'default'}.png`)
                }
                alt="title"
              />

              <Flex direction="column" w={'95%'}>
                <Flex align="center" gap="md">
                  <Text fz="sm" fw="bold" c="black" span>
                    {selectedMessage?.sender?.displayName}
                  </Text>
                  <Tooltip
                    label={
                      formatDate(selectedMessage?.createdAt as string)?.time
                    }
                    withArrow
                    position="right"
                  >
                    <Text fz="xs" tt="lowercase" c={theme.colors.dark[3]} span>
                      {
                        formatDate(selectedMessage?.createdAt as string)
                          ?.timeRender
                      }
                    </Text>
                  </Tooltip>
                </Flex>
                <div
                  className="text-gray-600 text-xl font-medium break-words p-[1.5rem] bg-gray-200 w-[90%] rounded-[10px]"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      selectedMessage?.content as string,
                      {
                        ADD_ATTR: ['target'],
                      }
                    ),
                  }}
                />
                <Flex align="center" gap="sm">
                  {selectedMessage?.reactions?.map((reaction) => {
                    const reactionsFrom = reaction.reactedToBy.map(
                      (user) => user.username
                    )

                    return (
                      <Tooltip
                        label={reactionsFrom?.join(', ')}
                        withArrow
                        position="top"
                        key={reaction._id}
                      >
                        <Text
                          role="button"
                          fz="xs"
                          tt="lowercase"
                          className={classes.reaction}
                          span
                          onClick={() =>
                            handleReaction(
                              reaction?.emoji,
                              selectedMessage?._id
                            )
                          }
                          style={{
                            backgroundColor: reaction?.reactedToBy?.some(
                              (user) => user?._id === userId
                            )
                              ? theme.colors.dark[5]
                              : 'transparent',
                          }}
                        >
                          {reaction?.emoji} &nbsp;
                          {reaction?.reactedToBy?.length}
                        </Text>
                      </Tooltip>
                    )
                  })}
                </Flex>
              </Flex>
            </Flex>
            {selectedMessage?.threadRepliesCount && (
              <Divider
                px="sm"
                label={`${selectedMessage?.threadRepliesCount} replies`}
              />
            )}
          </Flex>
        )}
        <Message isThread />
      </div>
    </Conversation>
  )
}
