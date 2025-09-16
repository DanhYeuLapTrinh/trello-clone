'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createWorkspace } from '@/features/workspaces/actions'
import { createWorkspaceSchema, CreateWorkspaceSchema } from '@/features/workspaces/validations'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'

export default function CreateWorkspaceForm() {
  const router = useRouter()

  const methods = useForm<CreateWorkspaceSchema>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      shortName: '',
      websiteUrl: '',
      description: ''
    }
  })

  const { execute, isPending, result } = useAction(createWorkspace, {
    onSuccess: () => {
      toast.success('Không gian làm việc đã được tạo thành công.')
      router.replace(`/w/${result.data?.shortName}/home`)
      setTimeout(() => {
        methods.reset()
      }, 500)
    },
    onError: (err) => {
      const errorMessage = err.error?.serverError || 'Lỗi khi tạo không gian làm việc.'
      toast.error(errorMessage)
    }
  })

  const onSubmit: SubmitHandler<CreateWorkspaceSchema> = (data) => {
    execute(data)
  }

  return (
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={methods.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={methods.control}
          name='shortName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên ngắn gọn</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={methods.control}
          name='websiteUrl'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trang web (tùy chọn)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={methods.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả (tùy chọn)</FormLabel>
              <FormControl>
                <Textarea className='resize-none' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='w-full' type='submit' disabled={isPending}>
          {isPending ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Xác nhận'}
        </Button>
      </form>
    </Form>
  )
}
