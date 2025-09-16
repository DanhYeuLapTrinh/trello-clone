import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import CreateBoardForm from './create-board-form'

export default function CreateBoardDialog({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-center'>Tạo bảng</DialogTitle>
        </DialogHeader>
        <CreateBoardForm />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>Hủy</Button>
          </DialogClose>
          <Button type='submit'>Tạo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
