import React, { useEffect } from 'react';
import {
  Avatar,
  Divider,
  Flex,
  Text,
  Tooltip,
  createStyles,
  getStylesRef,
} from '@mantine/core';
import DOMPurify from 'dompurify';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { useAppContext } from '../providers/app-provider';
import { formatDate } from '../utils/helpers';
import { LuReplyAll, LuTrash } from 'react-icons/lu';
import { useRouter } from 'next/router';
import { BsChat } from 'react-icons/bs';
import { useMediaQuery } from '@mantine/hooks';
import { useInView } from 'react-intersection-observer';
import { MessageListProps, Message as MessageType, Thread } from '../utils/interfaces';

const useStyles = createStyles((theme) => ({
  message: {
    padding: theme.spacing.sm,
    position: 'relative',
    '&:hover': {
      [`& .${getStylesRef('actions')}`]: {
        display: 'flex !important',
      },
    },
  },
  actions: {
    ref: getStylesRef('actions'),
    display: 'none !important',
    position: 'absolute',
    right: 0,
    top: -20,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.dark[8],
    border: `1px solid ${theme.colors.dark[4]}`,
    '& > *': {
      cursor: 'pointer',
      paddingInline: theme.spacing.sm,
      paddingBlock: theme.spacing.xs,
      borderRadius: theme.radius.md,
      '&:hover': {
        backgroundColor: theme.colors.dark[5],
      },
    },
  },
  reaction: {
    color: theme.colors.dark[1],
    paddingInline: theme.spacing.sm,
    paddingBlock: theme.spacing.xs,
    cursor: 'pointer',
    borderRadius: 10,
    border: `1px solid ${theme.colors.dark[5]}`,
    transition: 'all .2s ease',
    '&:hover': {
      backgroundColor: theme.colors.dark[5],
    },
  },
  viewThread: {
    cursor: 'pointer',
    padding: theme.spacing.xs,
    paddingLeft: '1.5rem',
    border: `1px solid transparent`,
    width: 'fit-content',
    '&:hover': {
      border: `1px solid ${theme.colors.dark[5]}`,
      borderRadius: theme.spacing.sm,
      backgroundColor: theme.colors.dark[9],
      [`& .${getStylesRef('reply')}`]: {
        display: 'none !important',
      },
      [`& .${getStylesRef('view')}`]: {
        display: 'flex !important',
      },
    },
  },
  reply: {
    ref: getStylesRef('reply'),
  },
  view: {
    ref: getStylesRef('view'),
    display: 'none !important',
  },
  date: {
    border: `1px solid ${theme.colors.dark[5]}`,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.xs,
    textAlign: 'center',
    fontWeight: 600,
  },
}));

const Message: React.FC<{
  msg: MessageType | Thread
  userId: string
  isThread: boolean | undefined
}> = ({ msg, userId, isThread }) => {
  const { socket, theme, channelId } = useAppContext();
  const { ref, inView } = useInView({
    threshold: 0.1,
  });
  const { classes } = useStyles();
  const router = useRouter();

  useEffect(() => {
    if (inView) {
      const hasRead = msg.hasRead;
      socket.emit('message-view', msg._id, userId);
    }
  }, [inView, msg._id, msg.hasRead, socket]);

  const handleReaction = (emoji: string, id: string) => {
    socket.emit('reaction', { emoji, id, userId, isThread });
  };

  return (
    <Flex
      direction="column"
      className={classes.message}
      gap="sm"
      key={msg?._id}
      data-message-id={msg?._id}
      data-message-seen={msg?.hasRead}
      ref={ref}
    >
      <Flex gap="sm">
        <Flex className={classes.actions} gap="xs" align="center">
          <Tooltip
            label="完了"
            withArrow
            position="top"
            onClick={() => handleReaction('✅', msg._id)}
          >
            <Text fz="md" tt="lowercase" c={theme.colors.dark[3]} span>
              ✅
            </Text>
          </Tooltip>
          <Tooltip
            label="見てみる"
            withArrow
            position="top"
            onClick={() => handleReaction('👀', msg._id)}
          >
            <Text fz="md" tt="lowercase" c={theme.colors.dark[3]} span>
              👀
            </Text>
          </Tooltip>
          <Tooltip
            label="いいね"
            withArrow
            position="top"
            onClick={() => handleReaction('👍', msg._id)}
          >
            <Text fz="md" tt="lowercase" c={theme.colors.dark[3]} span>
              👍
            </Text>
          </Tooltip>
          <Tooltip
            label="ハート"
            withArrow
            position="top"
            onClick={() => handleReaction('💖', msg._id)}
          >
            <Text fz="md" tt="lowercase" c={theme.colors.dark[3]} span>
              💖
            </Text>
          </Tooltip>
          {!isThread && (
            <Tooltip
              label="返信する"
              withArrow
              position="top"
              onClick={() => router.push(`/c/${router.query.id}/t/${msg._id}`)}
            >
              <Flex align="flex-start" gap="xs">
                <LuReplyAll color={theme.colors.dark[1]} />
                <Text fz="xs" fw="bold" c={theme.colors.dark[1]}>
                  reply
                </Text>
              </Flex>
            </Tooltip>
          )}
          {userId === msg.sender?._id && (
            <Tooltip
              label="削除する"
              withArrow
              position="top"
              onClick={async () => {
                if ( confirm("本当に投稿を削除してもよろしいですか？") ){
                  socket.emit('message-delete', {
                    channelId,
                    messageId: msg._id,
                    userId,
                    isThread,
                  })
                }
              }}
            >
              <Flex align="flex-start" gap="xs">
                <LuTrash color={theme.colors.dark[1]} />
                <Text fz="xs" fw="bold" c={theme.colors.dark[1]}>
                  Delete
                </Text>
              </Flex>
            </Tooltip>
          )}
        </Flex>
        <img
          crossOrigin="anonymous"
          src={
            msg?.sender?.avatar
              ? `${process.env.NEXT_PUBLIC_API}/static/avatar/${msg?.sender?.avatar}`
              : `/avatars/${/^[a-z]$/i.test(msg?.sender?.username?.[0].toLowerCase() as string) ? msg?.sender?.username?.[0].toLowerCase() : 'default'}.png`
          }
          className="w-12 h-12 rounded-lg"
          onError={(e) =>
            (e.currentTarget.src = `/avatars/${/^[a-z]$/i.test(msg?.sender?.username?.[0].toLowerCase() as string) ? msg?.sender?.username?.[0].toLowerCase() : 'default'}.png`)
          }
          alt="title"
        />

        <Flex direction="column" w={'95%'}>
          <Flex
            align="center"
            gap="md"
            w={'90%'}
            justify="space-between"
          >
            <Text fz="sm" fw="600" c="black" span>
              {msg?.sender?.displayName}
            </Text>
            <Tooltip
              label={formatDate(msg?.createdAt)?.time}
              withArrow
              position="right"
            >
              <Text
                fz="xs"
                tt="lowercase"
                c={theme.colors.dark[3]}
                pr={"10px"}
                span
              >
                {formatDate(msg?.createdAt)?.timeRender}
              </Text>
            </Tooltip>
          </Flex>
          <div
            className={`text-gray-600 
              text-xl 
              font-medium 
              break-words
              p-[1.5rem] 
              bg-gray-200 
              w-[90%] 
              rounded-[10px]`}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(msg?.content as string, {
                ADD_ATTR: ['target'],
              }),
            }}
          />
          <Flex align="center" gap="sm">
            {msg.reactions?.map((reaction) => {
              const reactionsFrom = reaction.reactedToBy.map(
                (user) => user.username
              )

              return (
                <Tooltip
                  label={reactionsFrom?.join(', ')}
                  withArrow
                  position="top"
                  key={reaction._id}
                >
                  <Text
                    role="button"
                    fz="xs"
                    tt="lowercase"
                    className={classes.reaction}
                    span
                    onClick={() =>
                      handleReaction(reaction?.emoji, msg?._id)
                    }
                    style={{
                      backgroundColor: reaction?.reactedToBy?.some(
                        (user) => user?._id === userId
                      )
                        ? theme.colors.dark[5]
                        : 'transparent',
                    }}
                  >
                    {reaction?.emoji} &nbsp;
                    {reaction?.reactedToBy?.length}
                  </Text>
                </Tooltip>
              )
            })}
          </Flex>

          {(msg as MessageType).threadLastReplyDate && (
            <Flex
              align="center"
              gap="sm"
              className={classes.viewThread}
              onClick={() => router.push(`/c/${router.query.id}/t/${msg._id}`)}
            >
              <Text fz="xs" ml={14} c={theme.colors.dark[2]}>
                {(msg as MessageType).threadReplies.map((user, idx) => {
                  if (idx < 2) return user.displayName;
                }).join(', ')}
              </Text>
              {(msg as MessageType).threadReplies.length > 1 && (
                <Text fz="xs" ml={8} c={theme.colors.dark[2]}>
                  {'他'}
                  {(msg as MessageType).threadReplies.length}
                  {'人'}
                </Text>
              )}
              {msg.hasOwnProperty('threadRepliesCount') && (
                <Flex align="center" ml={16}>
                  <BsChat />
                  <Text fz="xs" ml={4} c={theme.colors.dark[2]}>
                    コメント {' '}
                    {(msg as MessageType).threadRepliesCount} {'件'}
                  </Text>
                </Flex>
              )}
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

const MessageList: React.FC<MessageListProps> = ({
  userId,
  isThread,
  messages,
}) => {
  const { classes } = useStyles();
  const isMobile = useMediaQuery('(max-width: 600px)');

  return (
    <>
      {messages?.map((msg) => {
        if (msg.type === 'date') {
          return (
            <Divider
              key={msg._id}
              styles={{
                label: {
                  '& > div': {
                    backgroundColor: 'white',
                    border: 'none',
                    marginInline: '25px',
                  },
                },
              }}
              label={
                <Text size="xs" px="md" color="gray" className={classes.date}>
                  {msg.content}
                </Text>
              }
              labelPosition="center"
              my="md"
              size={1}
            />
          );
        } else {
          return (
            <Message
              key={msg._id}
              msg={msg}
              userId={userId}
              isThread={isThread}
            />
          );
        }
      })}
    </>
  );
};

export default MessageList;