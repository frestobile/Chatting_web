import React from 'react'
import {
  Button as MantineButton,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import AinaglamLogo from '../components/aina-logo'
import Input from '../components/input'
import Button from '../components/button'
import { BiLogoGoogle } from 'react-icons/bi'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import axios from '../services/axios'
import { notifications } from '@mantine/notifications'
import { NextPage } from 'next'
import { ApiError } from '../utils/interfaces'
import logoMark from '../public/logo-mark.svg'
import Image from 'next/image'

const Register: NextPage = () => {
  const router = useRouter()
  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : '無効なメール'),
    },
  })

  const mutation = useMutation({
    mutationFn: (body) => {
      return axios.post('/auth/register', body)
    },
    onError(error: ApiError) {
      notifications.show({
        message: error?.response?.data?.data?.name,
        color: 'red',
        p: 'md',
      })
    },
    onSuccess() {
      localStorage.setItem('signUpEmail', form.values.email)
      router.push('/verify')
    },
  })

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
            <p className="text-4xl font-semibold mt-16 mb-9 text-gray-600">アカウントを作成</p>
            <form
              onSubmit={form.onSubmit(() =>
                mutation.mutate({ email: form.values.email } as any)
              )}
            >
              <div className='flex flex-col justify-stretch gap-[1.6rem]'>
                <Input
                  required
                  placeholder="メールアドレス（仕事用アドレス推奨）"
                  value={form.values.email}
                  onChange={(event) =>
                    form.setFieldValue('email', event.currentTarget.value)
                  }
                  error={form.errors.email && '無効なメール'}
                />
                <Button loading={mutation.isLoading} type="submit">
                  {mutation.isLoading ? '' : '登録する'}
                </Button>
                <div className="flex items-center my-4">
                  <hr className="flex-grow border-gray-700" />
                  <p className="mx-4 text-gray-400 text-xl">or</p>
                  <hr className="flex-grow border-gray-700" />
                </div>
                <MantineButton
                  leftIcon={<BiLogoGoogle size="1.8rem" />}
                  radius="md"
                  size="sm"
                  onClick={() => {
                    window.open(
                      `${process.env.NEXT_PUBLIC_API}/auth/google/callback`,
                      '_self'
                    )
                  }}
                  styles={(theme) => ({
                    root: {
                      backgroundColor: 'white',
                      height: '4.5rem',
                      fontSize: '1.2rem',
                      color: 'black',
                      borderRadius: '6rem',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      '&:not([data-disabled])': theme.fn.hover({
                        backgroundColor: theme.fn.darken('#373A40', 0.05),
                        transition: 'background-color .3s ease',
                      }),
                    },

                    leftIcon: {
                      marginRight: theme.spacing.md,
                    },
                  })}
                >
                  Google を続ける
                </MantineButton>
                <div className="space-y-2 mt-8">                  
                  <a
                    href="/signin"
                    className="text-2xl text-red-500 block text-center hover:underline"
                  >
                    すでに登録済みですか？
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
