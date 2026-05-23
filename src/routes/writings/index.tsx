import { createFileRoute, Link } from '@tanstack/react-router'
import Content from '../../components/Content'
import styles from './index.module.css'

const posts = [
  {
    title: 'Life in Pictures',
    date: '2025-06-09',
    tags: ['photography', 'firstpost'],
    url: '/writings/1',
  },
]

function Writings() {
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  return (
    <Content title="Writings" next="contact" prev="projects">
      <ul>
        {posts.map((post, index) => (
          <li key={index}>
            <Link to={post.url}>{post.title}</Link>
            <span className={styles.pubDate}>
              {' '}- {new Date(post.date).toLocaleDateString('en-NL', dateOptions)}
            </span>
            {post.tags && (
              <>
                <br className={styles.mobileBreak} />
                <span className={styles.tags}>
                  {post.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className={styles.tag}>#{tag}</span>
                  ))}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </Content>
  )
}

export const Route = createFileRoute('/writings/')({
  component: Writings,
})
