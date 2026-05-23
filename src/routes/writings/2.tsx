import { createFileRoute } from '@tanstack/react-router'
import WritingLayout from '../../components/WritingLayout'
import Post from './2.mdx'

function PostTwo() {
  return (
    <WritingLayout>
      <Post />
    </WritingLayout>
  )
}

export const Route = createFileRoute('/writings/2')({
  component: PostTwo,
})
