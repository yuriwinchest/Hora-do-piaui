import { NewsItem, VideoItem, NavItem } from './types';

export const HEADER_NAV: NavItem[] = [
  { label: 'Destaque', href: '/' },
  { label: 'Coluna Mariano Wikoli', href: '/coluna-mariano' },
  { label: 'Política', href: '/politica' },
  { label: 'Geral', href: '/geral' },
  { label: 'Vídeo', href: '/videos' },
];

export const SUB_NAV: NavItem[] = [
  { label: 'Coluna Mariano Wikoli', href: '/coluna-mariano' },
  { label: 'Política', href: '/politica' },
  { label: 'Geral', href: '/geral' },
];

export const TOP_NEWS: NewsItem[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d471',
    title: 'Senador Ciro Nogueira anuncia R$ 20 milhões para custeio da saúde',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAf3kCqNSl1OWG0ul9fI44WCbRHtvR2vwr1YMfLrn0ggA6qRUP6MOAcSsONH-wRl67XgHocGj9HHBp8pZxfK5A1tchGPz9yA5_t0rOcOQ1B_UqnM-kbcsB5UQLtsBDGffhT_sE-4AB2kV_j62N0OMmZLYSzI3GMN-8OsqpYVT-d3ZSOESljCOp4yyhGf4skTF-I3Jq8_HqqUWTY9Owq0Fz-lKU9YiqFJMUW4B0uuYUo1lADf79hHzentk0hCfKBPihn-FSZ9LMluMun',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d472',
    title: 'Vilarinho: vereadores terão consenso na sucessão de Enzo',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA34dNjzCBL4e1bXDK4l3yjWsRFmQSK6wPO0FiU5C140Urzq9QUoYDK6i-p_i99A_ibvUnYtgTVM-ZHESPM86tUsxsSxjFE4ZyfgMrQdK6BqS79FJ4rw45eQWyJdskgllhhzEqTUItOyRWeG4oCEidEmEB9uq7MHcr1SKS5Zet2rVqdAjXD8-iatDUHVEAez2BEOPoH31RW3eZSlNMK5mTFYiwApDevJ8jRbGxVWv9BV0amGSgLKOL4ZuUx_nDaHXIwrIcYI4xen6tK',
  },
];

export const SIDE_NEWS: NewsItem[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d473',
    title: 'CEO da Saks renuncia ao cargo em meio a dificuldades da empresa para quitar dívidas.',
    description: 'O presidente executivo da Saks Global, Richard Baker, assumirá o comando da varejista de luxo que criou com a aquisição da Neiman Marcus.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdQVZhku3mxpOqPv64OiTKqMv_EzHm2Lz5rqyQD0wrUhmCoNpRvKk-P4SWwR20YnrzRhK7cwHQtGBoYaK1ayz8cUTYRrCZfiYxSmlUSbRHN76-IUawM-R_QcgU1E7GfE7Lsi4Q28VM37uXvrAnzgAe9M1ZDMulwj4DtvoICw3IUOaF73YxdGYyR092j7rSZicLvjSRN6l3K8Zh8tyW5qzcJ588CYgburKJGscHXewKrqEdHCdiA4DjsqM8MxN2d_MTcornkN7nVp0Q',
    time: '18 horas atrás'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d474',
    title: 'A chinesa BYD ultrapassa a Tesla e se torna líder mundial em vendas de carros elétricos.',
    description: 'Sendo a maior fabricante de veículos elétricos nos Estados Unidos, a Tesla enfrenta nova concorrência global.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbv0mTEoAbguAdxhkaHmHpZJvUDaL0c1IulJn05_XLNTr2gxWB7LuGu1OrkgZWx9hCyKR9H4JWg42kkFcdVbWi89JRrAZ2fjGikkciScAXmUu0AHTC61Y89gylb63p7KTZO0CxnNsLAH9C4YxSHm6I3nD2Fsx5ngZzwZ5Mle3Ui3wDaLDjPW50kuz1Wmk5QPWtL0gXZecQhXkioAgEMIqLRJlfvb368hef5nuakdSNxNkbM4lIDGpQFVHZCgHYpoY0XCdtgQmthd0e',
  }
];

export const BANNER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfVUoR8lfxnWLj-7h3_IkliLX2YIUMOu3HjoRTAsJox1D4-NcCn0AAjIWQC2HvTJ3TfdA4c-WKShyNA15Y34RRUUt5_Hs2HIgiegrXhYUrVL4mjrQasfZF2498XmViVfWCMW8nk8lGSh0VbLoS8Vs3Qpk5jnBg2NPxba1YGfOcz5Fwhekg8xrnOpmYT7Qgnk22YFIgLQYBjKpOjjJ-hq6lJ-M7Lvs4dEui8GZsG59BtcznwaIhMd0xrobV7KGy5yoJfkBEqOJwoCxV';

export const MIDDLE_FEATURE: NewsItem = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d475',
  title: "Bandeira inicia 'campanha' no PT para conseguir ser vice",
  category: 'coluna-mariano',
  section: 'política',
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnjhyrJb7PBhHYX2jbHRrlxuApJo6JwRWdf3Yr8-q13nlmPoyuNJzvZUlzPjOD2z7GQX2ymhcvbnmNei1rrfEIV0NkCaWGt-5OFRmHVCiwRtWPQrcY6jGKU1Mmm_rRM-UPjH7LMah_9tfvMmXZOlGy0Lf-jjR5VQCYONsPrRR0uIxGbdTLNKyLJUHwoRIjiAJAd9tLqVVxlb06_ngpYOId-2sPJHScC03NFr5Os8qa-7J35hjpCv7ivqZwEAtoGbVM_MWSAFllbNBL'
};

export const MIDDLE_LIST: NewsItem[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d476',
    title: 'Ciro Nogueira diz que prefeito de Cajueiro da Praia é muito bem-vindo no PP',
    description: 'O prefeito anunciou que pedirá desfiliação do PT, após ter sido punido por declarar apoio a Ciro em 2026.',
    date: '22 de dezembro de 2025',
    time: '15h35',
    category: 'coluna-mariano',
    section: 'política',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBenwByWWf4nxc2Hybkavsd6gDsT89DXO-gYJECVrhOnAKIzhW0tkvjzDXivd3gZf3OuJQeHL2ApX2ECU54JYLg8_sVMmoZ3RvtHvEgrJZ1A1w7jlXoootm_8VjtBKc65LWq6Ey03e9W_s9CEKCzPlApAsMPW8tUYQBQ4mhyp96cY4xpJwVloQvCzDIb-OjZRwpMOIt4LixWIcwNMoB_YKToLfDQtrmg4KH9bDkh2PsJ0usOVJvvYc9vtCfMMvrGjsSl_Z6lQdZmgXU'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d477',
    title: 'Fábio Novo rebate prefeito que pediu desfiliação do PT: "só reforça que o partido acertou"',
    description: 'O prefeito de Cajueiro da Praia anunciou sua desfiliação após ter sido punido por apoio a Nogueira.',
    date: '22 de dezembro de 2025',
    time: '19h30',
    category: 'coluna-mariano',
    section: 'política',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzgAqjURttgRGbPcgYaWkiSMv4CImD-2VdAAxQsjA8yhDOf2zWzBqqngPGqXcvsQlrRPD9HpM39maIOq61OlMERVmCasl99HxAhBlxpgUdtvwM4US8kxS9sYJMoDVk1kkzD9uZE9PzGA1YR4trNCStCDhlW--GkNGZ-cApezO1PeM5qiZTgt2BqC08c7zI0rImCiNhfVoBi9qgUpC5Yyi9mm-9uPJZFR9o6DQpHGmXoozb-8X6M-3C6wJhkubX-O_JrjFGZ5kqDIHS'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d478',
    title: 'Prefeito Sílvio Mendes recebe alta após cinco dias internado no Hospital Unimed',
    description: 'O gestor anunciou neste domingo (20), através das redes sociais, a saída da unidade de saúde.',
    date: '21 de dezembro de 2025',
    time: '13h27',
    category: 'coluna-mariano',
    section: 'geral',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1SA9eEhu0hY7ugw5d6BmfcTFpU2LBhvyPmUDjRk4mEuLWqk9pNeMytqLvuUj0glv3WgmYoPjfsNksz7VSC_r92g0Q6EJaKVCqdUugfd13M8QE_d_hj8dqIcfmFWprwTuCFk5DnbwByAk3twgA7_qF7FSEsV4Yn0qFx1eZeDb4F9Br5DJk0ovySKy0VMcsLL0hBWQ4n-AQbt3zCcTfWg41w4b40s84HkELDZ3_ulVa5XKbL4EGyBQnX5ynGnPl9vmjHXWvfefU9WYT'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Assembleia discute mudanças no calendário eleitoral e impacto nos municípios',
    description: 'Parlamentares avaliam ajustes no cronograma e prazos que podem alterar a organization das campanhas locais.',
    date: '23 de dezembro de 2025',
    time: '10h12',
    category: 'coluna-mariano',
    section: 'política',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA34dNjzCBL4e1bXDK4l3yjWsRFmQSK6wPO0FiU5C140Urzq9QUoYDK6i-p_i99A_ibvUnYtgTVM-ZHESPM86tUsxsSxjFE4ZyfgMrQdK6BqS79FJ4rw45eQWyJdskgllhhzEqTUItOyRWeG4oCEidEmEB9uq7MHcr1SKS5Zet2rVqdAjXD8-iatDUHVEAez2BEOPoH31RW3eZSlNMK5mTFYiwApDevJ8jRbGxVWv9BV0amGSgLKOL4ZuUx_nDaHXIwrIcYI4xen6tK'
  }
];

export const AD_BANNER_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBa1chiMtK-NV5X1qDj-A0ufLNSNTZmCjLIoenjWpSPm4DCzF_uhGQ8Kn19hUBTNVpwfn_I3lW3fBHY1tLRws8YhU4ujzOfKMeSezAW_hSazNf-CAAxYVC48hq7nSjngCVz7kNjk3grxn-ngSop7z7RJfqWW-zRW76l07mHUfeN5WYIBA75OuSrKjQyzApcMPXmbsfIeHviBfR44_Ak5PPwI84abfYliuMbE7HW5PcncE2YJdVb5XCHmV04AjrnYx4aOc5grx6dlxd_';

export const DARK_FEATURE_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAk4TqhHTy5IkmHokTXRCYCbfFAJv7TdtmAkUMX3-JXrn0bpvIP_mSMJXrk-W19seOw38jy1iFhr0HlUSGUKIWwY2b6GJ7NMs56PlB_CDq0JXnWGHiVb2HfhMNJJS8V-YLnhOckmCTfsqKuamCi5zXyPlFlTt3HtJNbp9aJQPtzDVcSjMRyjaZTwthlAVlewLrcWg01-aWj5ZVnzG91U04EKaIt4pKPs5lALJ4PqbExBoh7zB_wNHbGp0dNa8fR3klw5awbgVNv7Rei';

export const VIDEOS: VideoItem[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    title: 'Why Exercise Is the Best Thing for Your Brain Health',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDF9c8HZnzu4cvDyi6ydY4Nm_WssStUrpqvtJvTLFmkV9gUR7jUjjygQCUMFjEP7Mf3bdhtvxTucw8tinfB2IRlJVgL4p6HUyFWZcTIT_CrAGvWFBJNDEmPsgbKJEFob4kGdR826Cy9zkXKLH8rnZyCeKNjyKlJ7lCYZ_qN2pjsIQ3q_EdNgIgRmXQeVFHvKdG8Vns9QSqUH1o3qoO2kv5u2wYBvv5BsVoRiNRMqIIc7p-w_rTuvZjEhBqpxg2AHMU3FgXGtZ3G8Jzw',
    tag: 'LIVE',
    tagColor: 'bg-red-600'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    title: "Harrowing Videos Show the Swiss Bar Fire's Rapid Spread",
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwwGsR8UwBaj00ja_NIDwup4C4BW2Hfyp72RU8C_WgkUr2SSLwn4HM0VqE5pLZgv9Fd7zBYC-Kr0XbkaRzrS1ZOz0Uy5RmS_c-Q_CmUVaL7O5JBfEX8M-8YFphtqMcZFUKoia7Kv331dfj8jVf3xS1vF2saE70AW4Ba9FA9uvs2F2MybUy4J2IqspTpOo3HLo-DQs5lMCaex-gs-ezg3EjfLrVmKdrePbb_VdYw3SfaLMtjJby7irs7K49T4UQHEU4VEo4kUlt4ipI',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
    title: 'Your Humidifier Could Make You Sick',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0dw2KJQpyDRrI3dY06-xoFu987sIl-e1F-uCtLGDSVQJcc1HJAJMmGrxi-rRwHFzubohihGkDqEHr1Un43drS47Y_4QX38hRqJHAE88-Aip5Uav40-kOjK-wosglve5FohiiZRljIggDr6IHbohAXrXARR4VDGPXfXvaNJsZm7DnXeJkReqn7nhhJeofi-_fvgixQuMSjNdBqMvvBdSgRfz9C4c-9H1lequnlnRW-IIOZOYbm2FF35Qkb-Y51tlKLBE93vgYIbk43',
    tag: 'WIRECUTTER',
    tagColor: 'bg-black/60'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d483',
    title: 'Trump Says U.S. Will Aid Protesters if Iran Uses Lethal Force',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnPx-ujgeDwu0LDXr327iH8Q10bbxhEVklP-Tal2iPI66swAKv_n3nwREWLY6qHwKUwHM8MbgHbdnDExQehDflvW2CqkUHfclf27jqqXXeNeHqDZmBr9CvNflJjMPcFupBpLm2LqeuQ-Aozr1W-du2OvXhJ-2NxdaSsyA-qhVG50jrGNIBfTCsgrRoMcwBcmmYprfcx3wnpBSSoB0AJvtSpwBq0M9nJL3Q7HrccpquqK3WmjMEvV-Fl03GUl2HdHZvdCJdMAyFsOU8',
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d484',
    title: 'Rice Krispies Treats',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD15r6NJuv9k1ezDogggEfHWPCX9HqZkYk4gdNxjjFUl24o8GGMJn1tiMY7KMSBoFxAHIhtf1vWrD9m6NghuHawE1It6ogkWhbokUvCQoclqviZUhSnuJMTkaIVlo6uzCfvcfYS9U57Vx6n6cLFSEBeCWP1ReJXvT5igLrhCM0RAv8fFqHFxfG0AGKnyN1F4ERp7fEX666RxVPFTRc7O6J-oYFxf8dj4ONvaPoQvdkv2yZkJQLmPkilJAmLd1XHAEuqivd7eztAvX7',
    tag: 'COOKING',
    tagColor: 'bg-purple-600'
  }
];
