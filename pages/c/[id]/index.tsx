import React, { useEffect, useState } from 'react'
import DefaultLayout from '../../../components/pages/default-layout'
import MessageLayout from '../../../components/pages/message-layout'
import { useAppContext } from '../../../providers/app-provider'
import { BackgroundImage } from '@mantine/core'
import { useRouter } from 'next/router'
import axios from '../../../services/axios'
import { notifications } from '@mantine/notifications'

export default function Conversation({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const {
    data: organisationData,
    channel,
    messageLoading,
  } = useAppContext()
  const [status, setStatus] = useState<boolean>(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('access-token')) {
        const url = window.location.href
        if (url && url.includes('/c/')) {
          const channelID = url.split('/').filter(Boolean).slice(-1)[0];
          localStorage.setItem('channelID', channelID);
        }
        router.push('/signin')
      }
    }
  }, [])

  useEffect(() => {
    const checkStatus = async (checkEmail: string) => {
      try {
        const formData = new FormData();
        if(!checkEmail) return;
        formData.append('email', checkEmail)
        const response = await axios.post(
          'https://backend.ai-na.co.jp/api/check-member-ainaglam',
          formData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        if (response.data?.status === false) {
          setStatus(false)
        } else {
          setStatus(true)
        }
      } catch (error) {
        return false
      }
    }
    checkStatus(localStorage.getItem('signUpEmail') as string);
  }, [])

  const [list, setList] = useState(false);
  const [thr, setThr] = useState(false);
  const [main, setMain] = useState(false);
  return (
    <DefaultLayout
      list={list}
      main={main}
      thread={children}
      setMain={setMain}
      setList={setList}>
      {organisationData && (
        <MessageLayout
          setMain={setMain}
          setList={setList}
          status={status}
          messagesLoading={
            messageLoading
          }
          type={channel ? 'channel' : 'conversation'}
        />
      )}
    </DefaultLayout>
  )
}
