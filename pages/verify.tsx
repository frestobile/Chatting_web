import React, { useEffect, useState } from 'react'
import { PinInput, Button as MantineButton } from '@mantine/core'
import { useForm } from '@mantine/form'
import AinaglamLogo from '../components/aina-logo'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import axios from '../services/axios'
import { notifications } from '@mantine/notifications'
import Image from 'next/image'
import logoMark from '../public/logo-mark.svg'
import { NextPage } from 'next'
import { ApiError, ApiSuccess } from '../utils/interfaces'
import { useAppContext } from '../providers/app-provider'
import { not } from 'cheerio/lib/api/traversing'

const Verify: NextPage = () => {
  const [email, setEmail] = useState('')
  const router = useRouter()
  const { setData } = useAppContext()
  const form = useForm({
    initialValues: {
      code: '',
    },
    validate: {
      code: (val) => (val.length === 6 ? null : 'コードは6文字でなければなりません'),
    },
  })

  const mutation = useMutation({
    mutationFn: (body) => {
      return axios.post('/auth/verify', body)
    },
    onError(error: ApiError) {
      notifications.show({
        message: error?.response?.data?.data?.name,
        color: 'red',
        p: 'md',
      })
    },
    onSuccess: async (data: ApiSuccess['data']) => {
      notifications.show({
        message: `${data?.data?.data?.email} として確認されました`,
        color: 'green',
        p: 'md',
      })
      // localStorage.removeItem('signUpEmail')
      localStorage.setItem('access-token', data?.data?.data?.token)
      const channelID = localStorage.getItem('channelID')
      if(channelID) {
        localStorage.removeItem('channelID')
        localStorage.setItem('channel', 'true')
        setData(undefined)
        await axios.get(`/channel/${channelID}`)
          .then((res) => {
            const organisationId = res?.data?.data?.organisation
            localStorage.setItem('organisationId', organisationId);
            axios.post(`/organisation/${organisationId}`);
            if (channelID === organisationId) {
              router.push(`/c/${res?.data?.data?._id}`)
            }
            router.push(`/c/${channelID}`)
          })
          .catch((err) => {
            localStorage.removeItem('signUpEmail')
            localStorage.removeItem('channelID')
            localStorage.removeItem('access-token')
            notifications.show({
              message: 'スレッドが見つかりません',
              color: 'red',
              p: 'md',
            })
            setTimeout(() => {
              router.push('/signin')
            }, 3000);
          })
      } else {
        router.push('/')
      }
    },
  })

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
        if (!response.data?.result) {
          notifications.show({
            message: `このワークスペースに参加する権限がありません。あなたは 【ＡＩネイティブアカデミー】に登録されていません。`,
            color: 'red',
            p: 'md',
          });
        //   // It will be used in the future, but for now it is temporarily don't use for testing. 
        //   localStorage.removeItem('channelID');
        //   setTimeout(() => {
        //     router.push('/signin');
        //   }, 3000);
        }
      } catch (error) {
        return false
      }
    }

    checkStatus(localStorage.getItem('signUpEmail') as string);

    if (typeof window !== 'undefined') {
      setEmail(localStorage.getItem('signUpEmail') as string)

      const signUpEmail = localStorage.getItem('signUpEmail')
      if (!signUpEmail) {
        router.push('/signin')
      }
    }
  }, [])

  return (
    <div className="flex items-center justify-center h-screen w-screen p-16 bg-white bg-pattern bg-contain bg-center bg-no-repeat">
      <div className="flex flex-col justify-between">
        <div className="flex flex-col items-center">
          <div className="rounded-3xl p-16 border border-gray-150 w-[45rem] bg-gray-100 relative">
            <Image
              src={logoMark}
              width={100}
              height={100}
              alt=""
              className="absolute top-0 right-0"
            />
            <p className="text-4xl font-semibold mt-16 mb-9 text-gray-600">
              認証コードを送信しました
            </p>
            <p className="text-xl mt-2 mb-8 text-gray-600">
              6 文字のコードを
              <span className="font-semibold text-red-500">{email}.</span>
              に送信しました。
              <span className="font-semibold">
                &nbsp;24時間以内に入力してください。
              </span>
            </p>

            <PinInput
              size="5.5rem"
              aria-label="One time code"
              oneTimeCode
              length={6}
              disabled={mutation.isLoading}
              styles={() => ({
                input: {
                  fontSize: '3.5rem',
                  backgroundColor: 'white',
                },
              })}
              value={form.values.code}
              onChange={(value) => form.setFieldValue('code', value)}
              error={!!form.errors.code}
              onComplete={() => {
                mutation.mutate({
                  loginVerificationCode: form.values.code,
                } as any)
              }}
            />

            {mutation.isLoading && (
              <div className="flex items-center justify-center gap-4">
                <div className="loader loader-medium"></div>
                <p className="text-2xl">コードを確認する</p>
              </div>
            )}

            <p className="mt-40 text-2xl text-gray-600">
              コードが見つからない場合は、迷惑フォルダをご確認ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Verify
