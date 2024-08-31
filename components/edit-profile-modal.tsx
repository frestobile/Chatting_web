import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Image, Stack, Flex, TextInput, Avatar, Center } from '@mantine/core';
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useAppContext } from '../providers/app-provider';
import { useMutation } from '@tanstack/react-query';
import axios from '../services/axios';
import { User } from '../utils/interfaces';

export default function EditProfileModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const { data, setData, refreshApp, organisationId } = useAppContext()
  const [uname, setUname] = useState<string>('')
  const [dname, setDname] = useState<string>('')
  const [file, setFile] = useState<{
    file: File | null,
    url: string | null
  } | null>(null)

  useEffect(() => {
    setUname(data?.profile.username ?? '')
    setDname(data?.profile.displayName ?? '')
    setFile(data?.profile.avatar ? {
      file: null,
      url: `${process.env.NEXT_PUBLIC_API}/static/avatar/${data?.profile.avatar}`
    } : null)
  }, [])

  const onSubmit = useCallback(async () => {
    try {
      const formData = new FormData();
      if (file?.file)
        formData.append('file', file.file)
      formData.append('username', uname)
      formData.append('displayName', dname)
      if (!organisationId) throw new Error('Organisation is required')
      formData.append('organisationId', organisationId)
      const { data } = await axios.put('/user', formData)
      setFile(data?.avatar ? {
        file: null,
        url: `${process.env.NEXT_PUBLIC_API}/static/avatar/${data?.avatar}`
      } : null)
      refreshApp()
    } catch (error) {
      console.error(error)
    }
  }, [file, uname, dname])

  const onUnameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUname(e.target.value)
  }, [])

  const onDnameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDname(e.target.value)
  }, [])

  const onAvatarChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0]
    const emptyFile = document.createElement('input');
    emptyFile.type = 'file'
    e.target.files = emptyFile.files
    setFile({
      file: file,
      url: URL.createObjectURL(file)
    })
  }, [])

  return (
    <>
      <Modal
        opened={opened}
        centered
        onClose={close}
        title="プロフィール編集"
        size="auto"
      >
        <Flex
          gap={24}
          w={700}
          align={'center'}
        >
          <Stack
            w={'100%'}
          >
            <TextInput
              label="Email"
              radius={'lg'}
              placeholder="Email"
              size='lg'
              readOnly
              value={data?.profile.email ?? ''}
              labelProps={{
                size: 'sm'
              }}
            />
            <TextInput
              data-autofocus
              label="User Name"
              radius={'lg'}
              placeholder="User Name"
              size='lg'
              value={uname}
              onChange={onUnameChange}
              labelProps={{
                size: 'sm'
              }}
            />
            <TextInput
              data-autofocus
              label="Display Name"
              radius={'lg'}
              placeholder="Display Name"
              size='lg'
              value={dname}
              onChange={onDnameChange}
              labelProps={{
                size: 'sm'
              }}
            />
          </Stack>
          <div className='flex items-center justify-center h-full'>
            <label
              htmlFor='avatar'
              className='p-4 border border-gray-500 cursor-pointer rounded-xl bordergra size-56 place-content-center'
            >
              <img
                crossOrigin='anonymous'
                src={file?.url ?? `/avatars/${/^[a-z]$/i.test(data?.profile?.displayName?.[0].toLowerCase() as string) ? data?.profile?.displayName?.[0].toLowerCase() : 'default'}.png`}
                onError={e => e.currentTarget.src = `/avatars/${/^[a-z]$/i.test(data?.profile?.displayName?.[0].toLowerCase() as string) ? data?.profile?.displayName?.[0].toLowerCase() : 'default'}.png`}
                alt='title'
              />
            </label>
            <input type='file' id='avatar' hidden name='avatar' onChange={onAvatarChange} />
          </div>
        </Flex>
        <Center mt={'md'}>
          <Button
            color='gray'
            radius={'lg'}
            variant='outline'
            size='lg'
            onClick={async () => {
              await onSubmit()
              close()
            }}
          >
            保存
          </Button>
        </Center>
      </Modal >

      <div className='px-8'>
        <Button
          color='gray'
          variant='outline'
          size='xl'
          radius={'lg'}
          onClick={() => {
            open()
            setUname(data?.profile.username ?? '')
          }}
        >
          プロフィール編集
        </Button>
      </div>
    </>
  )
}