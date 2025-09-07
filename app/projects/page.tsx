'use client';

import Content from '../components/Content';

export default function Projects() {
  return (
    <Content title="Work" next="writings" prev="whoami">
      <blockquote style={{ color: 'var(--site-light)' }}>
        <span>&quot;What I cannot create, I do not understand.&quot; &#8211; Richard Feynman</span>
      </blockquote>
      <p>This is how I approach to a new journey in life. Each project I have is a different journey. It always starts with a basic product. Many iterations on a basic product leads to a great product.</p>
      <p>Projects are listed on my <a href="https://github.com/yvesyil">Github</a>.</p>
    </Content>
  );
}
