import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { PageContainer } from '../components/common/PageContainer';
import { SEO } from '../components/common/SEO';

const ContactPage: React.FC = () => {
  return (
    <PageContainer title="Fale Conosco">
      <SEO
        title="Fale Conosco"
        description="Entre em contato com a equipe do Hora do Piaui."
      />

      <p className="max-w-2xl text-gray-700 font-medium mb-8">
        Para falar com a equipe do Hora do Piaui, use um dos canais abaixo.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <a
          href="mailto:horapiaui@gmail.com"
          className="rounded-2xl border border-gray-200 p-6 hover:border-black hover:shadow-sm transition-all"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white mb-4">
            <Mail size={18} />
          </div>
          <h2 className="text-lg font-black mb-1">E-mail</h2>
          <p className="text-gray-700 break-all">horapiaui@gmail.com</p>
        </a>

        <a
          href="https://wa.me/558688405335"
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-gray-200 p-6 hover:border-black hover:shadow-sm transition-all"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white mb-4">
            <MessageCircle size={18} />
          </div>
          <h2 className="text-lg font-black mb-1">Telefone / WhatsApp</h2>
          <p className="text-gray-700">+55 86 8840-5335</p>
        </a>
      </div>
    </PageContainer>
  );
};

export default ContactPage;
