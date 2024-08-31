import { Avatar } from '@mantine/core'
import { useMutation, useQuery } from '@tanstack/react-query'
import { NextPage } from 'next'
import Button from '../components/button'
import axios from '../services/axios'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/router'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { getColorByIndex } from '../utils/helpers'
import { useAppContext } from '../providers/app-provider'
import { ApiError, Data } from '../utils/interfaces'
import { BsArrowRightShort } from 'react-icons/bs'

import { Loader } from '@mantine/core'
const Workspaces: NextPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [checkEmail, setCheckEmail] = useState<boolean>(false)
  const { setData, setMessageLoading, messageLoading } = useAppContext()

  //BUG: organisation create
  const mutation = useMutation({
    mutationFn: () => {
      return axios.post('/organisation')
    },
    onError(error: ApiError) {
      notifications.show({
        message: error?.response?.data?.data?.name,
        color: 'red',
        p: 'md',
      })
      router.push('/signin')
    },
    onSuccess(data) {
      router.push(`${data?.data?.data?._id}`)
    },
  })

  const query = useQuery(
    ['workspaces'],
    () => axios.get(`/organisation/workspaces`),
    {
      refetchOnMount: false,
      enabled: !!email,
    }
  )
  const organisations = query?.data?.data?.data
  function handleOpenWorkspace(organisation: Data) {
    setData(undefined)
    setMessageLoading(true)
    localStorage.setItem('organisationId', organisation?._id)
    axios.post(`/organisation/${organisation?._id}`)
    router.push(`/c/${organisation?.channels?.[0]?._id}`)
    localStorage.setItem('channel', 'true')
  }

  function otherEmailLogin() {
    localStorage.removeItem('signUpEmail')
    localStorage.removeItem('access-token')
    router.push('/signin')
  }

  useEffect(() => {
    if (router.query.token) {
      setEmail(router.query.email as string)
      localStorage.setItem('signUpEmail', router.query?.email as string)
      localStorage.setItem('access-token', router?.query?.token as string)
    }
  }, [router.query.token])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEmail(localStorage.getItem('signUpEmail') as string)

      const signUpEmail = localStorage.getItem('signUpEmail')
      if (!signUpEmail) {
        router.push('/signin')
      } else {
        checkStatus(signUpEmail)
      }
    }
  }, [])

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
      setCheckEmail(response.data?.status)
    } catch (error) {
      return false
    }
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-white bg-center bg-no-repeat bg-contain bg-homecon">
      {messageLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <Loader color="black" mt="md" size={'lg'} />
        </div>
      ) :  (<div className="flex justify-start flex-col w-full max-md:px-10">
        {/* <div className="flex justify-center">
          <div className="rounded-3xl p-16 border border-gray-150 w-[45rem] bg-gray-100">
            <p className="text-[3rem] font-semibold text-gray-600">
              Ainaglamを始めましょう
            </p>
            <p className="text-[1.4rem] mt-16 text-gray-500">
              これは、一緒に働くすべての人たちとコミュニケーションをとるための新しい方法です。
              電子メールよりも速く、よりよく整理され、より安全です。しかも無料でお試しいただけます。
            </p>
            <div className="flex items-center justify-center space-y-4">
              {checkEmail ? (
                <button
                  className="px-8 py-3 text-white bg-blue-500 rounded-3xl "
                  disabled={mutation.isLoading}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isLoading ? '' : 'グループを作成する'}
                </button>
              ) : (
                <p className="text-[1.4rem] mt-16 text-gray-500">
                  あなたはアクティブメンバーではないので、ワークスペースを作成することはできません。
                </p>
              )}
            </div>
          </div>
        </div> */}
        <div className="rounded-lg p-8 border border-gray-700 mt-16 mb-10 w-1/2 mx-auto bg-[#1A1B1E] max-md:w-full">
          {query.isLoading && (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-300 rounded-lg w-96"></div>
                <div className="h-6 bg-gray-300 rounded-lg w-52"></div>
              </div>
            </div>
          )}
          {organisations?.length >= 1 && (
            <p className="mb-8 font-bold text-white">Open a workspace</p>
          )}
          {organisations?.length === 0 ? (
            <div className="flex items-center justify-center">
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-xl font-semibold text-white">
                  あなたのチームはすでに Ainaglamを利用していますか?
                </p>
                <p className="w-3/4 mt-2 text-2xl text-white">
                  このメールアドレスの既存のワークスペースが見つかりませんでした{' '}
                  {email}
                </p>
                <button
                  className="px-8 py-2 mt-4 text-white border border-white rounded-lg"
                  onClick={() => otherEmailLogin()}
                >
                  別のメールを試してください
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-stretch justify-content gap-[1.6rem]">
              {organisations?.map((organisation: Data, index: number) => (
                <div
                  className={`flex items-center 
                    pb-7 
                    ${
                      organisations.length - 1 === index
                        ? ''
                        : 'border-b border-gray-700'
                    } 
                    justify-between`}
                >
                  <div className="flex gap-[0.8rem] items-center w-[70%]">
                    <Avatar
                      size="lg"
                      color={getColorByIndex(index)}
                      radius="xl"
                    >
                      {organisation.name}
                    </Avatar>
                    <div className="flex flex-col w-full">
                      <div className="text-white capitalize max-w-[90%] truncate">
                        {organisation.name}
                      </div>
                      <div className="text-xl capitalize">
                        {organisation.coWorkers.length} 会員
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleOpenWorkspace(organisation)}
                    rightIcon={<BsArrowRightShort />}
                    appearance="outline"
                  >
                    開ける
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>)}
    </div>
  )
}

export default Workspaces
