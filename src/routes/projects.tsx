import { createFileRoute } from '@tanstack/react-router'
import Content from '../components/Content'

function Projects() {
  return (
    <Content title="Work" next="writings" prev="whoami">
      <blockquote style={{ color: 'var(--site-light)', marginBottom: '1em' }}>
        <span>&quot;What I cannot create, I do not understand.&quot;</span>
        <br />
        <span>&#8211; Richard Feynman</span>
      </blockquote>
      <p>This is how I approach to a new journey in life. Each project I have is a different journey. It always starts with a basic product. Many iterations on a basic product leads to a great product.</p>
      <ul>
        <li><a href="https://carthage.trading">Carthage</a> is an automated trading platform of financial securities. Currently work-in-progress.</li>
        <li><a href="https://mosaicrpg.com">Mosaic</a> is a platform where anyone can make their own table-top RPG games and play them.</li>
        <li><a href="https://clowa.net">CLOWA</a> is a collection of articles found on the web that are worth sharing.</li>
      </ul>
      <p>Open-source projects are listed on my <a href="https://github.com/yvesyil">Github</a>.</p>
    </Content>
  )
}

export const Route = createFileRoute('/projects')({
  component: Projects,
})
