import { UseQueryResult, useQuery } from '@tanstack/react-query'
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react'
import axios from '../services/axios'
import {
  Center,
  Flex,
  MantineTheme,
  Skeleton,
  Stack,
  useMantineTheme,
} from '@mantine/core'
import io, { Socket } from 'socket.io-client'
import { useRouter } from 'next/router'
import {
  Channel,
  Conversation,
  Data,
  Message,
  Thread,
} from '../utils/interfaces'
import { notifications } from '@mantine/notifications'

const socket = io(process.env.NEXT_PUBLIC_SOCKET as string)

export interface ContextProps {
  theme: MantineTheme
  socket: Socket
  data: Data | undefined
  setData: React.Dispatch<React.SetStateAction<Data | undefined>>
  conversations: Conversation[] | undefined
  setConversations: React.Dispatch<
    React.SetStateAction<Conversation[] | undefined>
  >
  messages: Message[] | undefined
  setMessages: React.Dispatch<React.SetStateAction<Message[] | undefined>>
  selected: Conversation | Channel | undefined
  setSelected: React.Dispatch<
    React.SetStateAction<Conversation | Channel | undefined>
  >
  channels: Channel[] | undefined
  setChannels: React.Dispatch<React.SetStateAction<Channel[] | undefined>>
  refreshApp: () => void
  isLoading: boolean
  messageLoading: boolean
  setMessageLoading: React.Dispatch<React.SetStateAction<boolean>>
  channel: boolean
  channelMessagesQuery: UseQueryResult
  conversationMessagesQuery: UseQueryResult
  channelQuery: UseQueryResult
  conversationQuery: UseQueryResult
  threadMessages: Thread[] | undefined
  setThreadMessages: React.Dispatch<React.SetStateAction<Thread[] | undefined>>
  threadMessagesQuery: UseQueryResult
  selectedMessage: Message | undefined
  setSelectedMessage: React.Dispatch<React.SetStateAction<Message | undefined>>
  organisationId: string | undefined
  channelCollaborators: string[]
  setChannelCollaborators: React.Dispatch<React.SetStateAction<string[]>>
  channelId: string
}

const AppContext = createContext<ContextProps | undefined>(undefined)

export const AppContextProvider = React.memo(
  ({ children }: { children: React.ReactNode }) => {
    const [data, setData] = useState<Data>()
    const [messageLoading, setMessageLoading] = useState<boolean>(false)
    const [conversations, setConversations] =
      useState<ContextProps['conversations']>()
    const [channels, setChannels] = useState<ContextProps['channels']>()
    const [channelCollaborators, setChannelCollaborators] = useState<
      ContextProps['channelCollaborators']
    >([''])

    const theme = useMantineTheme()
    const router = useRouter()
    const { id, threadId } = router.query
    const [messages, setMessages] = useState<ContextProps['messages']>()
    const [threadMessages, setThreadMessages] =
      useState<ContextProps['threadMessages']>()

    const [selected, setSelected] = useState<ContextProps['selected']>()
    const [selectedMessage, setSelectedMessage] =
      useState<ContextProps['selectedMessage']>()
    const [organisationId, setOrganisationId] = useState<string>()

    const [channel, setChannel] = useState<boolean>(false)

    const [canQueryChannelMessages, setCanQueryChannelMessages] =
      useState(false)
    const [canQueryConversationMessages, setCanQueryConversationMessages] =
      useState(false)

    const query = useQuery(
      ['organisation', organisationId],
      () => axios.get(`/organisation/${organisationId}`),
      {
        enabled: !!organisationId && router.pathname.startsWith('/c'),
        refetchOnMount: false,
        onSuccess: (data) => {
          setData(data?.data?.data)
        },
      }
    )

    function updateUserStatus(id: string, isOnline: boolean) {
      const updatedConversations = data?.conversations?.map((conversation) => {
        if (conversation.createdBy === id) {
          const newConvo = { ...conversation, isOnline }
          return newConvo
        }
        return conversation
      })
      setConversations(updatedConversations)
    }

    const channelQuery = useQuery(
      [`channel`, id],
      () => axios.get(`/channel/${id}`),
      {
        enabled: !!id && channel,
        refetchOnMount: false,
        onSuccess: async (data) => {
          if (channel) {
            setSelected(data?.data?.data)
            setCanQueryChannelMessages(true)
          }
        },
        onError: () => {
          // If channel is not exist, redirect to sign in page
          localStorage.removeItem('signUpEmail')
          localStorage.removeItem('access-token')
          localStorage.removeItem('channel')
          localStorage.removeItem('channelID')
          localStorage.removeItem('organisationId')
          notifications.show({
            message: 'Channel not found',
            color: 'red',
            p: 'md',
          })
          setTimeout(() => {
            router.push('/signin')
          }, 3000);
        },
      }
    )

    const channelMessagesQuery = useQuery(
      [`messages`, id],
      () => {
        // setMessageLoading(true)
        return axios.get(`/messages`, {
          params: {
            channelId: selected?._id,
            organisation: organisationId,
          },
        })
      },
      {
        enabled: canQueryChannelMessages,
        refetchOnMount: false,
        onSuccess: async (data) => {
          setMessageLoading(false)
          setMessages(data?.data?.data)
          setCanQueryChannelMessages(false)
        },
      }
    )

    const conversationQuery = useQuery(
      [`conversations`, id],
      () => axios.get(`/conversations/${id}`),
      {
        enabled: !!id && channel === false && router.pathname.startsWith('/c'),
        refetchOnMount: false,

        onSuccess: async ({ data }) => {
          setMessageLoading(false)
          if (channel === false) {
            const name = data?.data?.collaborators?.length > 1 ?
              (data?.data?.collaborators?.[1].displayName ?? data?.data?.collaborators?.[1].username) :
              (data?.data?.collaborators?.[0].displayName ?? data?.data?.collaborators?.[0].username)
            setSelected({
              ...data?.data,
              name: name
            })
            setCanQueryConversationMessages(true)
          }
        },
        
      }
    )

    const conversationMessagesQuery = useQuery(
      [`messages`, id],
      () => {
        // setMessageLoading(true)
        return axios.get(`/messages`, {
          params: {
            conversation: selected?._id,
            organisation: organisationId,
          },
        })
      },
      {
        enabled: canQueryConversationMessages,
        refetchOnMount: false,
        onSuccess: async (data) => {
          setMessageLoading(false)
          setMessages(data?.data?.data)
          setCanQueryConversationMessages(false)
        },
      }
    )
    const threadMessagesQuery = useQuery(
      [`threads`, threadId],
      () =>
        axios.get(`/threads`, {
          params: {
            message: threadId,
          },
        }),
      {
        enabled: !!threadId,
        refetchOnMount: false,
        onSuccess: async (data) => {
          setThreadMessages(data?.data?.data)
        },
      }
    )

    useEffect(() => {
      setOrganisationId(localStorage.getItem('organisationId') as string)
      setChannel(localStorage.getItem('channel') === 'true')
      socket.on('message-updated', ({ id, message, isThread }) => {
        if (id === selectedMessage?._id) {
          setSelectedMessage(message)
        }
        if (isThread) {
          const newMessages = threadMessages?.map((msg) => {
            if (msg._id === id) {
              return message
            }
            return msg
          })
          setThreadMessages(newMessages)
        } else {
          const newMessages = messages?.map((msg) => {
            if (msg._id === id) {
              return message
            }
            return msg
          })
          setMessages(newMessages)
        }
      })
      socket.on('message-delete', ({ channelId, messageId, isThread }: { channelId: string, messageId: string,  isThread: boolean }) => {
        if (channelId === id && !isThread) {
          const newMessages = messages?.filter((msg) => msg._id !== messageId)
          setMessages(newMessages)
        } else if (channelId === id && isThread) {
          const newMessages = threadMessages?.filter((msg) => msg._id !== messageId)
          setThreadMessages(newMessages)
        }
      })
      return () => {
        socket.off('message-updated')
        socket.off('message-delete')
      }
    }, [id, messages, threadMessages, selectedMessage])

    const handleFocus = () => {

      if (data) {
        socket.emit('user-join', { id: data?.profile?._id, isOnline: true })
      }
    }

    const handleBlur = () => {

      if (data) {
        socket.emit('user-leave', { id: data?.profile?._id, isOnline: false })
      }
    }

    useEffect(() => {
      socket.connect()
      if (data) {
        setChannels(data?.channels)
        setConversations(data?.conversations)
        socket.on('user-join', ({ id, isOnline }) => {
          updateUserStatus(id, isOnline)
        })
        socket.on('user-leave', ({ id, isOnline }) => {
          updateUserStatus(id, isOnline)
        })

        window.addEventListener('focus', handleFocus)
        window.addEventListener('blur', handleBlur)
      }

      return () => {

        window.removeEventListener('focus', handleFocus)
        window.removeEventListener('blur', handleBlur)
        socket.off('user-join')
        socket.off('user-leave')
        socket.disconnect()
      }
    }, [data])

    useEffect(() => {
      if (data && id && channel) {
        socket.emit('channel-open', {
          id,
          userId: data?.profile?._id,
        })
        //FIXED: channel list changed
        socket.on('channel-updated', (updatedChannel) => {
          const channels = data?.channels?.map((c) => {
            if (c._id === updatedChannel?._id) {
              return updatedChannel
            }
            return c
          })
          // For visible unread messages number, I have to do this, but if there is error, I have to change it.
          // setChannels(channels)
        })
      }
      if (data && id && channel === false) {
        socket.emit('convo-open', {
          id,
          userId: data?.profile?._id,
        })
        socket.on('convo-updated', (updatedConversations) => {
          const conversations = data?.conversations?.map((c) => {
            if (c._id === id) {
              return {
                ...c,
                hasNotOpen: updatedConversations.hasNotOpen,
              }
            }
            return c
          })
          setConversations(conversations)
        })
      }

      return () => {
        socket.off('channel-open')
        socket.off('channel-updated')
        socket.off('convo-open')
        socket.off('convo-updated')
      }
    }, [data, id])

    useEffect(() => {
      setChannelCollaborators(
        selected?.collaborators?.map((user) => user._id) as string[]
      )
    }, [selected])

    if (query.isLoading && query.data)
      return (
        <Center p="xl" h="100vh" w="100vw" bg={theme.colors.dark[9]}>
          <Flex gap={10} align="center" w="30%" mx="auto">
            <Skeleton className="page-skeleton" height={50} width={50} circle />
            <Stack spacing="xs" w="80%">
              <Skeleton className="page-skeleton" height={15} radius="xl" />
              <Skeleton
                className="page-skeleton"
                height={15}
                w="80%"
                radius="xl"
              />
            </Stack>
          </Flex>
        </Center>
      )

    const contextValue = useMemo(() => {
      return {
        organisationId,
        theme,
        socket,
        data,
        setData,
        conversations,
        setConversations,
        messages,
        setMessages,
        selected,
        setSelected,
        channels,
        setChannels,
        refreshApp: query.refetch,
        isLoading: query.isLoading,
        channel,
        channelMessagesQuery,
        conversationMessagesQuery,
        channelQuery,
        conversationQuery,
        threadMessages,
        setThreadMessages,
        threadMessagesQuery,
        selectedMessage,
        setSelectedMessage,
        channelCollaborators,
        setChannelCollaborators,
        channelId: id as string,
        messageLoading,
        setMessageLoading
      }
    }, [
      organisationId,
      theme,
      socket,
      data,
      setData,
      conversations,
      setConversations,
      messages,
      setMessages,
      selected,
      setSelected,
      channels,
      setChannels,
      channel,
      channelMessagesQuery,
      conversationMessagesQuery,
      channelQuery,
      conversationQuery,
      threadMessages,
      setThreadMessages,
      threadMessagesQuery,
      selectedMessage,
      setSelectedMessage,
      channelCollaborators,
      setChannelCollaborators,
      messageLoading,
      setMessageLoading,
      id
    ])

    return (
      <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
    )
  }
)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within a AppContextProvider')
  }
  return context
}
