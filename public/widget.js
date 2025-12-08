(function() {
  // Get agent ID from script attribute
  const script = document.currentScript;
  const agentId = script.getAttribute('data-agent-id');
  const primaryColor = script.getAttribute('data-primary-color') || '#3B82F6';

  if (!agentId) {
    console.error('Builbox: data-agent-id attribute is required');
    return;
  }

  // Create container
  const container = document.createElement('div');
  container.id = 'builbox-widget';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  `;

  // Create button
  const button = document.createElement('button');
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  button.style.cssText = `
    width: 60px;
    height: 60px;
    border-radius: 30px;
    background: ${primaryColor};
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });

  // Create chat window
  const chatWindow = document.createElement('div');
  chatWindow.style.cssText = `
    display: none;
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 380px;
    height: 600px;
    max-height: calc(100vh - 120px);
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    flex-direction: column;
    overflow: hidden;
  `;

  // Chat header
  const header = document.createElement('div');
  header.style.cssText = `
    background: ${primaryColor};
    color: white;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <div>
      <div style="font-weight: 600; font-size: 16px;">Assistant IA</div>
      <div style="font-size: 12px; opacity: 0.9;">En ligne</div>
    </div>
    <button id="builbox-close" style="background: transparent; border: none; color: white; cursor: pointer; font-size: 24px;">&times;</button>
  `;

  // Messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'builbox-messages';
  messagesContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  // Input container
  const inputContainer = document.createElement('div');
  inputContainer.style.cssText = `
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 8px;
  `;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Tapez votre message...';
  input.style.cssText = `
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
  `;

  const sendButton = document.createElement('button');
  sendButton.textContent = 'Envoyer';
  sendButton.style.cssText = `
    padding: 10px 20px;
    background: ${primaryColor};
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  `;

  inputContainer.appendChild(input);
  inputContainer.appendChild(sendButton);

  chatWindow.appendChild(header);
  chatWindow.appendChild(messagesContainer);
  chatWindow.appendChild(inputContainer);

  container.appendChild(button);
  container.appendChild(chatWindow);
  document.body.appendChild(container);

  // State
  let isOpen = false;
  let conversationId = null;
  let sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  // Toggle chat
  button.addEventListener('click', () => {
    isOpen = !isOpen;
    chatWindow.style.display = isOpen ? 'flex' : 'none';

    if (isOpen && messagesContainer.children.length === 0) {
      // Add greeting message
      addMessage('assistant', 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?');
    }
  });

  document.getElementById('builbox-close').addEventListener('click', () => {
    isOpen = false;
    chatWindow.style.display = 'none';
  });

  // Add message to UI
  function addMessage(role, content, confidence) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.5;
      ${role === 'user'
        ? `background: ${primaryColor}; color: white; align-self: flex-end;`
        : 'background: #f3f4f6; color: #1f2937; align-self: flex-start;'}
    `;
    messageDiv.textContent = content;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Send message
  async function sendMessage(message) {
    if (!message.trim()) return;

    addMessage('user', message);
    input.value = '';
    sendButton.disabled = true;

    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'builbox-loading';
    loadingDiv.style.cssText = `
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 8px;
      background: #f3f4f6;
      align-self: flex-start;
    `;
    loadingDiv.textContent = '...';
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const response = await fetch(`${script.src.replace('/widget.js', '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agentId,
          message: message,
          conversationId: conversationId,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        conversationId = data.conversationId;
        messagesContainer.removeChild(loadingDiv);
        addMessage('assistant', data.message, data.confidence);
      } else {
        throw new Error(data.error || 'Erreur');
      }
    } catch (error) {
      messagesContainer.removeChild(loadingDiv);
      addMessage('assistant', 'Désolé, une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      sendButton.disabled = false;
    }
  }

  sendButton.addEventListener('click', () => {
    sendMessage(input.value);
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage(input.value);
    }
  });
})();
