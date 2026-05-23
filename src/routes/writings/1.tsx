import { createFileRoute } from '@tanstack/react-router'
import WritingLayout from '../../components/WritingLayout'
import Post from './1.mdx'

function PostOne() {
  return (
    <WritingLayout>
      <Post />
    </WritingLayout>
  )
}

export const Route = createFileRoute('/writings/1')({
  component: PostOne,
})
