'use client';

import Content from '../components/Content';

// Mock data for the writing - in a real app you'd fetch this from a CMS or markdown files
const posts = [
  {
    title: 'Life in Pictures',
    date: '2025-06-09',
    tags: ['photography', 'firstpost'],
    url: '/writings/1'
  }
];

export default function Writings() {
  const dateOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };

  return (
    <>
      <Content title="Writings" next="contact" prev="projects">
        <ul>
          {posts.map((post, index) => (
            <li key={index}>
              <a href={post.url}>{post.title}</a>
              <span className="pub-date">
                {' '}- {new Date(post.date).toLocaleDateString('en-NL', dateOptions)}
              </span>
              {post.tags && (
                <>
                  <br className="mobile-break" />
                  <span className="tags">
                    {post.tags.map((tag: string, tagIndex: number) => (
                      <span key={tagIndex} className="tag">#{tag}</span>
                    ))}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      </Content>

      <style jsx>{`
        .pub-date {
          font-size: 2vmin;
          color: var(--site-alt);
        }
        .tag {
          font-size: 2vmin;
          color: var(--site-alt);
          margin-right: 0.3rem;
        }
        .tags {
          margin-left: 0.3rem;
        }
        .mobile-break {
          display: none;
        }

        @media screen and (max-width: 900px) {
          .pub-date {
            font-size: 2vmax;
          }
          .tag {
            font-size: 2vmax;
          }
          .tags {
            margin-left: 1.5rem;
            position: relative;
            top: -1.0em;
          }
          .mobile-break {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
