import { createFileRoute } from '@tanstack/react-router'
import Content from '../components/Content'

function Contact() {
  return (
    <Content title="Contact" next="/" prev="writings">
      <ul>
        <li><a href="mailto:doganyigityilmaz@gmail.com">E-mail</a></li>
        <li><a href="https://linkedin.com/in/d-yigit-yilmaz/">LinkedIn</a></li>
        <li><a href="https://github.com/yvesyil">Github</a></li>
      </ul>
    </Content>
  )
}

export const Route = createFileRoute('/contact')({
  component: Contact,
})
