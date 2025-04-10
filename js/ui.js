/**
 * Funções para interagir com a interface do usuário
 * Gerencia elementos da UI, estados visuais e interações
 */

// Objeto global para gerenciar a interface de usuário
const UI = {
    // Referencias para elementos da UI
    elements: {
        // Botões
        joinBtn: document.getElementById('join'),
        leaveBtn: document.getElementById('leave'),
        toggleAudioBtn: document.getElementById('toggleAudio'),
        toggleVideoBtn: document.getElementById('toggleVideo'),
        switchCameraBtn: document.getElementById('switchCamera'),
        
        // Controles de volume
        localVolumeSlider: document.getElementById('localVolume'),
        localVolumeValue: document.getElementById('localVolumeValue'),
        
        // Campos de entrada
        appIdInput: document.getElementById('appId'),
        channelInput: document.getElementById('channel'),
        tokenInput: document.getElementById('token'),
        
        // Containers
        videoGrid: document.getElementById('videoGrid'),
        localVideoContainer: document.getElementById('localVideoContainer'),
        remoteUsersContainer: document.getElementById('remoteUsers'),
        noRemoteUsers: document.getElementById('no-remote-users'),
        localStats: document.getElementById('local-stats'),
        
        // Status de rede
        networkQualityIndicator: document.getElementById('network-quality')
    },
    
    // Estado da interface
    state: {
        currentAppState: APP_CONFIG.states.DISCONNECTED,
        isMuted: {
            audio: false,
            video: false
        },
        isFullscreen: false,
        activeRemoteUsers: 0,
        networkQuality: APP_CONFIG.networkQuality.UNKNOWN,
        statsVisible: false
    },
    
    /**
     * Inicializa a interface
     */
    initialize: function() {
        // Carrega valores salvos do localStorage
        this.loadSavedValues();
        
        // Configura os event listeners
        this.setupEventListeners();
        
        // Atualiza o estado inicial da UI
        this.updateState(APP_CONFIG.states.DISCONNECTED);
        
        console.log('UI inicializada');
    },
    
    /**
     * Carrega valores salvos no localStorage
     */
    loadSavedValues: function() {
        // Carrega valores dos inputs
        const savedAppId = Utils.getFromStorage(APP_CONFIG.storage.appId, '');
        const savedChannel = Utils.getFromStorage(APP_CONFIG.storage.channel, '');
        
        if (savedAppId) this.elements.appIdInput.value = savedAppId;
        if (savedChannel) this.elements.channelInput.value = savedChannel;
    },
    
    /**
     * Configura os event listeners para elementos da UI
     */
    setupEventListeners: function() {
        // Eventos para entradas de texto (para salvar valores)
        this.elements.appIdInput.addEventListener('change', this.handleInputChange.bind(this));
        this.elements.channelInput.addEventListener('change', this.handleInputChange.bind(this));
        
        // Evento de redimensionamento
        window.addEventListener('resize', Utils.debounce(() => {
            this.adjustVideoSize();
        }, 200));
        
        // Eventos para botões de controle de vídeo
        const fullscreenBtns = document.querySelectorAll('.fullscreen-btn');
        fullscreenBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const container = e.currentTarget.closest('.video-container');
                if (container) {
                    this.toggleFullscreen(container);
                }
            });
        });
    },
    
    /**
     * Manipula alterações nos campos de entrada
     * @param {Event} event - Evento de mudança
     */
    handleInputChange: function(event) {
        const input = event.target;
        
        // Salva o valor no localStorage
        if (input.id === 'appId') {
            Utils.saveToStorage(APP_CONFIG.storage.appId, input.value);
        } else if (input.id === 'channel') {
            Utils.saveToStorage(APP_CONFIG.storage.channel, input.value);
        }
    },
    
    /**
     * Atualiza o estado da UI de acordo com o estado da aplicação
     * @param {string} state - Novo estado da aplicação
     */
    updateState: function(state) {
        // Atualiza o estado atual
        this.state.currentAppState = state;
        
        // Aplica os estados específicos para cada elemento
        switch (state) {
            case APP_CONFIG.states.DISCONNECTED:
                this.elements.joinBtn.disabled = false;
                this.elements.leaveBtn.disabled = true;
                this.elements.toggleAudioBtn.disabled = true;
                this.elements.toggleVideoBtn.disabled = true;
                this.elements.switchCameraBtn.disabled = true;
                this.elements.localVolumeSlider.disabled = true;
                this.elements.appIdInput.disabled = false;
                this.elements.channelInput.disabled = false;
                this.elements.tokenInput.disabled = false;
                this.elements.localVideoContainer.style.display = 'none';
                this.elements.networkQualityIndicator.textContent = 'Desconectado';
                this.elements.networkQualityIndicator.className = 'network-quality';
                break;
                
            case APP_CONFIG.states.CONNECTING:
                this.elements.joinBtn.disabled = true;
                this.elements.leaveBtn.disabled = true;
                this.elements.toggleAudioBtn.disabled = true;
                this.elements.toggleVideoBtn.disabled = true;
                this.elements.switchCameraBtn.disabled = true;
                this.elements.localVolumeSlider.disabled = true;
                this.elements.appIdInput.disabled = true;
                this.elements.channelInput.disabled = true;
                this.elements.tokenInput.disabled = true;
                this.elements.networkQualityIndicator.textContent = 'Conectando...';
                this.elements.networkQualityIndicator.className = 'network-quality';
                break;
                
            case APP_CONFIG.states.CONNECTED:
                this.elements.joinBtn.disabled = true;
                this.elements.leaveBtn.disabled = false;
                this.elements.toggleAudioBtn.disabled = false;
                this.elements.toggleVideoBtn.disabled = false;
                this.elements.switchCameraBtn.disabled = false;
                this.elements.localVolumeSlider.disabled = false;
                this.elements.appIdInput.disabled = true;
                this.elements.channelInput.disabled = true;
                this.elements.tokenInput.disabled = true;
                this.elements.localVideoContainer.style.display = 'block';
                break;
                
            case APP_CONFIG.states.RECONNECTING:
                this.elements.joinBtn.disabled = true;
                this.elements.leaveBtn.disabled = true;
                this.elements.toggleAudioBtn.disabled = true;
                this.elements.toggleVideoBtn.disabled = true;
                this.elements.switchCameraBtn.disabled = true;
                this.elements.localVolumeSlider.disabled = true;
                this.elements.networkQualityIndicator.textContent = 'Reconectando...';
                this.elements.networkQualityIndicator.className = 'network-quality';
                break;
                
            case APP_CONFIG.states.ERROR:
                this.elements.joinBtn.disabled = false;
                this.elements.leaveBtn.disabled = true;
                this.elements.toggleAudioBtn.disabled = true;
                this.elements.toggleVideoBtn.disabled = true;
                this.elements.switchCameraBtn.disabled = true;
                this.elements.localVolumeSlider.disabled = true;
                this.elements.appIdInput.disabled = false;
                this.elements.channelInput.disabled = false;
                this.elements.tokenInput.disabled = false;
                this.elements.localVideoContainer.style.display = 'none';
                this.elements.networkQualityIndicator.textContent = 'Erro';
                this.elements.networkQualityIndicator.className = 'network-quality poor';
                break;
        }
        
        // Se estiver usando o componente de agente AI, atualiza seu estado
        if (window.AgentUI) {
            AgentUI.updateState(state);
        }
    },
    
    /**
     * Atualiza o botão de áudio com base no estado de mudo
     * @param {boolean} isMuted - Estado de mudo do áudio
     */
    updateAudioButtonState: function(isMuted) {
        this.state.isMuted.audio = isMuted;
        
        // Atualiza o texto e ícone do botão
        if (isMuted) {
            this.elements.toggleAudioBtn.innerHTML = `
                <span class="button-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                </span>
                <span>Ativar Microfone</span>
            `;
            this.elements.toggleAudioBtn.classList.add('active');
        } else {
            this.elements.toggleAudioBtn.innerHTML = `
                <span class="button-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                </span>
                <span>Silenciar Microfone</span>
            `;
            this.elements.toggleAudioBtn.classList.remove('active');
        }
    },
    
    /**
     * Atualiza o botão de vídeo com base no estado de mudo
     * @param {boolean} isMuted - Estado de mudo do vídeo
     */
    updateVideoButtonState: function(isMuted) {
        this.state.isMuted.video = isMuted;
        
        // Atualiza o texto e ícone do botão
        if (isMuted) {
            this.elements.toggleVideoBtn.innerHTML = `
                <span class="button-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                        <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                </span>
                <span>Ativar Câmera</span>
            `;
            this.elements.toggleVideoBtn.classList.add('active');
        } else {
            this.elements.toggleVideoBtn.innerHTML = `
                <span class="button-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                        <path d="M23 7l-7 5 7 5V7z"></path>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                </span>
                <span>Desligar Câmera</span>
            `;
            this.elements.toggleVideoBtn.classList.remove('active');
        }
    },
    
    /**
     * Exibe o vídeo local no container apropriado
     * @param {Object} videoTrack - Track de vídeo local
     */
    displayLocalVideo: function(videoTrack) {
        if (!videoTrack) return;
        
        // Limpa o conteúdo anterior
        this.elements.localVideoContainer.innerHTML = '';
        
        // Adiciona informações do usuário
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.textContent = 'Você';
        this.elements.localVideoContainer.appendChild(userInfo);
        
        // Adiciona estatísticas de vídeo
        const videoStats = document.createElement('div');
        videoStats.className = 'video-stats';
        videoStats.id = 'local-stats';
        this.elements.localVideoContainer.appendChild(videoStats);
        
        // Adiciona os controles de vídeo
        const videoControls = document.createElement('div');
        videoControls.className = 'video-controls';
        videoControls.innerHTML = `
            <button class="video-control-btn fullscreen-btn" title="Tela cheia">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
            </button>
        `;
        this.elements.localVideoContainer.appendChild(videoControls);
        
        // Exibe o vídeo
        videoTrack.play(this.elements.localVideoContainer);
        
        // Configura o evento para tela cheia
        const fullscreenBtn = videoControls.querySelector('.fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen(this.elements.localVideoContainer);
            });
        }
        
        // Ajusta tamanho do vídeo
        this.adjustVideoSize();
    },
    
    /**
     * Cria e exibe um container de vídeo para um usuário remoto
     * @param {Object} user - Objeto do usuário remoto
     */
    displayRemoteVideo: function(user) {
        if (!user || !user.videoTrack) return;
        
        // Verifica se já existe um container para este usuário
        let remoteContainer = document.getElementById(`remote-video-${user.uid}`);
        
        // Se não existir, cria um novo
        if (!remoteContainer) {
            remoteContainer = document.createElement('div');
            remoteContainer.id = `remote-video-${user.uid}`;
            remoteContainer.className = 'video-container';
            
            // Adiciona informações do usuário
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.textContent = `Usuário: ${user.uid}`;
            remoteContainer.appendChild(userInfo);
            
            // Adiciona estatísticas de vídeo
            const videoStats = document.createElement('div');
            videoStats.className = 'video-stats';
            videoStats.id = `remote-stats-${user.uid}`;
            remoteContainer.appendChild(videoStats);
            
            // Adiciona os controles de vídeo
            const videoControls = document.createElement('div');
            videoControls.className = 'video-controls';
            videoControls.innerHTML = `
                <button class="video-control-btn fullscreen-btn" title="Tela cheia">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                    </svg>
                </button>
            `;
            remoteContainer.appendChild(videoControls);
            
            // Configura o evento para tela cheia
            const fullscreenBtn = videoControls.querySelector('.fullscreen-btn');
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', () => {
                    this.toggleFullscreen(remoteContainer);
                });
            }
            
            // Adiciona ao grid de vídeos
            this.elements.videoGrid.appendChild(remoteContainer);
            
            // Incrementa o contador de usuários
            this.state.activeRemoteUsers++;
            
            // Oculta a mensagem de "nenhum usuário remoto"
            if (this.elements.noRemoteUsers) {
                this.elements.noRemoteUsers.style.display = 'none';
            }
            
            // Ajusta o layout
            this.adjustVideoSize();
        }
        
        // Exibe o vídeo no container
        user.videoTrack.play(remoteContainer);
    },
    
    /**
     * Adiciona um usuário remoto à lista com controles de volume
     * @param {Object} user - Objeto do usuário remoto
     */
    addRemoteUserUI: function(user) {
        if (!user) return;
        
        // Verifica se já existe um item para este usuário
        if (document.getElementById(`remote-user-${user.uid}`)) {
            return;
        }
        
        const userItem = document.createElement('div');
        userItem.id = `remote-user-${user.uid}`;
        userItem.className = 'user-item';
        
        const userInfo = document.createElement('div');
        userInfo.textContent = `Usuário: ${user.uid}`;
        
        const volumeControls = document.createElement('div');
        volumeControls.className = 'volume-controls';
        
        const volumeLabel = document.createElement('label');
        volumeLabel.textContent = 'Volume:';
        
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = '100';
        volumeSlider.id = `volume-${user.uid}`;
        
        const volumeValue = document.createElement('span');
        volumeValue.textContent = '100%';
        volumeValue.id = `volume-value-${user.uid}`;
        
        // Define o evento de alteração do volume
        volumeSlider.addEventListener('input', () => {
            const volume = parseInt(volumeSlider.value);
            
            // Ajusta o volume do usuário remoto
            if (typeof window.adjustRemoteUserVolume === 'function') {
                window.adjustRemoteUserVolume(user.uid, volume);
            }
            
            volumeValue.textContent = volume + '%';
        });
        
        volumeControls.appendChild(volumeLabel);
        volumeControls.appendChild(volumeSlider);
        volumeControls.appendChild(volumeValue);
        
        userItem.appendChild(userInfo);
        userItem.appendChild(volumeControls);
        
        this.elements.remoteUsersContainer.appendChild(userItem);
    },
    
    /**
     * Remove o vídeo de um usuário remoto
     * @param {string|number} uid - ID do usuário remoto
     */
    removeRemoteVideo: function(uid) {
        const remoteContainer = document.getElementById(`remote-video-${uid}`);
        if (remoteContainer) {
            remoteContainer.remove();
            
            // Decrementa o contador de usuários
            this.state.activeRemoteUsers--;
            
            // Exibe a mensagem de "nenhum usuário remoto" se não houver mais usuários
            if (this.state.activeRemoteUsers === 0 && this.elements.noRemoteUsers) {
                this.elements.noRemoteUsers.style.display = 'flex';
            }
            
            // Ajusta o layout
            this.adjustVideoSize();
        }
    },
    
    /**
     * Remove completamente um usuário remoto da interface
     * @param {string|number} uid - ID do usuário remoto
     */
    removeRemoteUser: function(uid) {
        this.removeRemoteVideo(uid);
        
        const userItem = document.getElementById(`remote-user-${uid}`);
        if (userItem) {
            userItem.remove();
        }
    },
    
    /**
     * Limpa todos os vídeos remotos
     */
    clearRemoteVideos: function() {
        // Remove todos os containers de vídeo remoto
        const remoteContainers = this.elements.videoGrid.querySelectorAll('.video-container:not(#localVideoContainer)');
        remoteContainers.forEach(container => container.remove());
        
        // Limpa a lista de usuários remotos
        this.elements.remoteUsersContainer.innerHTML = '';
        
        // Restaura o estado vazio
        if (this.elements.noRemoteUsers) {
            this.elements.noRemoteUsers.style.display = 'flex';
        }
        
        // Reseta o contador
        this.state.activeRemoteUsers = 0;
    },
    
    /**
     * Ajusta o tamanho dos containers de vídeo
     */
    adjustVideoSize: function() {
        // Total de vídeos (local + remotos)
        const totalVideos = this.state.activeRemoteUsers + (this.elements.localVideoContainer.style.display !== 'none' ? 1 : 0);
        
        // Ajusta o número de colunas com base no número de vídeos
        let columns = 2; // Padrão
        
        if (totalVideos <= 1) {
            columns = 1;
        } else if (totalVideos > 4) {
            columns = 3;
        }
        
        // Configura o grid de vídeos
        this.elements.videoGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    },
    
    /**
     * Alterna o modo de tela cheia para um container
     * @param {HTMLElement} container - Container para alternar tela cheia
     */
    toggleFullscreen: function(container) {
        if (!container) return;
        
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
            this.state.isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            this.state.isFullscreen = false;
        }
    },
    
    /**
     * Atualiza os indicadores de qualidade de rede
     * @param {number} quality - Nível de qualidade da rede
     */
    updateNetworkQuality: function(quality) {
        this.state.networkQuality = quality;
        
        const qualityName = APP_CONFIG.networkQualityNames[quality] || 'Desconhecida';
        const qualityClass = APP_CONFIG.networkQualityClasses[quality] || '';
        
        if (this.elements.networkQualityIndicator) {
            this.elements.networkQualityIndicator.textContent = qualityName;
            this.elements.networkQualityIndicator.className = `network-quality ${qualityClass}`;
        }
    },
    
    /**
     * Atualiza as estatísticas de vídeo para um usuário
     * @param {string} userId - ID do usuário ('local' para usuário local)
     * @param {Object} stats - Estatísticas de vídeo
     */
    updateVideoStats: function(userId, stats) {
        const statsElement = userId === 'local' 
            ? this.elements.localStats 
            : document.getElementById(`remote-stats-${userId}`);
        
        if (!statsElement) return;
        
        // Constrói a string com as estatísticas
        let statsText = '';
        
        if (stats.resolution) {
            statsText += `${stats.resolution.width}x${stats.resolution.height}`;
        }
        
        if (stats.fps) {
            statsText += ` | ${stats.fps} FPS`;
        }
        
        if (stats.bitrate) {
            statsText += ` | ${stats.bitrate} kbps`;
        }
        
        if (stats.packetLoss !== undefined) {
            statsText += ` | Perda: ${stats.packetLoss}%`;
        }
        
        statsElement.textContent = statsText;
    },
    
    /**
     * Mostra uma mensagem de erro
     * @param {string} message - Mensagem de erro
     * @param {string} details - Detalhes adicionais do erro
     */
    showError: function(message, details = '') {
        Utils.showNotification(message, 'error');
        console.error('Erro:', message, details);
    }
};

// Inicializa a UI quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    UI.initialize();
});
