import {
  Avatar,
  Center,
  Flex,
  Modal,
  MultiSelect,
  Paper,
  Skeleton,
  Text,
  ThemeIcon,
  createStyles,
} from '@mantine/core'
import React, { useEffect } from 'react'
import { getColorByIndex, getColorHexByIndex } from '../../utils/helpers'
import { LuUserPlus } from 'react-icons/lu'
import { CgChevronLeft, CgClose } from 'react-icons/cg'
import dynamic from 'next/dynamic'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import Button from '../button'
import { useMutation } from '@tanstack/react-query'
import axios from '../../services/axios'
import { notifications } from '@mantine/notifications'
import { useAppContext } from '../../providers/app-provider'
import { ApiError, MessageLayoutProps, User } from '../../utils/interfaces'
import { useRouter } from 'next/router'
import TagInputs from '../tags-input'
const Message = dynamic(() => import('../message'), {
  ssr: false,
})

const useStyles = createStyles((theme) => ({
  select: {
    paddingBlock: theme.spacing.sm,
    paddingInline: theme.spacing.sm,
  },
  values: {
    gap: theme.spacing.sm,
  },
}))

export default function MessageLayout({
  setMain,
  setList,
  status,
  type,
  messagesLoading,
}: MessageLayoutProps) {
  const {
    theme,
    refreshApp,
    selected,
    data: organisationData,
  } = useAppContext()
  const { classes } = useStyles()
  const [isDisabled, setIsDisabled] = React.useState(true)
  const [channelCollaborators, setChannelCollaborators] = React.useState(
    selected?.collaborators?.map((d: User) => d._id)
  )
  const router = useRouter()

  const isLoading = !selected?.name
  const [opened, { open, close }] = useDisclosure(false)
  const [statusOpened, { open: statusOpen, close: statusClose }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      userIds: [''],
      channelId: selected?._id,
    },
    validate: {
      userIds: (val) =>
        val.length > 0 ? null : '少なくとも 1 人を選択する必要があります',
    },
  })

  const mutation = useMutation({
    mutationFn: (body) => {
      return axios.post('/teammates', body)
    },
    onError(error: ApiError) {
      notifications.show({
        message: error?.response?.data?.data?.name,
        color: 'red',
        p: 'md',
      })
    },
    onSuccess() {
      refreshApp()
      close()
      form.reset()
      notifications.show({
        message: `チームメイトの追加に成功しました`,
        color: 'green',
        p: 'md',
      })
    },
  })

  const collaboratorsToRemove = selected?.collaborators?.map((c: User) => c._id)

  const removeCollaboratorsFromCoworkers = organisationData?.coWorkers?.filter(
    (c: User) => {
      return !collaboratorsToRemove?.includes?.(c._id)
    }
  )

  const coWorkersSelect = removeCollaboratorsFromCoworkers?.map((c: User) => {
    return {
      value: c._id,
      label: c.email,
    }
  })

  const joinMutation = useMutation({
    mutationFn: () => {
      return axios.post(`/channel/${selected?._id}`, {
        userId: organisationData?.profile?._id,
      })
    },
    onError(error: ApiError) {
      notifications.show({
        message: error?.response?.data?.data?.name,
        color: 'red',
        p: 'md',
      })
    },
    onSuccess() {
      refreshApp()
      setChannelCollaborators((collaborators) => [
        ...(collaborators as string[]),
        organisationData?.profile?._id as string,
      ])
      notifications.show({
        message: `${selected?.name} に正常に参加しました`,
        color: 'green',
        p: 'md',
      })
    },
  })

  useEffect(() => {
    if(!status) {
      statusOpen()
    }
  })

  const isMobile = useMediaQuery('(max-width: 600px)')

  const replacePage = () => {
     router.push("https://mypage.ai-na.co.jp/login/")
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title={`#${selected?.name} にユーザーを追加`}
        centered
        size="45.25rem"
        radius="lg"
        padding="xl"
        overlayProps={{
          color: theme.colors.dark[9],
          opacity: 0.55,
          blur: 2,
        }}
      >
        <MultiSelect
          classNames={{
            input: classes.select,
            values: classes.values,
          }}
          onChange={(val) => {
            form.setFieldValue('userIds', val)
            setIsDisabled(false)
          }}
          searchable
          nothingFound="何も見つかりません"
          valueComponent={({ label }) => (
            <Flex gap="sm">
              <Avatar
                src={`/avatars/${/^[a-z]$/i.test(label?.[0].toLowerCase() as string) ? label?.[0].toLowerCase() : 'default'}.png`}
                size="md"
                color={getColorByIndex(label)}
                radius="xl"
              >
                {label[0].toLowerCase()}
              </Avatar>
              <Text>{label}</Text>
            </Flex>
          )}
          radius="md"
          data={coWorkersSelect as any}
          placeholder="チームメイトを選択してください"
        />

        <Text fz="xs" mt="lg">
          チームメイトを #{selected?.name}{' '}
          チャンネルに招待して、チームのコラボレーションを拡大します。
          洞察を共有し、一緒にさらに多くのことを達成しましょう。
        </Text>
        <Flex align="center" gap="md" mt="lg">
          <Button
            disabled={isDisabled}
            onClick={() =>
              mutation.mutate({
                userIds: form.values.userIds,
                channelId: selected?._id,
              } as any)
            }
            loading={mutation.isLoading}
            type="submit"
          >
            {mutation.isLoading ? '' : '招待を送る'}
          </Button>
        </Flex>
      </Modal>
      <Modal
        opened={statusOpened}
        onClose={statusClose}
        withCloseButton={false}
        centered
        size="45.25rem"
        radius="lg"
        padding="4xl"
        bg={"#ffffff"}
        overlayProps={{
          color: theme.colors.dark[3],
          opacity: 0.55,
          blur: 4,
        }}
      >
        <h1>サブスクリプションをご契約ください。</h1>
        <br />
        AIネイティブアカデミーの月会費を支払いアカウントを有効にしましょう！
        <Flex align="center" justify="center" w={'100%'} gap="md" mt="lg">
          <Button
            disabled={false}
            type="submit"
            onClick={replacePage}
            style={{
              width: '100%',
              background  : '#1961cd',
            }}
          >
            {'マイページへ'}
          </Button>
        </Flex>
      </Modal>
      <Flex
        direction="column"
        justify="flex-start"
        style={{
          position: 'relative',
          height: '100vh',
        }}
      >
        <Flex
          bg="white"
          py="2rem"
          px="1.85rem"
          align="center"
          justify="space-between"
          style={{
            borderBottom: `2px solid ${theme.colors.dark[0]}`,
          }}
        >
          {isLoading && <Skeleton height={15} width={150} radius="md" />}
          {type === 'channel' && !isLoading && (
            <div className="flex justify-between w-full">
              {isMobile && (
                <CgChevronLeft
                  onClick={() => {
                    setMain(true)
                    setList(true)
                  }}
                  style={{ cursor: 'pointer' }}
                />
              )}
              <Text color="black" weight="bold">
                {String(selected?.name)?.toUpperCase()}
              </Text>
            </div>
          )}
          {type === 'conversation' && !isLoading && (
            <Flex gap="sm" align={'center'}>
              {isMobile && (
                <CgChevronLeft
                  onClick={() => {
                    setMain(true)
                    setList(true)
                  }}
                  style={{ cursor: 'pointer' }}
                />
              )}
              <img
                crossOrigin="anonymous"
                className="w-12 h-12 rounded-lg"
                src={
                  organisationData?.conversations.find(
                    (item) => item.name === selected?.name
                  )?.avatar
                    ? `${process.env.NEXT_PUBLIC_API}/static/avatar/${
                        organisationData?.conversations.find(
                          (item) => item.name === selected?.name
                        )?.avatar
                      }`
                    : `/avatars/${/^[a-z]$/i.test(selected?.name?.[0].toLowerCase() as string) ? selected?.name?.[0].toLowerCase() : 'default'}.png`
                }
                onError={(e) =>
                  (e.currentTarget.src = `/avatars/${/^[a-z]$/i.test(selected?.name?.[0].toLowerCase() as string) ? selected?.name?.[0].toLowerCase() : 'default'}.png`)
                }
              />
              <Text color="black" weight="bold">
                {String(selected?.name)?.toLowerCase()}
              </Text>
            </Flex>
          )}
          {}
        </Flex>

        {selected && status && (
          <Message
            isLoading={isLoading}
            messagesLoading={messagesLoading}
            type={type}
            open={open}
          />
        )}
      </Flex>
    </>
  )
}
