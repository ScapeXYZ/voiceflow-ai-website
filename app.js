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
  status.textContent = 'Sending your demo request…';
  let failureMessage = 'We could not confirm your request. Retry with the same details or use the email fallback.';
  try {
    const body = ['VoiceFlow AI demo request', ...['name', 'business', 'email', 'phone', 'message'].map(key => `${key}: ${String(data.get(key)).trim() || 'Not provided'}`)].join('\n\n');
    link.href = `mailto:tishola396@gmail.com?subject=${encodeURIComponent('VoiceFlow AI Demo Request')}&body=${encodeURIComponent(body)}`;
    const response = await fetch('/api/demo-request', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(Object.fromEntries(data)), signal: AbortSignal.timeout(22000)
    });
    const result = await response.json();
    if (!response.ok) {
      if (typeof result.message === 'string') failureMessage = result.message;
      throw new Error('Submission failed');
    }
    status.textContent = result.message;
  } catch {
    link.hidden = false;
    status.classList.add('error');
    status.textContent = `${failureMessage} Open the email fallback below if needed. If you already received confirmation, please do not send again.`;
  } finally {
    button.disabled = false;
    form.removeAttribute('aria-busy');
  }
});
form.addEventListener('input', () => {
  document.getElementById('email-draft').hidden = true;
  document.getElementById('form-status').textContent = '';
});
