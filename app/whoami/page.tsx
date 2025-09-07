'use client';

import Content from '../components/Content';

export default function WhoAmI() {
  return (
    <Content title="Me" next="projects" prev="/">
      <p>
        I&apos;m a software engineer working in finance, mainly focused on building automation and web applications.
      </p>
    </Content>
  );
}
