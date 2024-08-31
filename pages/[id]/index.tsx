import {
    Avatar,
    Flex,
    Grid,
    LoadingOverlay,
    Skeleton,
    Stack,
    Text,
} from '@mantine/core'
import { NextPage } from 'next'
import Input from '../../components/input'
import { useForm } from '@mantine/form'
import Button from '../../components/button'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from '../../services/axios'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/router'
import React from 'react'
import { ApiError, ApiSuccess } from '../../utils/interfaces'

const Onboarding: NextPage = () => {
    const router = useRouter()
    const { id } = router.query
    const query = useQuery(
        ['organisation', id],
        () => axios.get(`/organisation/${id}`),
        {
            refetchOnMount: false,
            enabled: !!id,
        }
    )

    const organisationName = query?.data?.data?.data?.name

    const form = useForm({
        initialValues: {
            name: '',
        },
        validate: {
            name: (val) => (val.length > 3 ? null : '無効な名前'),
        },
    })

    const mutation = useMutation({
        mutationFn: (body) => {
            return axios.post('/organisation', body)
        },
        onError(error: ApiError) {
            notifications.show({
                message: error?.response?.data?.data?.name,
                color: 'red',
                p: 'md',
            })
            router.push('/signin')
        },
        onSuccess(data: ApiSuccess['data']) {
            router.push(`${data?.data?.data?._id}/coworkers`)
        },
    })

    if (query.isLoading) {
        return <LoadingOverlay visible />
    }

    return (
        <div className='grid grid-cols-5 h-screen m-0 gap-0 bg-gray-900'>
            <div className='col-span-1 py-[2rem] px-[3rem]'>
                {organisationName && (
                    <Flex align="center" gap="sm">
                        <Avatar size="lg" color="cyan" radius="xl">
                            {organisationName[0].toUpperCase()}
                        </Avatar>

                        <Text weight="bold" transform="capitalize">
                            {organisationName}
                        </Text>
                    </Flex>
                )}
                {!organisationName && (
                    <Flex gap={10} align="center">
                        <Skeleton height={50} width={50} circle />
                        <Stack spacing="xs" w="80%">
                            <Skeleton height={15} radius="xl" />
                            <Skeleton height={15} w="80%" radius="xl" />
                        </Stack>
                    </Flex>
                )}
            </div>
            <div className='col-span-4 py-[3rem] px-[8rem] bg-gray-900'>
                <Text size="xs">ステップ 1/3</Text>
                <Text size="3xl" lh="4rem" mt="2xl" c="white" fw={600}>
                    あなたの会社またはチームの<br />名前は何ですか?
                </Text>
                <Text size="xs" mt="sm">
                    これは Ainaglam ワークスペースの名前になります。チームが認識できる名前を選択してください。
                </Text>
                <form
                    onSubmit={form.onSubmit(() =>
                        mutation.mutate({ name: form.values.name, id } as any)
                    )}
                >
                    <Input
                        w="50%"
                        placeholder="Ex:Ai Study Room"
                        mt="xl"
                        required
                        label="名前"
                        defaultValue={organisationName}
                        // value={form.values.name}
                        onChange={(event) =>
                            form.setFieldValue('name', event.currentTarget.value)
                        }
                        error={form.errors.name && '名前は少なくとも 3 つにしてください'}
                    />
                    <Button loading={mutation.isLoading} type="submit" mt="lg" w="10%">
                        {mutation.isLoading ? '' : '次に'}
                    </Button>
                </form>
            </div>
        </div>
    )
}

export default Onboarding
