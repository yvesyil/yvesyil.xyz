import { createFileRoute } from '@tanstack/react-router'
import Content from '../components/Content'

function WhoAmI() {
  return (
    <Content title="Me" next="projects" prev="/">
      <p>
        I&apos;m a software engineer working in finance, mainly focused on building automation and web applications.
      </p>
    </Content>
  )
}

export const Route = createFileRoute('/whoami')({
  component: WhoAmI,
})
