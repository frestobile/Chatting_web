import React, { useEffect, useState } from 'react';
import {
  createStyles,
  Navbar,
  Text,
  Group,
  Grid,
  Skeleton,
  Modal,
  Flex,
  Stack,
  Box,
  ActionIcon,
  UnstyledButton,
  ScrollArea,
  Checkbox,
} from '@mantine/core';
import { useRouter } from 'next/router';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import axios from '../../services/axios';
import { notifications } from '@mantine/notifications';
import { CgAdd, CgChevronDown, CgClose } from 'react-icons/cg';
import { TbHash } from 'react-icons/tb';
import { LuHash, LuLock } from 'react-icons/lu';
import AccountSwitcher from '../account-switcher';
import Button from '../button';
import Input from '../input';
import TagInputs from '../tags-input';
import { useAppContext } from '../../providers/app-provider';
import {
  ApiError,
  ApiSuccess,
  Channel,
  Conversation,
  DefaultLayoutProps,
} from '../../utils/interfaces';
import Image from 'next/image';
import userIcon from '../../public/image/user-image.svg';
import homeIcon from '../../public/image/home-icon.svg';
import notification from '../../public/image/notification.svg';

const useStyles = createStyles((theme) => ({
  section: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  whiteBackground: {
    backgroundColor: 'white',
  },
  grayBackground: {
    backgroundColor: '#F5F5F5',
  },
  collectionLink: {
    display: 'flex',
    gap: theme.spacing.sm,
    alignItems: 'center',
    padding: `.7rem ${theme.spacing.xs}`,
    textDecoration: 'none',
    borderRadius: theme.radius.sm,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.dark[0],
    lineHeight: 1,
    fontWeight: 500,
    textTransform: 'lowercase',
    '&:hover': {
      backgroundColor: theme.colors.dark[6],
      color: theme.white,
    },
  },
}));

export default function DefaultLayout({
  children,
  thread,
  list,
  setMain,
  setList,
  main,
}: DefaultLayoutProps) {
  const router = useRouter();
  const { classes } = useStyles();
  const [opened, { open, close }] = useDisclosure(false);
  const [inviteOpened, { open: inviteOpen, close: inviteClose }] = useDisclosure(false);
  const {
    socket,
    organisationId,
    setChannels,
    refreshApp,
    data: organisationData,
    setMessageLoading,
    conversations,
    channels,
    setMessages,
    selected,
    setSelected,
    theme,
  } = useAppContext();

  const userId = organisationData?.profile?._id;

  const [channelUnreadMessagesNumber, setChannelUnreadMessagesNumber] = useState<Record<string, number>>({});
  const [conversationUnreadMessagesNumber, setConversationUnreadMessagesNumber] = useState<Record<string, number>>({});

  useEffect(() => {
    if (organisationData) {
      const channelUnreadData: Record<string, number> = {};
      const conversationUnreadData: Record<string, number> = {};
      organisationData.channels?.forEach((channel) => {
        channelUnreadData[channel._id as string] = channel.unreadMessagesNumber || 0;
      });
      organisationData.conversations?.forEach((conversation) => {
        conversationUnreadData[conversation._id as string] = conversation.unreadMessagesNumber || 0;
      });
      setChannelUnreadMessagesNumber(channelUnreadData);
      setConversationUnreadMessagesNumber(conversationUnreadData);
    }
  }, [organisationData]);

  useEffect(() => {
    socket.on('message-viewed', (message) => {
      setChannelUnreadMessagesNumber((channelUnreadMessagesNumber) => {
        return {
          ...channelUnreadMessagesNumber,
          [message.channelId]: channelUnreadMessagesNumber[message.channelId] - 1,
        };
      })
      setConversationUnreadMessagesNumber((conversationUnreadMessagesNumber) => {
        return {
          ...conversationUnreadMessagesNumber,
          [message.conversationId]: conversationUnreadMessagesNumber[message.conversationId] - 1,
        };
      })
    });
    return () => {
      socket.off('message-viewed');
    }
  }, [socket]);

  const form = useForm({
    initialValues: {
      name: '',
      isPublic: false,
      organisationId: organisationId,
    },
    validate: {
      name: (val) =>
        val.length > 3 ? null : 'チャンネル名は 3 単語以上である必要があります',
    },
  });

  const mutation = useMutation({
    mutationFn: (body) => {
      return axios.post('/channel', body);
    },
    onError(error: ApiError) {
      notifications.show({
        message: error?.response?.data?.data?.name,
        color: 'red',
        p: 'md',
      });
    },
    onSuccess(data: ApiSuccess['data']) {
      setChannels((channels) => [...(channels as Channel[]), data?.data?.data]);
      refreshApp();
      close();
      form.reset();
      notifications.show({
        message: `#${form.values.name} チャンネルが正常に作成されました`,
        color: 'green',
        p: 'md',
      });
    },
  });

  const inviteForm = useForm({
    initialValues: {
      emails: [''],
      organisationId,
    },
    validate: {
      emails: (val) => (val.length > 0 ? null : 'メールは複数必要です'),
    },
  });

  const [isDisabled, setIsDisabled] = useState(true);

  const inviteMutation = useMutation({
    mutationFn: (body) => {
      return axios.post('/teammates', body);
    },
    onError(error: ApiError) {
      notifications.show({
        message: error?.response?.data?.data?.name,
        color: 'red',
        p: 'md',
      });
    },
    onSuccess() {
      inviteClose();
      form.reset();
      notifications.show({
        message: `招待が ${inviteForm.values.emails.join(', ')}に正常に送信されました`,
        color: 'green',
        p: 'md',
      });
    },
  });

  function handleChannel(channel: Channel) {
    selected?._id !== channel?._id ? setMessageLoading(true) : setMessageLoading(false);
    setSelected(channel);
    router.push(`/c/${channel?._id}`);
    localStorage.setItem('channel', 'true');
    setMain(false);
    setList(false);
  }

  function handleConversation(conversation: Conversation) {
    selected?._id !== conversation?._id ? setMessageLoading(true) : setMessageLoading(false);
    setSelected(conversation);
    router.push(`/c/${conversation?._id}`);
    localStorage.setItem('channel', 'false');
    setMain(false);
    setList(false);
  }

  const [popupWindow, setPopupWindow] = useState(false);
  const [isOwner, setIsOwner] = useState(true);
  const [accessPermission, setAccessPermission] = useState(true);
  const isMobile = useMediaQuery('(max-width: 600px)');

  const checkEmail = typeof window !== 'undefined' ? localStorage.getItem('signUpEmail') : null;

  // It will be used in the future, but for now it is temporarily don't use for testing.
  useEffect(() => {
    const formData = new FormData();
    if(!checkEmail) return;
    formData.append('email', checkEmail)
    const fetchData = async () => {
      const response = await axios.post(
        'https://backend.ai-na.co.jp/api/check-member-ainaglam',
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.role === 'owner') {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }

      if (response.data?.status) {
        setAccessPermission(true);
      } else {
        setAccessPermission(false);
      }
    };

    fetchData();
  }, [checkEmail]);

  return (
    <>
      <Modal
        opened={inviteOpened}
        onClose={inviteClose}
        title={`${organisationData?.name} にユーザーを招待します`}
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
        <TagInputs
          onValueChange={(val) => {
            inviteForm.setFieldValue('emails', val);
            setIsDisabled(false);
          }}
        />
        <Flex align="center" gap="md" mt="lg">
          <Button
            disabled={isDisabled}
            onClick={() =>
              inviteMutation.mutate({
                emails: inviteForm.values.emails,
                organisationId,
              } as any)
            }
            loading={inviteMutation.isLoading}
            type="submit"
          >
            {inviteMutation.isLoading ? '' : '招待を送る'}
          </Button>
        </Flex>
      </Modal>
      <Modal
        opened={opened}
        onClose={close}
        title="チャンネルを作成する"
        centered
        size="lg"
        radius="lg"
        padding="xl"
        overlayProps={{
          color: theme.colors.dark[9],
          opacity: 0.55,
          blur: 2,
        }}
      >
        <form
          onSubmit={form.onSubmit(() =>
            mutation.mutate({
              name: form.values.name,
              isPublic: form.values.isPublic,
              organisationId,
            } as any)
          )}
        >
          <Stack spacing="md">
            <Input
              data-autofocus
              required
              label="Name"
              placeholder="e.g plan-budget"
              icon={<TbHash />}
              onChange={(event) =>
                form.setFieldValue('name', event.currentTarget.value)
              }
              error={
                form.errors.name &&
                'チャンネル名は 3 単語以上である必要があります'
              }
            />
            <Checkbox
              size={'lg'}
              label={'Private'}
              onChange={(event) =>
                form.setFieldValue('isPublic', !event.target.checked)
              }
            />
            <Text size="xs" mb="lg">
              チャネルは、トピックを中心に会話が行われる場所です。
              見つけやすく、理解しやすい名前を使用してください。
            </Text>
            <Button loading={mutation.isLoading} type="submit">
              {mutation.isLoading ? '' : 'チャンネルの作成'}
            </Button>
          </Stack>
        </form>
      </Modal>
      <Grid h="100vh" m="0" className={classes.whiteBackground} columns={24}>
        {!isMobile && (
          <Grid.Col className={classes.whiteBackground} span={1} p="0">
            <div className="flex flex-col w-full h-full">
              <div className="flex items-center justify-center w-full mt-12 mb-5 ">
                <img
                  crossOrigin="anonymous"
                  src={
                    organisationData?.profile?.avatar
                      ? `${process.env.NEXT_PUBLIC_API}/static/avatar/${organisationData?.profile.avatar}`
                      : `/avatars/${/^[a-z]$/i.test(organisationData?.profile?.displayName?.[0].toLowerCase() as string) ? organisationData?.profile?.displayName?.[0].toLowerCase() : 'default'}.png`
                  }
                  onError={(e) =>
                    (e.currentTarget.src = `/avatars/${/^[a-z]$/i.test(organisationData?.profile?.displayName?.[0].toLowerCase() as string) ? organisationData?.profile?.displayName?.[0].toLowerCase() : 'default'}.png`)
                  }
                  width={50}
                  height={50}
                  alt=""
                  className="rounded-xl hover:cursor-pointer"
                />
              </div>
              <div className="flex flex-col items-center justify-center w-full mt-5">
                <Image
                  src={homeIcon}
                  width={50}
                  height={50}
                  alt=""
                  className="rounded-full hover:cursor-pointer"
                />
                <p className="pt-2 text-xl text-center text-black">ホーム</p>
              </div>
              <div className="flex flex-col items-center justify-center w-full mt-5">
                <Image
                  src={notification}
                  width={50}
                  height={50}
                  alt=""
                  className="rounded-full hover:cursor-pointer"
                />
                <p className="pt-2 text-xl text-center text-black">通知</p>
              </div>
            </div>
          </Grid.Col>
        )}
        {(!isMobile || list) && (
          <Grid.Col
            span={isMobile ? 24 : 3}
            p="0"
            style={{
              ...(popupWindow
                ? { position: 'unset' }
                : { position: 'relative' }),
            }}
          >
            <Navbar
              className={classes.grayBackground}
              style={{ borderRight: 'none' }}
            >
              <Navbar.Section mt="sm" p="sm" pt="xs" pb="1.18rem">
                <div className="flex items-center justify-between">
                  <AccountSwitcher data={organisationData} />
                  {isMobile && (
                    <CgClose
                      onClick={() => {
                        setMain(false);
                        setList(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                </div>
              </Navbar.Section>
              <ScrollArea h={'100%'}>
                <Navbar.Section className={classes.section} px="0" mx="sm">
                  <Group pl="sm" align="center" position="apart">
                    <div className="flex gap-3">
                      <Text size="sm" weight="bold" mb="md" color="black">
                        スレッド
                      </Text>
                      <CgChevronDown size="2rem" color="black" />
                    </div>
                  </Group>

                  {!channels && (
                    <Stack spacing="sm">
                      <Skeleton height={15} width={250} radius="md" />
                      <Skeleton height={15} width={150} radius="md" />
                    </Stack>
                  )}

                  {channels?.map((channel) => {
                    if (!accessPermission && !channel.isPublic) {
                      return null;
                    }

                    return (
                      <UnstyledButton
                        w="100%"
                        px="sm"
                        onClick={() => handleChannel(channel)}
                        key={channel?._id}
                        className={classes.collectionLink}
                        style={{
                          transition: 'all .2s ease',
                          borderRadius: 20,
                          fontWeight: 'bold',
                          color:
                            selected?._id === channel?._id ? 'white' : 'black',
                          backgroundColor:
                            selected?._id === channel?._id
                              ? 'rgba(0, 0, 255, 0.5)'
                              : 'transparent',
                          position: 'relative',
                        }}
                      >
                        {channel.isPublic ? <LuHash /> : <LuLock />} {channel?.name}
                        {(channelUnreadMessagesNumber[channel?._id] ?? 0) > 0 && (
                          <p className="min-w-8 w-auto h-8 bg-red-500 rounded-full p-1 text-center text-white">
                            {channelUnreadMessagesNumber[channel?._id]}
                          </p>
                        )}
                      </UnstyledButton>
                    );
                  })}
                  {isOwner && (
                    <div className="flex flex-row items-center justify-center gap-3 mt-4">
                      <ActionIcon
                        onClick={open}
                        className={classes.grayBackground}
                        style={{ border: 'none', color: 'slategray' }}
                        variant="default"
                        size={30}
                      >
                        <CgAdd />
                      </ActionIcon>
                      <p className="pt-1 text-xl text-slate-500 hover:cursor-pointer">
                        新しいスレッドを作成する
                      </p>
                    </div>
                  )}
                </Navbar.Section>

                <Navbar.Section className={classes.section} px="0" mx="sm">
                  <Group pl="sm" align="center" position="apart">
                    <Text size="sm" weight="bold" mb="sm" color="black">
                      メンバー
                    </Text>
                  </Group>
                  {!conversations && (
                    <Stack spacing="sm">
                      <Skeleton height={15} width={250} radius="md" />
                      <Skeleton height={15} width={150} radius="md" />
                    </Stack>
                  )}
                  {conversations?.map((convo, index) => (
                    <UnstyledButton
                      w="100%"
                      px="sm"
                      onClick={() => handleConversation(convo)}
                      key={convo?._id}
                      className={classes.collectionLink}
                      style={{
                        transition: 'all .2s ease',
                        borderRadius: 10,
                        fontWeight: convo?.hasNotOpen?.includes(
                          organisationData?.profile?._id ?? ''
                        )
                          ? 'bold'
                          : '400',
                        color: selected?._id === convo._id ? 'white' : 'black',

                        backgroundColor:
                          selected?._id === convo._id
                            ? 'rgba(0, 0, 255, 0.5)'
                            : 'transparent',
                      }}
                    >
                      <img
                        crossOrigin="anonymous"
                        src={
                          convo?.avatar
                            ? `${process.env.NEXT_PUBLIC_API}/static/avatar/${convo?.avatar}`
                            : `/avatars/${/^[a-z]$/i.test(convo?.name?.[0].toLowerCase() as string) ? convo?.name?.[0].toLowerCase() : 'default'}.png`
                        }
                        className="w-12 h-12 rounded-lg"
                        onError={(e) =>
                          (e.currentTarget.src = `/avatars/${/^[a-z]$/i.test(convo?.name?.[0].toLowerCase() as string) ? convo?.name?.[0].toLowerCase() : 'default'}.png`)
                        }
                        alt="title"
                      />
                      <p className={`truncate ${(conversationUnreadMessagesNumber[convo?._id] ?? 0) > 0 ? `max-w-[100%]` : `max-w-[calc(100%-40px)]`}`}>{convo.name} {convo.isSelf ? '(あなた)' : ''}</p>
                      {(conversationUnreadMessagesNumber[convo?._id] ?? 0) > 0 && (
                        <p className="absolute right-4 min-w-8 w-auto h-8 bg-red-500 rounded-full p-1 text-center text-white">
                          {conversationUnreadMessagesNumber[convo?._id]}
                        </p>
                      )}

                      {convo.isOnline || convo.isSelf ? (
                        <Box
                          h=".7rem"
                          w=".7rem"
                          bg="green"
                          style={{
                            position: 'absolute',
                            borderRadius: '5rem',
                            left: '4rem',
                            marginBottom: '-20px'
                          }}
                        ></Box>
                      ) : (
                        <Box
                          h=".7rem"
                          w=".7rem"
                          bg="gray"
                          style={{
                            position: 'absolute',
                            borderRadius: '5rem',
                            left: '4rem',
                            marginBottom: '-20px'
                          }}
                        ></Box>
                      )}
                      {/* <Text fw="100" c={theme.colors.dark[3]} span>
                        {convo.isSelf ? 'あなた' : ''}{' '}
                      </Text> */}
                    </UnstyledButton>
                  ))}
                  {isOwner && (
                    <div className="flex flex-row items-center justify-center gap-3 mt-4">
                      <ActionIcon
                        onClick={inviteOpen}
                        className={classes.grayBackground}
                        style={{ border: 'none', color: 'slategray' }}
                        variant="default"
                        size={30}
                      >
                        <CgAdd />
                      </ActionIcon>
                      <p className="pt-1 text-xl text-slate-500 hover:cursor-pointer">
                        グループに招待する
                      </p>
                    </div>
                  )}
                </Navbar.Section>
              </ScrollArea>

              {/* {selected?.isConversation && !selected?.isSelf && (
                <Huddle
                  // selected={selected}
                  // theme={theme}
                  // socket={socket}
                  userId={userId as string}
                  popupWindow={popupWindow}
                  setPopupWindow={setPopupWindow}
                />
              )} */}
            </Navbar>
          </Grid.Col>
        )}
        {!isMobile && (
          <Grid.Col span="auto" p="0">
            {children}
          </Grid.Col>
        )}

        {isMobile && !main && !thread && (
          <Grid.Col span={24} p="0">
            {children}
          </Grid.Col>
        )}

        {thread && (
          <Grid.Col
            span={isMobile ? 24 : 6}
            p="0"
            style={{
              borderLeft: `1px solid ${theme.colors.dark[0]}`,
              boxShadow: "rgba(0, 0, 0, 0.45) 0px 25px 20px -20px;",
            }}
          >
            {thread}
          </Grid.Col>
        )}
      </Grid>
    </>
  )
}
