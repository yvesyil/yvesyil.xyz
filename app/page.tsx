'use client';

import Content from './components/Content';

export default function Home() {
  return (
    <>
      <Content title="Yves Yil" next="whoami" prev="contact">
        <p className="subtext">
          IPA: <a style={{ fontFamily: 'Garamond, serif' }} href="http://ipa-reader.xyz/?text=iv%20j%C9%AAl">/iv jɪl/</a> Eng: [eev yil]
        </p>
      </Content>
      
      <style jsx global>{`
        .subtext, .subtext * {
          font-size: 2vmin;
        }

        @media screen and (max-width: 900px) {
          .subtext, .subtext * {
            font-size: 2vmax;
          }
        }
      `}</style>
    </>
  );
}
