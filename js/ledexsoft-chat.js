(function () {
  'use strict';

  var toggle = document.getElementById('assistantToggle');
  var panel = document.getElementById('assistantPanel');
  var closeButton = document.getElementById('assistantClose');
  var form = document.getElementById('assistantForm');
  var input = document.getElementById('assistantInput');
  var sendButton = form && form.querySelector('button[type="submit"]');
  var messagesElement = document.getElementById('assistantMessages');
  var suggestions = document.getElementById('assistantSuggestions');
  var title = document.getElementById('assistantTitle');
  var subtitle = document.querySelector('.assistant-panel__identity p');
  var note = document.querySelector('.assistant-panel__note');
  var languageSelect = document.getElementById('siteLanguage');
  if (!toggle || !panel || !form || !input || !messagesElement) return;

  var copy = {
    es: {
      title: 'Asistente LedexSoft', online: 'En línea · IA de Z.ai', greeting: '¡Hola! Puedo contarte sobre LedexSoft, CumaShop, Pymepedia y nuestros proyectos.',
      placeholder: 'Escribe tu pregunta…', send: 'Enviar mensaje', close: 'Cerrar asistente', note: 'Respuestas de IA, pueden contener errores. No envíes datos personales.',
      suggestions: ['¿Qué es CumaShop?', '¿Qué servicios ofrecen?'], thinking: 'Escribiendo…', error: 'No pude responder ahora. Inténtalo de nuevo en un momento.',
      network: 'No se pudo conectar. Revisa tu conexión e inténtalo otra vez.', rate: 'Has enviado varias preguntas seguidas. Espera un momento y vuelve a intentarlo.', busy: 'El servicio de IA está ocupado. Inténtalo de nuevo en unos minutos.'
    },
    en: {
      title: 'LedexSoft assistant', online: 'Online · Z.ai AI', greeting: 'Hi! Ask me about LedexSoft, CumaShop, Pymepedia, and our projects.',
      placeholder: 'Ask a question…', send: 'Send message', close: 'Close assistant', note: 'AI responses may be inaccurate. Do not send personal information.',
      suggestions: ['What is CumaShop?', 'What services do you offer?'], thinking: 'Thinking…', error: 'I could not answer just now. Please try again shortly.',
      network: 'Could not connect. Check your connection and try again.', rate: 'You have sent several questions in a row. Wait a moment and try again.', busy: 'The AI service is busy. Please try again in a few minutes.'
    },
    pt: {
      title: 'Assistente LedexSoft', online: 'Online · IA da Z.ai', greeting: 'Olá! Pergunte sobre a LedexSoft, CumaShop, Pymepedia e nossos projetos.',
      placeholder: 'Escreva sua pergunta…', send: 'Enviar mensagem', close: 'Fechar assistente', note: 'As respostas da IA podem conter erros. Não envie dados pessoais.',
      suggestions: ['O que é a CumaShop?', 'Quais serviços vocês oferecem?'], thinking: 'Pensando…', error: 'Não consegui responder agora. Tente novamente em instantes.',
      network: 'Não foi possível conectar. Verifique sua conexão e tente novamente.', rate: 'Você enviou várias perguntas seguidas. Aguarde um momento e tente novamente.', busy: 'O serviço de IA está ocupado. Tente novamente em alguns minutos.'
    },
    zh: {
      title: 'LedexSoft 助手', online: '在线 · Z.ai AI', greeting: '你好！我可以介绍 LedexSoft、CumaShop、Pymepedia 和我们的项目。',
      placeholder: '请输入问题…', send: '发送消息', close: '关闭助手', note: 'AI 回复可能不准确。请勿发送个人信息。',
      suggestions: ['CumaShop 是什么？', '你们提供哪些服务？'], thinking: '正在思考…', error: '暂时无法回答，请稍后再试。',
      network: '连接失败，请检查网络后重试。', rate: '提问过于频繁，请稍等片刻再试。', busy: 'AI 服务正忙，请几分钟后重试。'
    }
  };
  var history = [];
  var busy = false;
  var typing = null;

  function currentLanguage() {
    var lang = (languageSelect && languageSelect.value) || document.documentElement.lang || 'es';
    return copy[lang] ? lang : 'es';
  }
  function setTextIfChanged(element, value) {
    if (element && element.textContent !== value) element.textContent = value;
  }
  function addMessage(text, kind) {
    var bubble = document.createElement('div');
    bubble.className = 'assistant-message assistant-message--' + kind;
    bubble.textContent = text;
    messagesElement.appendChild(bubble);
    messagesElement.scrollTop = messagesElement.scrollHeight;
    return bubble;
  }
  function localize() {
    var strings = copy[currentLanguage()];
    setTextIfChanged(title, strings.title);
    setTextIfChanged(subtitle, strings.online);
    setTextIfChanged(note, strings.note);
    input.placeholder = strings.placeholder;
    input.setAttribute('aria-label', strings.placeholder);
    toggle.setAttribute('aria-label', strings.title);
    closeButton.setAttribute('aria-label', strings.close);
    sendButton.setAttribute('aria-label', strings.send);
    if (messagesElement.children.length === 1 && messagesElement.firstElementChild.dataset.greeting === 'true') {
      setTextIfChanged(messagesElement.firstElementChild, strings.greeting);
    }
    if (suggestions) {
      Array.prototype.forEach.call(suggestions.querySelectorAll('button'), function (button, index) {
        if (strings.suggestions[index]) setTextIfChanged(button, strings.suggestions[index]);
      });
    }
  }
  function open() {
    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add('is-open'); });
    toggle.setAttribute('aria-expanded', 'true');
    window.setTimeout(function () { input.focus(); }, 60);
  }
  function close() {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    window.setTimeout(function () { if (!panel.classList.contains('is-open')) panel.hidden = true; }, 230);
    toggle.focus();
  }
  function makeRequestId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  function historyByteLength() {
    var encoder = new TextEncoder();
    return history.reduce(function (total, message) { return total + encoder.encode(message.content).byteLength; }, 0);
  }
  async function send(text) {
    var prompt = text.trim();
    if (!prompt || busy) return;
    var config = window.CumaShopConfig;
    if (!config || !config.url || !config.anonKey) {
      addMessage(copy[currentLanguage()].error, 'error');
      return;
    }
    busy = true;
    if (suggestions) suggestions.hidden = true;
    addMessage(prompt, 'user');
    var encoder = new TextEncoder();
    while (history.length && (history.length > 6 || historyByteLength() + encoder.encode(prompt).byteLength > 5000)) history.splice(0, 2);
    history.push({ role: 'user', content: prompt });
    input.value = '';
    input.style.height = '';
    input.disabled = true;
    sendButton.disabled = true;
    typing = document.createElement('div');
    typing.className = 'assistant-message assistant-message--bot assistant-message--typing';
    typing.setAttribute('aria-label', copy[currentLanguage()].thinking);
    typing.innerHTML = '<i></i><i></i><i></i>';
    messagesElement.appendChild(typing);
    messagesElement.scrollTop = messagesElement.scrollHeight;
    try {
      var response = await fetch(config.url.replace(/\/$/, '') + '/functions/v1/ledexsoft-chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: config.anonKey, authorization: 'Bearer ' + config.anonKey },
        body: JSON.stringify({ requestId: makeRequestId(), messages: history }),
        signal: AbortSignal.timeout(30000)
      });
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        var message = response.status === 429 ? copy[currentLanguage()].rate : payload.error === 'provider_busy' ? copy[currentLanguage()].busy : copy[currentLanguage()].error;
        throw new Error(message);
      }
      if (typeof payload.answer !== 'string' || !payload.answer.trim()) throw new Error(copy[currentLanguage()].error);
      history.push({ role: 'assistant', content: payload.answer });
      if (history.length > 8) history = history.slice(-8);
      typing.remove();
      typing = null;
      addMessage(payload.answer, 'bot');
    } catch (error) {
      if (typing) typing.remove();
      typing = null;
      addMessage(error.name === 'TypeError' || error.name === 'TimeoutError' ? copy[currentLanguage()].network : (error.message || copy[currentLanguage()].error), 'error');
      history.pop();
    } finally {
      busy = false;
      input.disabled = false;
      sendButton.disabled = false;
      input.focus();
    }
  }

  var greeting = messagesElement.querySelector('.assistant-message--bot');
  if (greeting) greeting.dataset.greeting = 'true';
  toggle.addEventListener('click', function () { panel.hidden ? open() : close(); });
  closeButton.addEventListener('click', close);
  form.addEventListener('submit', function (event) { event.preventDefault(); send(input.value); });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
  input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 100) + 'px'; });
  if (suggestions) suggestions.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (button) send(button.textContent);
  });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !panel.hidden) close(); });
  document.addEventListener('click', function (event) {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) close();
  });
  if (languageSelect) languageSelect.addEventListener('change', localize);
  window.addEventListener('ledexsoft:languagechange', localize);
  localize();
}());
