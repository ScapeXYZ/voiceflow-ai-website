'use strict';
document.getElementById('year').textContent = new Date().getFullYear();
const toggle = document.querySelector('.nav-toggle');
const navigation = document.getElementById('navigation');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    toggle.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
  }
});
const form = document.getElementById('demo-form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.getElementById('form-status');
  const link = document.getElementById('email-draft');
  const button = form.querySelector('button');
  link.hidden = true;
  status.classList.remove('error');
  const data = new FormData(form);
  for (const name of ['name', 'business', 'message']) {
    const input = form.elements.namedItem(name);
    input.setCustomValidity(String(data.get(name)).trim() ? '' : 'Please enter a value.');
    input.addEventListener('input', () => input.setCustomValidity(''), {once: true});
  }
  if (!form.reportValidity()) return;
  button.disabled = true;
  form.setAttribute('aria-busy', 'true');
  status.textContent = 'Preparing your email draft…';
  try {
    await new Promise(resolve => setTimeout(resolve, 250));
    const body = ['VoiceFlow AI demo request', ...['name', 'business', 'email', 'phone', 'message'].map(key => `${key}: ${String(data.get(key)).trim() || 'Not provided'}`)].join('\n\n');
    link.href = `mailto:tishola396@gmail.com?subject=${encodeURIComponent('VoiceFlow AI Demo Request')}&body=${encodeURIComponent(body)}`;
    link.hidden = false;
    status.textContent = 'Draft ready. Open it below, then review and send in your email app. Nothing has been sent or stored.';
  } catch {
    status.classList.add('error');
    status.textContent = 'The draft could not be prepared. Please email tishola396@gmail.com directly.';
  } finally {
    button.disabled = false;
    form.removeAttribute('aria-busy');
  }
});
form.addEventListener('input', () => {
  document.getElementById('email-draft').hidden = true;
  document.getElementById('form-status').textContent = '';
});
