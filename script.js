// script.js
(() => {
  'use strict';

  const CONFIG = {
    // Formato: 55 + DDD + número (somente dígitos)
    whatsappNumber: '5511987626047',

    // Mensagem padrão (pode personalizar por cliente)
    whatsappMessage:
      'Olá! Quero agendar um horário na barbearia. Pode me informar os horários disponíveis?',
  };

  const sanitizePhone = (value) => String(value ?? '').replace(/\D/g, '');

  const buildWhatsAppLink = (phone, message) => {
    const number = sanitizePhone(phone);
    if (!number) return '#';

    const text = encodeURIComponent(String(message ?? '').trim());
    return text ? `https://wa.me/${number}?text=${text}` : `https://wa.me/${number}`;
  };

  const applyWhatsAppLinks = () => {
    const url = buildWhatsAppLink(CONFIG.whatsappNumber, CONFIG.whatsappMessage);
    if (url === '#') return;

    document.querySelectorAll('[data-whatsapp]').forEach((el) => {
      // Não sobrescreve se o dev já definiu um href explícito (útil pra casos especiais)
      const hasCustomHref = el.getAttribute('href') && el.getAttribute('href') !== '#';
      if (!hasCustomHref) el.setAttribute('href', url);

      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');

      // Pequeno mimo de acessibilidade: se for um link sem texto claro
      if (el.tagName === 'A' && !el.getAttribute('aria-label') && !el.textContent.trim()) {
        el.setAttribute('aria-label', 'Abrir WhatsApp para agendar');
      }
    });
  };

  const setFooterYear = () => {
    const yearEl = document.getElementById('ano');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  };

  // roda quando o DOM está pronto (se o script estiver no fim do body, isso é imediato)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyWhatsAppLinks();
      setFooterYear();
    });
  } else {
    applyWhatsAppLinks();
    setFooterYear();
  }
})();
