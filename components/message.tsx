import React, { useState, useEffect, useRef } from 'react'  
import {
  Avatar,
  Box,
  Button,
  Flex,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'  
import ReactQuill, { Quill } from 'react-quill'  
import 'react-quill/dist/quill.snow.css' // Import the Quill styles  
import { useAppContext } from '../providers/app-provider'  
import { GoMegaphone } from 'react-icons/go'  
import { truncateDraftToHtml } from '../utils/helpers'  
import { notifications } from '@mantine/notifications'  
import MessageList from './message-list'  
import { useRouter } from 'next/router'  
import { Message as IMessage, MessageProps, User } from '../utils/interfaces'  
import axios from '../services/axios'  
import EditProfileModal from './edit-profile-modal'  
import { LuNavigation } from 'react-icons/lu'
import { useMediaQuery } from '@mantine/hooks'
import next from 'next'

Quill.debug('error')

const Message = ({
  messagesLoading,
  isLoading,
  type,
  isThread = false,
  open,
}: MessageProps) => {
  const router = useRouter()
  const { threadId } = router.query

  const {
    data: organisationData,
    socket,
    conversations,
    selected,
    threadMessages,
    messages,
    channelId,
    setMessages,
    theme,
    channelCollaborators,
    setMessageLoading
  } = useAppContext()
  const userId = organisationData?.profile?._id
  const conversationCollaborators = conversations?.map((conversation) => {
    return conversation.collaborators.map((collaborator) => collaborator._id)
  })

  const [editorContent, setEditorContent] = useState('')
  const stackRef = useRef<HTMLDivElement | null>(null)
  const isMobile = useMediaQuery('(max-width: 600px)');

  const handleChange = (content: React.SetStateAction<string>) => {
    setEditorContent(content)
  }

  const handleSendMessage = () => {
    if (editorContent.trim().length > 0) {
      const message = {
        sender: userId,
        content: editorContent,
      }

      let nextContent = editorContent
      let lastCharIndex = nextContent.length - 1

      while (nextContent.substring(lastCharIndex - 10, lastCharIndex + 1) === '<p><br></p>') {
        nextContent = nextContent.substring(0, lastCharIndex - 10)
        lastCharIndex = nextContent.length - 1
      }

      if (nextContent === '') {
        return
      }

      if (nextContent.includes('width: 120px;')){
        console.log('okay')
        nextContent = nextContent.replaceAll('width: 120px', 'width: 30%')
      }

      message.content = nextContent

      if (isThread) {
        socket.emit('thread-message', {
          message,
          messageId: threadId,
          userId,
        })
      } else {
        socket.emit('message', {
          message,
          organisation: selected?.organisation,
          hasNotOpen: selected?.collaborators?.filter(
            (c) => c._id !== userId
          ),
          ...(selected?.isChannel && {
            channelId,
            channelName: selected?.name,
            collaborators: selected?.collaborators,
          }),
          ...(selected?.isConversation && {
            conversationId: selected?._id,
            collaborators: selected?.collaborators,
            isSelf: selected?.collaborators[0]?._id === selected?.collaborators[1]?._id,
          }),
          isPublic: selected?.isPublic,
        })
      }

    setEditorContent('')
    }
  }

  useEffect(() => {
    socket.on(
      'message',
      ({ collaborators, newMessage, isPublic, channelId: cId }) => {
        if (
          (collaborators?.includes(userId) ||
            channelCollaborators?.includes(userId ?? '') ||
            isPublic) &&
          channelId === cId
        ) {
          setMessages((prevMessages) => [
            ...(prevMessages as IMessage[]),
            newMessage,
          ])
        }
      }
    )

    socket.on('message-update', ({ _id, updatedContent }) => {
      setMessages((prevMessage) =>
        prevMessage?.map((message) =>
          message._id === _id
            ? { ...message, content: updatedContent }
            : message
        )
      )
    })

    socket.on(
      'notification',
      ({
        newMessage,
        organisation,
        collaborators,
        channelName,
        isPublic,
        channelId: cId,
      }) => {
        const collaboratorsId = collaborators?.map((collab: User) => {
          return collab._id
        })

        const exists = conversationCollaborators?.some((collaboratorArray) =>
          collaboratorArray.every((collaborator) =>
            collaboratorsId.includes(collaborator)
          )
        )
        if (organisationData?._id === organisation && channelId !== cId) {
          if ((collaboratorsId?.includes(userId) || isPublic) && channelName) {
            notifications.show({
              title: `${
                newMessage?.sender?.username
              } #${channelName?.toLowerCase()}`,
              message: truncateDraftToHtml(newMessage?.content),
              color: 'green',
              p: 'md',
            })
            return
          } else if (exists) {
            notifications.show({
              title: newMessage?.sender?.username,
              message: truncateDraftToHtml(newMessage?.content),
              color: 'green',
              p: 'md',
            })
            return
          }
        }
      }
    )

    return () => {
      socket.off('message')
      socket.off('notification')
    }
  }, [channelId])

  useEffect(() => {
    if (messages?.length && messages?.length > 5) {
      stackRef.current?.scrollTo(0, stackRef.current.scrollHeight)
    }
  }, [messages])

  let suggestions = organisationData?.coWorkers?.map((user) => {
    return {
      text: (
        <Flex align="center" gap="sm">
          <Avatar
            src={`/avatars/${/^[a-z]$/i.test(user?.username?.[0].toLowerCase() as string) ? user?.username?.[0].toLowerCase() : 'default'}.png`}
            size="sm"
          />
          <Text fz="sm">
            {user.username} {userId === user._id && '(you)'}
          </Text>
          {user.isOnline || userId === user._id ? (
            <Box
              h=".7rem"
              w=".7rem"
              bg="green"
              style={{
                borderRadius: '5rem',
              }}
            ></Box>
          ) : (
            <Box
              h=".7rem"
              w=".7rem"
              bg="gray"
              style={{
                borderRadius: '5rem',
              }}
            ></Box>
          )}
        </Flex>
      ),
      value: user.username,
    }
  })

  suggestions = suggestions && [
    ...suggestions,
    {
      text: (
        <Flex align="center" gap="sm">
          <GoMegaphone />
          <Text fz="sm">@channel このチャンネルの全員に通知します。</Text>
        </Flex>
      ),
      value: 'channel',
    },
    {
      text: (
        <Flex align="center" gap="sm">
          <GoMegaphone />
          <Text fz="sm">
            @here このチャンネルのすべてのオンライン メンバーに通知します。
          </Text>
        </Flex>
      ),
      value: 'here',
    },
  ]

  Quill.register('modules/imageUploader', function(quill: {
    [x: string]: any
  }, options: any) {
    let fileInput: HTMLInputElement

    const createImageInput = () => {
      fileInput = document.createElement('input')
      fileInput.setAttribute('type', 'file')
      fileInput.setAttribute('accept', 'image/*')
      fileInput.style.display = 'none'
      document.body.appendChild(fileInput)

      fileInput.addEventListener('change', handleImageChange)
    }

    const handleImageChange = () => {
      const file = fileInput?.files?.[0]
      if (!file) {
        return
      }
  
      const formData = new FormData()
      formData.append('image', file)

      setMessageLoading(true)
  
      axios.post('/messages/image-upload', formData)
        .then((response) => {
          setMessageLoading(false)
          const src = process.env.NEXT_PUBLIC_API + '/static/image/' + response.data.filename
          const customHtml = `<a href="${src}" target="_blank" style="text-decoration: none;">
                                <img alt='test' src="${src}"
                                  style="
                                    width: 120px;
                                    border-radius: 8px;
                                    border: 2px solid white;
                                    margin-bottom: 6px
                                  "
                                  width=120
                                  height=120
                                />
                              </a>
                              <a href="${process.env.NEXT_PUBLIC_API +'/messages/download/' +response.data.filename}" class="entity-link">${response.data.filename}</a>
                              `;
          var editor = document.getElementsByClassName('ql-editor')
          if(isThread){
            editor[1].innerHTML = customHtml
          }else{
            editor[0].innerHTML = customHtml
          }
        })
        .catch((error) => {
          console.error("Error uploading image: ", error)
        })
    }

    createImageInput()
      
    quill.getModule('toolbar').addHandler('image', () => {
      createImageInput()
      fileInput.click()
    })
  })

  Quill.register('modules/videoUploader', function(quill: {
    [x: string]: any
  }, options: any) {
    let fileInput: HTMLInputElement

    const createFileInput = () => {
      fileInput = document.createElement('input')
      fileInput.setAttribute('type', 'file')
      fileInput.setAttribute('accept', 'audio/*,video/*')
      fileInput.style.display = 'none'
      document.body.appendChild(fileInput)

      fileInput.addEventListener('change', handleFileChange)
    }

    const handleFileChange = () => {
      const file = fileInput?.files?.[0]
      if (!file) {
        return
      }

      if(file.size > 104857600){
        alert('ファイルサイズは100MB以下にしてください')
        return
      }
  
      const formData = new FormData()
      formData.append('file', file)

      setMessageLoading(true)

      axios.post('/messages/file-upload', formData)
        .then((response) => {
          setMessageLoading(false)
          const src = process.env.NEXT_PUBLIC_API + '/static/file/' + response.data.filename
          let customHtml = `<a href="${src}" target="_blank" class="entity-link">${response.data.filename}</a>`
          var editor = document.getElementsByClassName('ql-editor')
          if(isThread){
            editor[1].innerHTML = customHtml
          }else{
            editor[0].innerHTML = customHtml
          }
        })
        .catch((error) => {
          setMessageLoading(false)
          console.error("Error uploading file: ", error)
        })
    }

    createFileInput()
      
    quill.getModule('toolbar').addHandler('video', () => {
      createFileInput()
      fileInput.click()
    })
  })

  return (
    <>
      <Stack
        p={isThread ? 'md' : 'lg'}
        ref={stackRef}
        id="customScroll"
        style={{
          ...(isThread ? { maxHeight: '63.5vh' } : { height: '77.5vh' }),
          overflowY: 'scroll',
          gap: '0',
          ...(isThread && { paddingBlock: 'unset', paddingTop: '2rem' }),
        }}
      >
        {!isThread && (
          <>
            {messagesLoading ? (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <Loader color="black" mt="md" size={'lg'} />
              </div>
            ) : (
              <MessageList userId={userId as string} messages={messages} />
            )}
          </>
        )}
        {isThread && (
          <MessageList
            isThread
            userId={userId as string}
            messages={threadMessages}
          />
        )}
      </Stack>
      {selected?.isConversation && selected.isSelf && <EditProfileModal />}
      {(channelCollaborators?.includes(userId ?? '') ||
        !selected?.isChannel ||
        selected.isPublic) && (
        <Paper
          radius="md"
          mt="xs"
          m="lg"
          pos={'relative'}
          style={{
            border: '1.5px solid gray',
            borderRadius: '1rem',
            position: 'sticky',
            bottom: 20,
            backgroundColor: 'white',
            height: 120,
          }}
        >
          <ReactQuill
            value={editorContent}
            onKeyDown={(e) => {
              if(!isMobile) {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }
            }}
            onChange={handleChange}
            placeholder={`Message ${selected?.isChannel ? '#' : ''}${selected?.name?.toLowerCase()}`}
            modules={{
              toolbar: [
                [{ 'header': '1'}],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{'indent': '-1'}, {'indent': '+1'}],
                ['link', 'image', 'video']
              ],
              clipboard: {
                matchVisual: false,
              },
              imageUploader: true,
              videoUploader: true,
            }}
            formats={[
              'header',
              'bold', 'italic', 'underline', 'strike', 'blockquote',
              'indent',
              'link', 'image', 'video'
            ]}
            style={{ 
              height: '75px',
            }}
          />
          <Button
            pos={'absolute'}
            right={8}
            bottom={8}
            size="xl"
            className='z-40'
            onClick={handleSendMessage}
          >
            <LuNavigation />
          </Button>
        </Paper>
      )}
    </>
  )
}

export default Message