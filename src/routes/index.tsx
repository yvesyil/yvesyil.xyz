import { createFileRoute } from '@tanstack/react-router'
import Content from '../components/Content'
import styles from './index.module.css'

function Home() {
  return (
    <Content title="Yvesyil" next="whoami" prev="contact">
      <p className={styles.subtext}>
        IPA: <a style={{ fontFamily: 'Garamond, serif' }} href="http://ipa-reader.xyz/?text=iv%20j%C9%AAl">/iv jɪl/</a> Eng: [eev yil]
      </p>
    </Content>
  )
}

export const Route = createFileRoute('/')({
  component: Home,
})
