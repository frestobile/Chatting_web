import { useState, useEffect } from 'react'
import {
  createStyles,
  UnstyledButton,
  Group,
  Text,
  Menu,
  ThemeIcon,
  Flex,
  Skeleton,
  Stack,
} from '@mantine/core'
import {
  TbLogout,
  TbHeart,
  TbStar,
  TbMessage,
  TbSettings,
  TbPlayerPause,
  TbTrash,
  TbSwitchHorizontal,
} from 'react-icons/tb'

import { LuChevronsUpDown } from 'react-icons/lu'
import { useRouter } from 'next/router'
import { ContextProps, useAppContext } from '../providers/app-provider'
import { useQuery } from '@tanstack/react-query'
import axios from '../services/axios'
import { Data } from '../utils/interfaces'

const useStyles = createStyles((theme) => ({
  user: {
    color: theme.colors.dark[0],
    padding: theme.spacing.xs,
    borderRadius: theme.radius.lg,
    transition: 'background-color 100ms ease',

    '&:hover': {
      backgroundColor: '#EBEBEB',
    },
  },
}))

interface AccountSwitcherProps {
  data: ContextProps['data']
}

export default function AccountSwitcher({ data }: AccountSwitcherProps) {
  const router = useRouter()
  const { classes, theme, cx } = useStyles()
  const { socket } = useAppContext()
  const [, setUserMenuOpened] = useState(false)
  const { setData } = useAppContext()
  function handleLogout() {
    localStorage.removeItem('organisationId')
    localStorage.removeItem('signUpEmail')
    localStorage.removeItem('access-token')
    localStorage.removeItem('channel')
    socket.emit('user-leave', { id: data?.profile?._id, isOnline: false })
    router.push('/signin')
  }

  const [signUpEmail, setSignUpEmail] = useState<string | null>(null)
  function handleOpenWorkspace(organisation: Data) {
    setData(undefined)
    localStorage.setItem('organisationId', organisation?._id)
    router.push(`/c/${organisation?.channels?.[0]?._id}`)
    localStorage.setItem('channel', 'true')
  }
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('signUpEmail')
      setSignUpEmail(email)
    }
  }, [])
  const query = useQuery(
    ['workspaces'],
    () => axios.get(`/organisation/workspaces`),
    {
      refetchOnMount: false,
      enabled: !!signUpEmail,
    }
  )
  const organisations = query?.data?.data?.data

  return (
    <>
      <Menu
        width="26rem"
        position="bottom-start"
        transitionProps={{ transition: 'pop-top-left' }}
        onClose={() => setUserMenuOpened(false)}
        onOpen={() => setUserMenuOpened(true)}
        withinPortal
      >
        <Menu.Target>
          {!data?.name ? (
            <Flex align="center" gap="sm">
              <Skeleton circle height={61} />
              <Stack spacing="sm">
                <Skeleton height={15} width={250} radius="md" />
                <Skeleton height={15} width={150} radius="md" />
              </Stack>
            </Flex>
          ) : (
            <UnstyledButton className={cx(classes.user)}>
              <Group spacing={7}>
                <ThemeIcon size="3rem" radius="md" variant="gradient">
                  <Text weight="bold" size="sm">
                    {data?.name[0].toUpperCase()}
                  </Text>
                </ThemeIcon>
                <Text weight="bold" size="md" pl="sm" mr="md" color="black">
                  {data?.name}
                </Text>
                <LuChevronsUpDown size="1.4rem" color="black" />
              </Group>
            </UnstyledButton>
          )}
        </Menu.Target>
        <Menu.Dropdown>
          {organisations &&
            organisations.map((organisation: any, index: number) => (
              <Menu.Item
                onClick={() => handleOpenWorkspace(organisation)}
                key={index}
                p="sm"
                fz="xs"
                icon={<TbSwitchHorizontal size="1.5rem" />}
              >
                {organisation.name}
              </Menu.Item>
            ))}
          <Menu.Item
            onClick={handleLogout}
            p="sm"
            fz="xs"
            icon={<TbLogout size="1.5rem" />}
          >
            ログアウト
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  )
}
