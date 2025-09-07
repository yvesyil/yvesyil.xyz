'use client';

import Content from '../components/Content';

export default function Contact() {
  return (
    <Content title="Contact" next="/" prev="writings">
      <ul>
        <li><a href="mailto:me@yvesyil.xyz">E-mail</a></li>
        <li><a href="https://linkedin.com/in/d-yigit-yilmaz/">LinkedIn</a></li>
        <li><a href="https://github.com/yvesyil">Github</a></li>
      </ul>
    </Content>
  );
}
