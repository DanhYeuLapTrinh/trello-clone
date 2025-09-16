import CreateWorkspaceForm from '@/components/workspaces/create-workspace-form'

export default function CreateWorkspacePage() {
  return (
    <div className='w-full h-screen flex justify-center items-center'>
      <div className='flex flex-col w-96'>
        <p className='text-xl font-semibold mb-14 text-center'>Tạo Không gian làm việc</p>
        <CreateWorkspaceForm />
      </div>
    </div>
  )
}
