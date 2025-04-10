/**
 * Interface do usuário para o assistente AI
 * Gerencia a interface do assistente virtual, incluindo configuração e visualização de conversas
 */

// Componente de UI para o agente AI
const AgentUI = {
    // Elementos da UI
    elements: {
        container: null,
        conversationContainer: null,
        controlsContainer: null,
        toggleButton: null,
        configPanel: null,
        azureKeyInput: null,
        azureRegionInput: null,
        geminiKeyInput: null,
        voiceSelect: null,
        saveConfigButton: null,
        statusIndicator: null,
        messagesContainer: null,
        clearConversationButton: null,
        speakingRateSlider: null,
        speakingPitchSlider: null
    },
    
    // Estado do agente
    agent: null,
    isAgentActive: false,
    conversation: [],
    voiceOptions: [
        { id: "pt-BR-AntonioNeural", name: "António (Masculino)" },
        { id: "pt-BR-FranciscaNeural", name: "Francisca (Feminina)" },
        { id: "pt-BR-BrendaNeural", name: "Brenda (Feminina)" },
        { id: "pt-BR-LeticiaNeural", name: "Letícia (Feminina)" },
        { id: "pt-BR-ManuelaNeural", name: "Manuela (Feminina)" },
        { id: "pt-BR-NicolauNeural", name: "Nicolau (Masculino)" },
        { id: "pt-BR-ValerioNeural", name: "Valério (Masculino)" }
    ],
    
    /**
     * Inicializa a UI do agente
     */
    initialize: function() {
        // Cria os elementos da UI
        this.createUIElements();
        
        // Configura os event listeners
        this.setupEventListeners();
        
        // Cria uma instância do agente AI
        this.agent = new AIAgent();
        this.agent.onConversationUpdated = this.updateConversation.bind(this);
        
        // Carrega configurações salvas
        this.loadSavedConfig();
        
        console.log("UI do agente AI inicializada");
    },
    
    /**
     * Cria os elementos da UI
     */
    createUIElements: function() {
        // Container principal
        this.elements.container = document.createElement('div');
        this.elements.container.className = 'agent-container control-panel';
        this.elements.container.innerHTML = `
            <div class="agent-header">
                <h2>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
                        <path d="M12 2c-4.97 0-9 4.03-9 9 0 3.23 1.71 6.08 4.25 7.68.16.07.32.14.49.2.79.27 1.64.42 2.53.42.89 0 1.74-.15 2.53-.41.17-.06.33-.13.49-.21 2.54-1.6 4.25-4.45 4.25-7.68 0-4.97-4.03-9-9-9z"></path>
                        <path d="M12 5v11"></path>
                        <rect x="8" y="9" width="8" height="3" rx="1.5"></rect>
                    </svg>
                    Assistente AI
                </h2>
                <div class="status-badge inactive" id="agent-status">Inativo</div>
            </div>
        `;
        
        // Painel de configuração (inicialmente oculto)
        this.elements.configPanel = document.createElement('div');
        this.elements.configPanel.className = 'agent-config';
        this.elements.configPanel.innerHTML = `
            <div class="config-form">
                <div class="config-header">
                    <h3>Configuração do Assistente</h3>
                    <button class="config-close-btn" id="close-config">×</button>
                </div>
                <div class="config-body">
                    <div class="config-tabs">
                        <div class="config-tab active" data-tab="api-keys">Chaves de API</div>
                        <div class="config-tab" data-tab="voice-settings">Configurações de Voz</div>
                    </div>
                    
                    <div class="config-tab-content" id="api-keys">
                        <div class="config-item">
                            <label for="azure-key">Azure Speech Key:</label>
                            <input type="password" id="azure-key" placeholder="Insira sua chave do Azure Speech">
                            <div class="help-text">Necessária para reconhecimento e síntese de fala</div>
                        </div>
                        <div class="config-item">
                            <label for="azure-region">Azure Region:</label>
                            <input type="text" id="azure-region" placeholder="ex: eastus" value="eastus">
                            <div class="help-text">A região onde seu serviço Azure foi criado</div>
                        </div>
                        <div class="config-item">
                            <label for="gemini-key">Gemini API Key:</label>
                            <input type="password" id="gemini-key" placeholder="Insira sua chave da API Gemini">
                            <div class="help-text">Necessária para processamento de linguagem natural</div>
                        </div>
                    </div>
                    
                    <div class="config-tab-content hidden" id="voice-settings">
                        <div class="voice-selection">
                            <label for="voice-select">Voz do Assistente:</label>
                            <select id="voice-select">
                                ${this.voiceOptions.map(voice => 
                                    `<option value="${voice.id}">${voice.name}</option>`).join('')}
                            </select>
                            <div class="help-text">Selecione a voz que o assistente usará</div>
                        </div>
                        
                        <div class="config-item">
                            <label for="speaking-rate">Velocidade da Fala:</label>
                            <div class="slider-container">
                                <input type="range" id="speaking-rate" min="0.5" max="2" step="0.1" value="1.0">
                                <span id="speaking-rate-value">1.0x</span>
                            </div>
                            <div class="help-text">Ajuste a velocidade com que o assistente fala</div>
                        </div>
                        
                        <div class="config-item">
                            <label for="speaking-pitch">Tom de Voz:</label>
                            <div class="slider-container">
                                <input type="range" id="speaking-pitch" min="0.5" max="1.5" step="0.1" value="1.0">
                                <span id="speaking-pitch-value">1.0x</span>
                            </div>
                            <div class="help-text">Ajuste o tom de voz do assistente</div>
                        </div>
                    </div>
                </div>
                <div class="config-footer">
                    <button id="save-agent-config" class="primary-button">Salvar Configuração</button>
                </div>
            </div>
        `;
        
        // Container para a conversa
        this.elements.conversationContainer = document.createElement('div');
        this.elements.conversationContainer.className = 'conversation-container';
        this.elements.conversationContainer.innerHTML = `
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
        this.elements.controlsContainer = document.createElement('div');
        this.elements.controlsContainer.className = 'agent-controls';
        this.elements.controlsContainer.innerHTML = `
            <button id="toggle-agent" class="primary-button" disabled>
                <svg class="mic-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                <span>Ativar Assistente AI</span>
            </button>
            <button id="show-settings" class="secondary-button">
                <svg class="settings-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>Configurações</span>
            </button>
            <button id="clear-conversation" class="secondary-button" disabled>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Limpar Conversa</span>
            </button>
        `;
        
        // Botão de feedback (opcional)
        const feedbackControl = document.createElement('div');
        feedbackControl.className = 'feedback-control';
        feedbackControl.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
        `;
        
        // Adiciona elementos ao container principal
        this.elements.container.appendChild(this.elements.conversationContainer);
        this.elements.container.appendChild(this.elements.controlsContainer);
        this.elements.container.appendChild(feedbackControl);
        
        // Adiciona o painel de configuração ao corpo do documento (para exibição modal)
        document.body.appendChild(this.elements.configPanel);
        
        // Adiciona à página
        document.querySelector('.container').appendChild(this.elements.container);
        
        // Armazena referências para os elementos de interesse
        this.elements.toggleButton = document.getElementById('toggle-agent');
        this.elements.settingsButton = document.getElementById('show-settings');
        this.elements.closeConfigButton = document.getElementById('close-config');
        this.elements.azureKeyInput = document.getElementById('azure-key');
        this.elements.azureRegionInput = document.getElementById('azure-region');
        this.elements.geminiKeyInput = document.getElementById('gemini-key');
        this.elements.voiceSelect = document.getElementById('voice-select');
        this.elements.saveConfigButton = document.getElementById('save-agent-config');
        this.elements.statusIndicator = document.getElementById('agent-status');
        this.elements.messagesContainer = document.getElementById('conversation-messages');
        this.elements.clearConversationButton = document.getElementById('clear-conversation');
        this.elements.speakingRateSlider = document.getElementById('speaking-rate');
        this.elements.speakingPitchSlider = document.getElementById('speaking-pitch');
    },
    
    /**
     * Configura os listeners de eventos
     */
    setupEventListeners: function() {
        // Botão de salvar configuração
        this.elements.saveConfigButton.addEventListener('click', () => {
            this.saveConfig();
        });
        
        // Botão de alternar agente
        this.elements.toggleButton.addEventListener('click', () => {
            this.toggleAgent();
        });
        
        // Botão de configurações
        this.elements.settingsButton.addEventListener('click', () => {
            this.showConfigPanel();
        });
        
        // Botão de fechar configurações
        this.elements.closeConfigButton.addEventListener('click', () => {
            this.hideConfigPanel();
        });
        
        // Botão de limpar conversa
        this.elements.clearConversationButton.addEventListener('click', () => {
            this.clearConversation();
        });
        
        // Tabs de configuração
        const tabs = document.querySelectorAll('.config-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                this.switchConfigTab(tabId);
            });
        });
        
        // Sliders de controle de voz
        if (this.elements.speakingRateSlider) {
            this.elements.speakingRateSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value).toFixed(1);
                document.getElementById('speaking-rate-value').textContent = value + 'x';
                AI_CONFIG.azure.synthesisConfig.speakingRate = value;
            });
        }
        
        if (this.elements.speakingPitchSlider) {
            this.elements.speakingPitchSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value).toFixed(1);
                document.getElementById('speaking-pitch-value').textContent = value + 'x';
                AI_CONFIG.azure.synthesisConfig.speakingPitch = value;
            });
        }
    },
    
    /**
     * Alterna entre abas da configuração
     * @param {string} tabId - ID da aba a ser exibida
     */
    switchConfigTab: function(tabId) {
        // Atualiza os botões das abas
        const tabs = document.querySelectorAll('.config-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
        });
        
        // Atualiza o conteúdo das abas
        const tabContents = document.querySelectorAll('.config-tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('hidden', content.id !== tabId);
        });
    },
    
    /**
     * Exibe o painel de configuração
     */
    showConfigPanel: function() {
        this.elements.configPanel.classList.add('config-visible');
    },
    
    /**
     * Oculta o painel de configuração
     */
    hideConfigPanel: function() {
        this.elements.configPanel.classList.remove('config-visible');
    },
    
    /**
     * Salva as configurações do agente
     */
    saveConfig: function() {
        const azureKey = this.elements.azureKeyInput.value.trim();
        const azureRegion = this.elements.azureRegionInput.value.trim();
        const geminiKey = this.elements.geminiKeyInput.value.trim();
        const voiceName = this.elements.voiceSelect.value;
        const speakingRate = this.elements.speakingRateSlider ? parseFloat(this.elements.speakingRateSlider.value) : 1.0;
        const speakingPitch = this.elements.speakingPitchSlider ? parseFloat(this.elements.speakingPitchSlider.value) : 1.0;
        
        if (!azureKey || !azureRegion || !geminiKey) {
            Utils.showNotification('Por favor, preencha todos os campos de configuração.', 'error');
            return;
        }
        
        // Atualiza as configurações globais
        AI_CONFIG.azure.speechKey = azureKey;
        AI_CONFIG.azure.speechRegion = azureRegion;
        AI_CONFIG.azure.voiceName = voiceName;
        AI_CONFIG.azure.synthesisConfig.speakingRate = speakingRate;
        AI_CONFIG.azure.synthesisConfig.speakingPitch = speakingPitch;
        AI_CONFIG.gemini.apiKey = geminiKey;
        
        // Salva as configurações no localStorage
        Utils.saveToStorage(APP_CONFIG.storage.azureRegion, azureRegion);
        Utils.saveToStorage(APP_CONFIG.storage.azureKey, azureKey);
        Utils.saveToStorage(APP_CONFIG.storage.geminiKey, geminiKey);
        Utils.saveToStorage(APP_CONFIG.storage.voiceName, voiceName);
        
        // Atualiza a UI
        this.elements.toggleButton.disabled = !App.state.isJoined;
        this.elements.clearConversationButton.disabled = !this.isAgentActive;
        
        // Esconde o painel de configuração
        this.hideConfigPanel();
        
        Utils.showNotification('Configuração salva com sucesso!', 'success');
    },
    
    /**
     * Carrega as configurações salvas
     */
    loadSavedConfig: function() {
        const azureKey = Utils.getFromStorage(APP_CONFIG.storage.azureKey, '');
        const azureRegion = Utils.getFromStorage(APP_CONFIG.storage.azureRegion, 'eastus');
        const geminiKey = Utils.getFromStorage(APP_CONFIG.storage.geminiKey, '');
        const voiceName = Utils.getFromStorage(APP_CONFIG.storage.voiceName, 'pt-BR-AntonioNeural');
        
        // Define valores nos campos
        if (azureKey) this.elements.azureKeyInput.value = azureKey;
        if (azureRegion) this.elements.azureRegionInput.value = azureRegion;
        if (geminiKey) this.elements.geminiKeyInput.value = geminiKey;
        if (voiceName && this.elements.voiceSelect) this.elements.voiceSelect.value = voiceName;
        
        // Atualiza os valores dos sliders
        if (this.elements.speakingRateSlider) {
            const rate = AI_CONFIG.azure.synthesisConfig.speakingRate;
            this.elements.speakingRateSlider.value = rate;
            document.getElementById('speaking-rate-value').textContent = rate + 'x';
        }
        
        if (this.elements.speakingPitchSlider) {
            const pitch = AI_CONFIG.azure.synthesisConfig.speakingPitch;
            this.elements.speakingPitchSlider.value = pitch;
            document.getElementById('speaking-pitch-value').textContent = pitch + 'x';
        }
        
        // Atualiza as configurações globais
        if (azureKey) AI_CONFIG.azure.speechKey = azureKey;
        if (azureRegion) AI_CONFIG.azure.speechRegion = azureRegion;
        if (geminiKey) AI_CONFIG.gemini.apiKey = geminiKey;
        if (voiceName) AI_CONFIG.azure.voiceName = voiceName;
        
        // Verifica se as configurações são válidas
        const configValid = AIAgent.validateConfig(AI_CONFIG);
        this.elements.toggleButton.disabled = !App.state.isJoined || !configValid;
        
        if (!configValid && (azureKey || geminiKey)) {
            this.addSystemMessage('Configuração incompleta. Verifique suas chaves de API.');
        }
    },
    
    /**
     * Alterna o estado do agente (ativar/desativar)
     */
    async toggleAgent: function() {
        if (!App.state.isJoined) {
            Utils.showNotification('Entre em um canal antes de ativar o assistente AI.', 'error');
            return;
        }
        
        if (this.isAgentActive) {
            // Desativa o agente
            this.agent.stopListening();
            this.isAgentActive = false;
            this.elements.toggleButton.innerHTML = `
                <svg class="mic-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                <span>Ativar Assistente AI</span>
            `;
            this.elements.toggleButton.classList.remove('active');
            this.elements.statusIndicator.textContent = 'Inativo';
            this.elements.statusIndicator.className = 'status-badge inactive';
            this.elements.clearConversationButton.disabled = true;
            
            this.addSystemMessage('Assistente AI desativado');
        } else {
            // Verifica se as configurações estão preenchidas
            if (!AIAgent.validateConfig(AI_CONFIG)) {
                Utils.showNotification('Configure as chaves de API antes de ativar o assistente AI.', 'error');
                this.showConfigPanel();
                return;
            }
            
            // Verifica se o áudio está mudo
            if (App.state.isAudioMuted) {
                Utils.showNotification('Ative seu microfone antes de usar o assistente AI.', 'warning');
                return;
            }
            
            // Ativa o agente
            this.elements.statusIndicator.textContent = 'Inicializando...';
            this.elements.statusIndicator.className = 'status-badge initializing';
            Utils.showLoading("Iniciando assistente AI...");
            
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
                        this.elements.toggleButton.innerHTML = `
                            <svg class="mic-icon active" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                            <span>Desativar Assistente AI</span>
                        `;
                        this.elements.toggleButton.classList.add('active');
                        this.elements.statusIndicator.textContent = 'Ativo - Escutando';
                        this.elements.statusIndicator.className = 'status-badge active';
                        this.elements.clearConversationButton.disabled = false;
                        
                        this.addSystemMessage('Assistente AI ativado. Você pode falar agora.');
                        Utils.showNotification('Assistente AI ativado e pronto para ouvir', 'success');
                    } else {
                        throw new Error('Falha ao iniciar o reconhecimento de fala');
                    }
                } else {
                    throw new Error('Falha ao inicializar o agente AI');
                }
            } catch (error) {
                console.error('Erro ao ativar o agente:', error);
                this.elements.statusIndicator.textContent = 'Erro';
                this.elements.statusIndicator.className = 'status-badge error';
                this.addSystemMessage(`Erro ao ativar o assistente: ${error.message}`);
                Utils.showNotification('Erro ao ativar o assistente AI', 'error');
            } finally {
                Utils.hideLoading();
            }
        }
    },
    
    /**
     * Atualiza a conversa com novas mensagens
     * @param {Object} message - Mensagem a ser adicionada
     */
    updateConversation: function(message) {
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
                    <div class="message-content">
                        ${message.text}
                        <div class="message-time">${Utils.getCurrentTimestamp()}</div>
                    </div>
                `;
                break;
            case 'assistant':
                messageClass = 'assistant';
                messageHTML = `
                    <div class="message-avatar assistant-avatar">
                        <span>AI</span>
                    </div>
                    <div class="message-content">
                        ${message.text}
                        <div class="message-time">${Utils.getCurrentTimestamp()}</div>
                    </div>
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
                    <svg class="error-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
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
        messageElement.className = `message ${messageClass}`;
        messageElement.innerHTML = messageHTML;
        
        // Se houver uma mensagem de processamento anterior, substitui ela
        if (message.type === 'assistant' || message.type === 'error') {
            const processingMessage = this.elements.messagesContainer.querySelector('.message.processing');
            if (processingMessage) {
                this.elements.messagesContainer.replaceChild(messageElement, processingMessage);
            } else {
                this.elements.messagesContainer.appendChild(messageElement);
            }
        } else {
            this.elements.messagesContainer.appendChild(messageElement);
        }
        
        // Rola para a última mensagem
        this.scrollToBottom();
    },
    
    /**
     * Adiciona uma mensagem do sistema à conversa
     * @param {string} text - Texto da mensagem
     */
    addSystemMessage: function(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message system';
        messageElement.innerHTML = `
            <svg class="info-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>${text}</span>
        `;
        
        this.elements.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    },
    
    /**
     * Rola a conversa para a última mensagem
     */
    scrollToBottom: function() {
        if (this.elements.conversationContainer) {
            this.elements.conversationContainer.scrollTop = this.elements.conversationContainer.scrollHeight;
        }
    },
    
    /**
     * Atualiza o estado da UI conforme o estado da aplicação
     * @param {string} appState - Estado da aplicação
     */
    updateState: function(appState) {
        // Habilita/desabilita o botão de ativar agente conforme o estado da aplicação
        if (appState === APP_CONFIG.states.CONNECTED) {
            if (AIAgent.validateConfig(AI_CONFIG)) {
                this.elements.toggleButton.disabled = false;
            }
        } else {
            // Se não estiver conectado, desativa o agente
            if (this.isAgentActive) {
                this.agent.stopListening();
                this.agent.cancelSpeech();
                this.isAgentActive = false;
                this.elements.toggleButton.innerHTML = `
                    <svg class="mic-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    Ativar Assistente AI
                `;
                this.elements.toggleButton.classList.remove('active');
                this.elements.statusIndicator.textContent = 'Inativo';
                this.elements.statusIndicator.className = 'status-badge inactive';
                this.elements.clearConversationButton.disabled = true;
            }
            
            this.elements.toggleButton.disabled = true;
        }
    },
    
    /**
     * Limpa a conversa
     */
    clearConversation: function() {
        // Limpa o histórico visual
        this.elements.messagesContainer.innerHTML = `
            <div class="message system">
                <svg class="info-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>Conversa limpa. O assistente está pronto para novas perguntas.</span>
            </div>
        `;
        
        // Limpa o histórico no objeto de agente
        if (this.agent) {
            this.agent.clearConversation();
        }
        
        this.conversation = [];
        Utils.showNotification('Histórico de conversa limpo', 'info');
    }
};

// Exporta o componente para uso em outros arquivos
window.AgentUI = AgentUI;