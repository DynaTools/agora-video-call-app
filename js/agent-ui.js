// Arquivo para gerenciar a interface do usuário do agente AI

// Componente de UI para o agente AI
const AgentUI = {
    // Elementos da UI
    container: null,
    conversationContainer: null,
    controlsContainer: null,
    toggleButton: null,
    configPanel: null,
    azureKeyInput: null,
    azureRegionInput: null,
    geminiKeyInput: null,
    saveConfigButton: null,
    statusIndicator: null,
    
    // Estado do agente
    agent: null,
    isAgentActive: false,
    conversation: [],
    
    // Inicializa a UI do agente
    initialize() {
        this.createUIElements();
        this.setupEventListeners();
        
        // Cria uma instância do agente AI
        this.agent = new AIAgent();
        this.agent.onConversationUpdated = this.updateConversation.bind(this);
        
        // Carrega configurações salvas
        this.loadSavedConfig();
        
        console.log("UI do agente AI inicializada");
    },
    
    // Cria os elementos da UI
    createUIElements() {
        // Container principal
        this.container = document.createElement('div');
        this.container.className = 'agent-container control-panel';
        this.container.innerHTML = `
            <div class="agent-header">
                <h2>Assistente AI</h2>
                <div class="status-badge" id="agent-status">Inativo</div>
            </div>
        `;
        
        // Painel de configuração (inicialmente oculto)
        this.configPanel = document.createElement('div');
        this.configPanel.className = 'agent-config';
        this.configPanel.innerHTML = `
            <div class="config-header">
                <h3>Configuração do Assistente</h3>
                <button class="config-close-btn" id="close-config">×</button>
            </div>
            <div class="config-form">
                <div class="config-item">
                    <label for="azure-key">Azure Speech Key:</label>
                    <input type="password" id="azure-key" placeholder="Insira sua chave do Azure Speech">
                </div>
                <div class="config-item">
                    <label for="azure-region">Azure Region:</label>
                    <input type="text" id="azure-region" placeholder="ex: eastus" value="eastus">
                </div>
                <div class="config-item">
                    <label for="gemini-key">Gemini API Key:</label>
                    <input type="password" id="gemini-key" placeholder="Insira sua chave da API Gemini">
                </div>
                <div class="voice-selection">
                    <label for="voice-select">Voz do Assistente:</label>
                    <select id="voice-select">
                        <option value="pt-BR-AntonioNeural">António (Masculino)</option>
                        <option value="pt-BR-FranciscaNeural">Francisca (Feminina)</option>
                    </select>
                </div>
                <button id="save-agent-config" class="primary-button">Salvar Configuração</button>
            </div>
        `;
        
        // Container para a conversa
        this.conversationContainer = document.createElement('div');
        this.conversationContainer.className = 'conversation-container';
        this.conversationContainer.innerHTML = `
            <div class="conversation-messages" id="conversation-messages">
                <div class="message system">
                    <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>Configure o assistente AI e inicie uma videochamada para começar.</span>
                </div>
            </div>
        `;
        
        // Container para os controles
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.className = 'agent-controls';
        this.controlsContainer.innerHTML = `
            <button id="toggle-agent" class="primary-button" disabled>
                <svg class="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                Ativar Assistente AI
            </button>
            <button id="show-settings" class="secondary-button">
                <svg class="settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Configurações
            </button>
        `;
        
        // Adiciona elementos ao container principal
        this.container.appendChild(this.conversationContainer);
        this.container.appendChild(this.controlsContainer);
        
        // Adiciona o painel de configuração ao corpo do documento (para exibição modal)
        document.body.appendChild(this.configPanel);
        
        // Adiciona à página
        document.querySelector('.container').appendChild(this.container);
        
        // Armazena referências para os elementos de interesse
        this.toggleButton = document.getElementById('toggle-agent');
        this.settingsButton = document.getElementById('show-settings');
        this.closeConfigButton = document.getElementById('close-config');
        this.azureKeyInput = document.getElementById('azure-key');
        this.azureRegionInput = document.getElementById('azure-region');
        this.geminiKeyInput = document.getElementById('gemini-key');
        this.voiceSelect = document.getElementById('voice-select');
        this.saveConfigButton = document.getElementById('save-agent-config');
        this.statusIndicator = document.getElementById('agent-status');
        this.messagesContainer = document.getElementById('conversation-messages');
    },
    
    // Configura os listeners de eventos
    setupEventListeners() {
        // Botão de salvar configuração
        this.saveConfigButton.addEventListener('click', () => {
            this.saveConfig();
        });
        
        // Botão de alternar agente
        this.toggleButton.addEventListener('click', () => {
            this.toggleAgent();
        });
        
        // Botão de configurações
        this.settingsButton.addEventListener('click', () => {
            this.showConfigPanel();
        });
        
        // Botão de fechar configurações
        this.closeConfigButton.addEventListener('click', () => {
            this.hideConfigPanel();
        });
    },
    
    // Exibe o painel de configuração
    showConfigPanel() {
        this.configPanel.classList.add('config-visible');
    },
    
    // Oculta o painel de configuração
    hideConfigPanel() {
        this.configPanel.classList.remove('config-visible');
    },
    
    // Salva as configurações do agente
    saveConfig() {
        const azureKey = this.azureKeyInput.value.trim();
        const azureRegion = this.azureRegionInput.value.trim();
        const geminiKey = this.geminiKeyInput.value.trim();
        const voiceName = this.voiceSelect.value;
        
        if (!azureKey || !azureRegion || !geminiKey) {
            this.showNotification('Por favor, preencha todos os campos de configuração.', 'error');
            return;
        }
        
        // Atualiza as configurações globais
        AI_CONFIG.azure.speechKey = azureKey;
        AI_CONFIG.azure.speechRegion = azureRegion;
        AI_CONFIG.azure.voiceName = voiceName;
        AI_CONFIG.gemini.apiKey = geminiKey;
        
        // Salva as configurações no localStorage
        localStorage.setItem('agoraApp_azureRegion', azureRegion);
        localStorage.setItem('agoraApp_azureKey', azureKey);
        localStorage.setItem('agoraApp_geminiKey', geminiKey);
        localStorage.setItem('agoraApp_voiceName', voiceName);
        
        // Atualiza a UI
        this.toggleButton.disabled = !isJoined;
        
        // Esconde o painel de configuração
        this.hideConfigPanel();
        
        this.showNotification('Configuração salva com sucesso!', 'success');
    },
    
    // Mostra uma notificação temporária
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove a notificação após 3 segundos
        setTimeout(() => {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    },
    
    // Carrega as configurações salvas
    loadSavedConfig() {
        const azureKey = localStorage.getItem('agoraApp_azureKey');
        const azureRegion = localStorage.getItem('agoraApp_azureRegion');
        const geminiKey = localStorage.getItem('agoraApp_geminiKey');
        const voiceName = localStorage.getItem('agoraApp_voiceName');
        
        if (azureKey) this.azureKeyInput.value = azureKey;
        if (azureRegion) this.azureRegionInput.value = azureRegion;
        if (geminiKey) this.geminiKeyInput.value = geminiKey;
        if (voiceName) this.voiceSelect.value = voiceName;
        
        // Atualiza as configurações globais
        if (azureKey) AI_CONFIG.azure.speechKey = azureKey;
        if (azureRegion) AI_CONFIG.azure.speechRegion = azureRegion;
        if (geminiKey) AI_CONFIG.gemini.apiKey = geminiKey;
        if (voiceName) AI_CONFIG.azure.voiceName = voiceName;
        
        // Verifica se as configurações são válidas
        if (azureKey && azureRegion && geminiKey) {
            this.toggleButton.disabled = !isJoined;
        }
    },
    
    // Alterna o estado do agente (ativar/desativar)
    async toggleAgent() {
        if (!isJoined) {
            this.showNotification('Entre em um canal antes de ativar o assistente AI.', 'error');
            return;
        }
        
        if (this.isAgentActive) {
            // Desativa o agente
            this.agent.stopListening();
            this.isAgentActive = false;
            this.toggleButton.innerHTML = `
                <svg class="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                Ativar Assistente AI
            `;
            this.toggleButton.classList.remove('active');
            this.statusIndicator.textContent = 'Inativo';
            this.statusIndicator.className = 'status-badge inactive';
            
            this.addSystemMessage('Assistente AI desativado');
        } else {
            // Verifica se as configurações estão preenchidas
            if (!AIAgent.validateConfig(AI_CONFIG)) {
                this.showNotification('Configure as chaves de API antes de ativar o assistente AI.', 'error');
                this.showConfigPanel();
                return;
            }
            
            // Ativa o agente
            this.statusIndicator.textContent = 'Inicializando...';
            this.statusIndicator.className = 'status-badge initializing';
            
            try {
                // Inicializa o agente com as configurações atuais
                const initialized = await this.agent.initialize(
                    AI_CONFIG.azure.speechKey,
                    AI_CONFIG.azure.speechRegion,
                    AI_CONFIG.azure.voiceName
                );
                
                if (initialized) {
                    const started = this.agent.startListening();
                    
                    if (started) {
                        this.isAgentActive = true;
                        this.toggleButton.innerHTML = `
                            <svg class="mic-icon active" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                            Desativar Assistente AI
                        `;
                        this.toggleButton.classList.add('active');
                        this.statusIndicator.textContent = 'Ativo - Escutando';
                        this.statusIndicator.className = 'status-badge active';
                        
                        this.addSystemMessage('Assistente AI ativado. Você pode falar agora.');
                    } else {
                        throw new Error('Falha ao iniciar o reconhecimento de fala');
                    }
                } else {
                    throw new Error('Falha ao inicializar o agente AI');
                }
            } catch (error) {
                console.error('Erro ao ativar o agente:', error);
                this.statusIndicator.textContent = 'Erro';
                this.statusIndicator.className = 'status-badge error';
                this.addSystemMessage(`Erro ao ativar o assistente: ${error.message}`);
            }
        }
    },
    
    // Atualiza a conversa com novas mensagens
    updateConversation(message) {
        this.conversation.push(message);
        
        let messageHTML = '';
        let messageClass = '';
        
        switch (message.type) {
            case 'user':
                messageClass = 'user';
                messageHTML = `
                    <div class="message-avatar user-avatar">
                        <span>Você</span>
                    </div>
                    <div class="message-content">${message.text}</div>
                `;
                break;
            case 'assistant':
                messageClass = 'assistant';
                messageHTML = `
                    <div class="message-avatar assistant-avatar">
                        <span>AI</span>
                    </div>
                    <div class="message-content">${message.text}</div>
                `;
                break;
            case 'processing':
                messageClass = 'processing';
                messageHTML = `
                    <div class="processing-indicator">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                    <div class="message-content">${message.text}</div>
                `;
                break;
            case 'error':
                messageClass = 'error';
                messageHTML = `
                    <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div class="message-content">${message.text}</div>
                `;
                break;
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${messageClass}`;
        messageElement.innerHTML = messageHTML;
        
        this.messagesContainer.appendChild(messageElement);
        
        // Rola para a última mensagem
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    },
    
    // Adiciona uma mensagem do sistema à conversa
    addSystemMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message system';
        messageElement.innerHTML = `
            <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>${text}</span>
        `;
        
        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    },
    
    // Atualiza o estado da UI conforme o estado da aplicação
    updateState(appState) {
        // Habilita/desabilita o botão de ativar agente conforme o estado da aplicação
        if (appState === 'joined') {
            if (AIAgent.validateConfig(AI_CONFIG)) {
                this.toggleButton.disabled = false;
            }
        } else {
            // Se não estiver conectado, desativa o agente
            if (this.isAgentActive) {
                this.agent.stopListening();
                this.agent.cancelSpeech();
                this.isAgentActive = false;
                this.toggleButton.innerHTML = `
                    <svg class="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    Ativar Assistente AI
                `;
                this.toggleButton.classList.remove('active');
                this.statusIndicator.textContent = 'Inativo';
                this.statusIndicator.className = 'status-badge inactive';
            }
            
            this.toggleButton.disabled = true;
        }
    },
    
    // Limpa a conversa
    clearConversation() {
        this.conversation = [];
        this.messagesContainer.innerHTML = `
            <div class="message system">
                <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>Configure o assistente AI e inicie uma videochamada para começar.</span>
            </div>
        `;
    }
};

// Exporta o componente para uso em outros arquivos
window.AgentUI = AgentUI;