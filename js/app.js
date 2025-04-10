/**
 * Arquivo principal da aplicação
 * Gerencia a lógica de negócios, conexão com Agora SDK e controle da videochamada
 */

// Objeto App - gerencia a lógica principal da aplicação
const App = {
    // Variáveis de estado
    client: null,
    localAudioTrack: null,
    localVideoTrack: null,
    cameraVideoTrack: null,
    screenVideoTrack: null,
    remoteUsers: {},
    mediaDevices: {
        audioinput: [],
        videoinput: [],
        audiooutput: []
    },
    state: {
        isJoined: false,
        isAudioMuted: false,
        isVideoMuted: false,
        isSharingScreen: false,
        reconnectAttempts: 0,
        currentAppState: APP_CONFIG.states.DISCONNECTED,
        networkQuality: APP_CONFIG.networkQuality.UNKNOWN,
        statsInterval: null,
        pingInterval: null,
        selectedDevices: {
            audioinput: null,
            videoinput: null,
            audiooutput: null
        }
    },
    
    /**
     * Inicializa a aplicação
     */
    initialize: async function() {
        console.log('Inicializando Agora Video Call App', 'Versão:', APP_CONFIG.version);
        
        // Verifica se é a primeira visita
        if (Utils.isFirstVisit()) {
            Utils.showTutorial();
        }
        
        // Verifica permissões de mídia
        const permissions = await Utils.checkMediaPermissions();
        if (!permissions.audio || !permissions.video) {
            Utils.showPermissionsModal(permissions);
        }
        
        // Enumera dispositivos disponíveis
        this.enumerateDevices();
        
        // Adiciona eventos aos elementos da UI
        this.setupEventListeners();
        
        // Inicializa a UI do agente AI
        if (window.AgentUI) {
            AgentUI.initialize();
        }
        
        console.log('Aplicação inicializada');
    },
    
    /**
     * Enumera os dispositivos de mídia disponíveis
     */
    enumerateDevices: async function() {
        try {
            this.mediaDevices = await Utils.getMediaDevices();
            
            // Se não houver dispositivos, pode precisar de permissão
            if (this.mediaDevices.audioinput.length === 0 || this.mediaDevices.videoinput.length === 0) {
                const permissions = await Utils.requestMediaPermissions();
                if (permissions.audio || permissions.video) {
                    // Re-enumera após obter permissões
                    this.mediaDevices = await Utils.getMediaDevices();
                }
            }
            
            console.log('Dispositivos de mídia:', this.mediaDevices);
        } catch (error) {
            console.error('Erro ao enumerar dispositivos:', error);
        }
    },
    
    /**
     * Configura os event listeners
     */
    setupEventListeners: function() {
        // Botões principais
        UI.elements.joinBtn.addEventListener('click', () => this.joinChannel());
        UI.elements.leaveBtn.addEventListener('click', () => this.leaveChannel());
        UI.elements.toggleAudioBtn.addEventListener('click', () => this.toggleLocalAudio());
        UI.elements.toggleVideoBtn.addEventListener('click', () => this.toggleLocalVideo());
        UI.elements.switchCameraBtn.addEventListener('click', () => this.switchCamera());
        
        // Controle de volume
        UI.elements.localVolumeSlider.addEventListener('input', (e) => this.adjustLocalVolume(e.target.value));
        
        // Monitoramento de mudanças nos dispositivos
        navigator.mediaDevices.addEventListener('devicechange', () => {
            this.enumerateDevices();
        });
        
        // Monitoramento de estado da rede
        window.addEventListener('online', () => {
            if (this.state.isJoined && this.state.currentAppState === APP_CONFIG.states.RECONNECTING) {
                this.reconnect();
            }
        });
        
        window.addEventListener('offline', () => {
            if (this.state.isJoined) {
                this.handleNetworkDisconnection();
            }
        });
        
        // Monitoramento de blur/focus para otimização
        window.addEventListener('blur', () => {
            if (this.state.isJoined && !this.state.isVideoMuted) {
                this.pauseLocalVideo();
            }
        });
        
        window.addEventListener('focus', () => {
            if (this.state.isJoined && !this.state.isVideoMuted) {
                this.resumeLocalVideo();
            }
        });
    },
    
    /**
     * Inicializa o cliente Agora
     */
    initializeClient: function() {
        // Cria o cliente se ainda não existir
        if (!this.client) {
            this.client = AgoraRTC.createClient(APP_CONFIG.agora);
            this.setupClientEventListeners();
            console.log('Cliente Agora inicializado');
        }
    },
    
    /**
     * Configura os event listeners do cliente Agora
     */
    setupClientEventListeners: function() {
        if (!this.client) return;
        
        // Quando um usuário remoto publica uma mídia
        this.client.on("user-published", async (user, mediaType) => {
            // Inscreva-se na mídia do usuário remoto
            await this.client.subscribe(user, mediaType);
            console.log(`Inscrito na mídia ${mediaType} do usuário ${user.uid}`);
            
            // Se o usuário for novo, adicione-o à lista de usuários remotos
            if (!this.remoteUsers[user.uid]) {
                this.remoteUsers[user.uid] = user;
                UI.addRemoteUserUI(user);
            }
            
            // Trate o tipo de mídia apropriadamente
            if (mediaType === "video") {
                UI.displayRemoteVideo(user);
            } else if (mediaType === "audio") {
                user.audioTrack.play();
            }
        });
        
        // Quando um usuário remoto cancela a publicação de uma mídia
        this.client.on("user-unpublished", (user, mediaType) => {
            console.log(`Usuário ${user.uid} parou de publicar a mídia ${mediaType}`);
            
            // Se for vídeo, remova o container de vídeo
            if (mediaType === "video") {
                UI.removeRemoteVideo(user.uid);
            }
        });
        
        // Quando um usuário remoto sai do canal
        this.client.on("user-left", (user) => {
            console.log(`Usuário ${user.uid} saiu do canal`);
            
            // Remova o usuário dos nossos dados
            delete this.remoteUsers[user.uid];
            
            // Remova os elementos da UI
            UI.removeRemoteUser(user.uid);
        });
        
        // Monitoramento de qualidade de rede
        this.client.on("network-quality", (stats) => {
            this.handleNetworkQuality(stats.downlinkNetworkQuality);
        });
        
        // Eventos de estado de conexão
        this.client.on("connection-state-change", (curState, prevState) => {
            console.log("Mudança no estado da conexão:", prevState, "->", curState);
            
            if (curState === "CONNECTED") {
                this.handleConnectionEstablished();
            } else if (curState === "DISCONNECTED") {
                this.handleNetworkDisconnection();
            } else if (curState === "RECONNECTING") {
                this.handleNetworkReconnecting();
            }
        });
        
        // Evento de erro
        this.client.on("error", (err) => {
            console.error("Erro no cliente Agora:", err.code, err.message);
            this.handleClientError(err);
        });
    },
    
    /**
     * Entra no canal
     */
    joinChannel: async function() {
        try {
            const appId = UI.elements.appIdInput.value.trim();
            const channel = UI.elements.channelInput.value.trim();
            const token = UI.elements.tokenInput.value.trim() || null;
            
            // Valida os campos de entrada
            if (!appId) {
                UI.showError("Por favor, insira um App ID");
                return;
            }
            
            if (!Utils.isValidAppId(appId)) {
                UI.showError("O App ID inserido não é válido. Verifique seu console Agora");
                return;
            }
            
            if (!channel) {
                UI.showError("Por favor, insira um nome de canal");
                return;
            }
            
            // Inicializa o cliente se ainda não tiver sido feito
            this.initializeClient();
            
            // Atualiza a UI para o estado de conexão
            this.updateState(APP_CONFIG.states.CONNECTING);
            Utils.showLoading("Conectando ao canal...");
            
            // Configura um timeout para a conexão
            const joinTimeout = setTimeout(() => {
                Utils.hideLoading();
                this.updateState(APP_CONFIG.states.ERROR);
                UI.showError(APP_CONFIG.errorMessages.CONNECTION_TIMEOUT);
            }, APP_CONFIG.connection.joinTimeout);
            
            // Tenta entrar no canal
            const uid = await this.client.join(appId, channel, token, null);
            clearTimeout(joinTimeout);
            
            console.log(`Entrou no canal ${channel} com UID ${uid}`);
            
            try {
                // Cria as tracks de áudio e vídeo locais
                Utils.showLoading("Acessando câmera e microfone...");
                
                // Cria track de áudio
                this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                    encoderConfig: {
                        sampleRate: 48000,
                        stereo: true,
                        bitrate: 128
                    },
                    ...APP_CONFIG.media.audioConfig
                });
                
                // Cria track de vídeo
                this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
                    encoderConfig: APP_CONFIG.media.videoConfig
                });
                this.cameraVideoTrack = this.localVideoTrack; // Armazena a referência
                
                // Exibe o vídeo local
                UI.displayLocalVideo(this.localVideoTrack);
                
                // Publica as tracks locais
                await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
                console.log("Tracks locais publicadas com sucesso");
                
                // Inicia a coleta de estatísticas
                this.startStatsMonitoring();
                
                // Atualiza o estado
                this.state.isJoined = true;
                this.updateState(APP_CONFIG.states.CONNECTED);
                
                // Atualiza a UI global
                UI.updateState(APP_CONFIG.states.CONNECTED);
                
                // Atualiza o estado da UI do agente
                if (window.AgentUI) {
                    AgentUI.updateState(APP_CONFIG.states.CONNECTED);
                }
                
                Utils.hideLoading();
                Utils.showNotification(`Conectado ao canal ${channel}`, 'success');
            } catch (error) {
                // Se houver erro ao criar ou publicar as tracks
                console.error("Erro ao configurar mídias locais:", error);
                await this.client.leave();
                this.updateState(APP_CONFIG.states.ERROR);
                Utils.hideLoading();
                
                if (error.code === 'PERMISSION_DENIED') {
                    UI.showError(APP_CONFIG.errorMessages.PERMISSION_DENIED);
                    Utils.showPermissionsModal({ audio: false, video: false });
                } else if (error.code === 'DEVICE_NOT_FOUND') {
                    UI.showError(APP_CONFIG.errorMessages.DEVICE_NOT_FOUND);
                } else {
                    UI.showError("Erro ao configurar mídias locais", error.message);
                }
            }
        } catch (error) {
            console.error("Erro ao entrar no canal:", error);
            Utils.hideLoading();
            this.updateState(APP_CONFIG.states.ERROR);
            
            // Trata diferentes tipos de erro
            if (error.code === 'INVALID_PARAMS') {
                UI.showError(APP_CONFIG.errorMessages.INVALID_APP_ID);
            } else if (error.code === 'INVALID_TOKEN') {
                UI.showError(APP_CONFIG.errorMessages.INVALID_TOKEN);
            } else if (error.code === 'NETWORK_ERROR') {
                UI.showError(APP_CONFIG.errorMessages.NETWORK_ERROR);
            } else {
                UI.showError(APP_CONFIG.errorMessages.GENERAL_ERROR, error.message);
            }
        }
    },
    
    /**
     * Sai do canal
     */
    leaveChannel: async function() {
        Utils.showLoading("Desconectando...");
        
        try {
            // Desativa o agente AI se estiver ativo
            if (window.AgentUI && AgentUI.isAgentActive) {
                // Certifique-se de cancelar qualquer fala em andamento
                AgentUI.agent.cancelSpeech();
                // Depois desative o agente completamente
                AgentUI.toggleAgent();
                // Garanta que os recursos sejam liberados
                AgentUI.agent.dispose();
            }
            
            // Para a coleta de estatísticas
            this.stopStatsMonitoring();
            
            // Fecha as tracks locais
            if (this.localAudioTrack) {
                this.localAudioTrack.close();
                this.localAudioTrack = null;
            }
            
            if (this.localVideoTrack) {
                this.localVideoTrack.close();
                this.localVideoTrack = null;
            }
            
            if (this.screenVideoTrack && this.screenVideoTrack !== this.localVideoTrack) {
                this.screenVideoTrack.close();
                this.screenVideoTrack = null;
            }
            
            if (this.cameraVideoTrack && this.cameraVideoTrack !== this.localVideoTrack) {
                this.cameraVideoTrack.close();
                this.cameraVideoTrack = null;
            }
            
            // Sai do canal
            await this.client.leave();
            console.log("Saiu do canal");
            
            // Limpa os usuários remotos
            this.remoteUsers = {};
            
            // Atualiza a UI e o estado da aplicação
            this.updateState(APP_CONFIG.states.DISCONNECTED);
            UI.clearRemoteVideos();
            
            // Reseta os estados de mudo
            this.state.isAudioMuted = false;
            this.state.isVideoMuted = false;
            this.state.isSharingScreen = false;
            UI.updateAudioButtonState(false);
            UI.updateVideoButtonState(false);
            
            // Reseta o contador de tentativas de reconexão
            this.state.reconnectAttempts = 0;
            
            // Atualiza o estado da UI do agente
            if (window.AgentUI) {
                AgentUI.updateState(APP_CONFIG.states.DISCONNECTED);
                AgentUI.clearConversation();
            }
            
            Utils.hideLoading();
            Utils.showNotification("Desconectado do canal", 'info');
        } catch (error) {
            console.error("Erro ao sair do canal:", error);
            Utils.hideLoading();
            UI.showError("Falha ao sair do canal", error.message);
            
            // Força a limpeza do estado
            this.updateState(APP_CONFIG.states.DISCONNECTED);
        }
    },
    
    /**
     * Ativa/desativa o áudio local
     */
    toggleLocalAudio: function() {
        if (!this.localAudioTrack) return;
        
        if (this.state.isAudioMuted) {
            // Ativa o áudio
            this.localAudioTrack.setMuted(false);
            this.state.isAudioMuted = false;
            UI.updateAudioButtonState(false);
            Utils.showNotification("Microfone ativado", 'info');
        } else {
            // Desativa o áudio
            this.localAudioTrack.setMuted(true);
            this.state.isAudioMuted = true;
            UI.updateAudioButtonState(true);
            Utils.showNotification("Microfone silenciado", 'info');
        }
        
        // Se o agente AI estiver ativo, alterna seu estado para evitar conflitos
        if (window.AgentUI && AgentUI.isAgentActive) {
            if (this.state.isAudioMuted) {
                // Se o microfone foi silenciado, pausa a escuta do agente
                AgentUI.agent.stopListening();
                AgentUI.statusIndicator.textContent = 'Pausado (microfone silenciado)';
                AgentUI.statusIndicator.className = 'status-badge initializing';
            } else {
                // Se o microfone foi ativado, retoma a escuta do agente
                AgentUI.agent.startListening();
                AgentUI.statusIndicator.textContent = 'Ativo - Escutando';
                AgentUI.statusIndicator.className = 'status-badge active';
            }
        }
    },
    
    /**
     * Ativa/desativa o vídeo local
     */
    toggleLocalVideo: function() {
        if (!this.localVideoTrack) return;
        
        if (this.state.isVideoMuted) {
            // Ativa o vídeo
            this.localVideoTrack.setMuted(false);
            this.state.isVideoMuted = false;
            UI.updateVideoButtonState(false);
            Utils.showNotification("Câmera ativada", 'info');
        } else {
            // Desativa o vídeo
            this.localVideoTrack.setMuted(true);
            this.state.isVideoMuted = true;
            UI.updateVideoButtonState(true);
            Utils.showNotification("Câmera desativada", 'info');
        }
    },
    
    /**
     * Alterna entre as câmeras disponíveis
     */
    switchCamera: async function() {
        if (!this.localVideoTrack || !this.cameraVideoTrack) return;
        
        try {
            Utils.showLoading("Trocando câmera...");
            
            // Obtém a lista de câmeras
            const cameras = await AgoraRTC.getCameras();
            if (cameras.length <= 1) {
                Utils.hideLoading();
                Utils.showNotification("Nenhuma câmera adicional encontrada", 'warning');
                return;
            }
            
            // Encontra a próxima câmera (diferente da atual)
            const currentDeviceId = this.cameraVideoTrack.getDeviceId();
            let nextCamera = cameras.find(camera => camera.deviceId !== currentDeviceId);
            
            if (!nextCamera) {
                nextCamera = cameras[0];
            }
            
            // Troca para a próxima câmera
            await this.cameraVideoTrack.setDevice(nextCamera.deviceId);
            
            // Se estiver compartilhando tela, não afeta a visualização atual
            if (!this.state.isSharingScreen) {
                // A visualização é atualizada automaticamente pela biblioteca Agora
            }
            
            Utils.hideLoading();
            Utils.showNotification(`Câmera alternada: ${nextCamera.label || 'Nova câmera'}`, 'success');
        } catch (error) {
            console.error("Erro ao alternar câmera:", error);
            Utils.hideLoading();
            UI.showError("Falha ao alternar câmera", error.message);
        }
    },
    
    /**
     * Compartilha a tela
     */
    shareScreen: async function() {
        if (this.state.isSharingScreen) {
            // Já está compartilhando tela, troca de volta para a câmera
            this.stopScreenSharing();
            return;
        }
        
        try {
            Utils.showLoading("Iniciando compartilhamento de tela...");
            
            // Cria a track de compartilhamento de tela
            this.screenVideoTrack = await AgoraRTC.createScreenVideoTrack({
                encoderConfig: APP_CONFIG.video.high,
                optimizationMode: "detail"
            });
            
            // Guarda a referência da track da câmera
            if (!this.cameraVideoTrack) {
                this.cameraVideoTrack = this.localVideoTrack;
            }
            
            // Cancela a publicação da track de vídeo atual
            if (this.localVideoTrack) {
                await this.client.unpublish(this.localVideoTrack);
            }
            
            // Substitui a track de vídeo local
            this.localVideoTrack = this.screenVideoTrack;
            
            // Publica a nova track
            await this.client.publish(this.screenVideoTrack);
            
            // Atualiza a visualização
            UI.displayLocalVideo(this.screenVideoTrack);
            
            // Atualiza estado
            this.state.isSharingScreen = true;
            
            // Configura handler para quando o usuário encerrar o compartilhamento pelo controle do navegador
            this.screenVideoTrack.on("track-ended", () => {
                this.stopScreenSharing();
            });
            
            Utils.hideLoading();
            Utils.showNotification("Compartilhamento de tela iniciado", 'success');
        } catch (error) {
            console.error("Erro ao compartilhar tela:", error);
            Utils.hideLoading();
            
            // Se o usuário cancelou a seleção
            if (error.code === 'PERMISSION_DENIED' || error.name === 'NotAllowedError') {
                Utils.showNotification("Compartilhamento de tela cancelado", 'info');
            } else {
                UI.showError("Falha ao compartilhar tela", error.message);
            }
        }
    },
    
    /**
     * Para o compartilhamento de tela
     */
    stopScreenSharing: async function() {
        if (!this.state.isSharingScreen || !this.screenVideoTrack || !this.cameraVideoTrack) return;
        
        try {
            Utils.showLoading("Finalizando compartilhamento de tela...");
            
            // Cancela a publicação da track de compartilhamento de tela
            await this.client.unpublish(this.screenVideoTrack);
            
            // Fecha a track de compartilhamento de tela
            this.screenVideoTrack.close();
            
            // Restaura a track da câmera
            this.localVideoTrack = this.cameraVideoTrack;
            
            // Publica a track da câmera
            await this.client.publish(this.localVideoTrack);
            
            // Atualiza a visualização
            UI.displayLocalVideo(this.localVideoTrack);
            
            // Reseta o estado
            this.state.isSharingScreen = false;
            this.screenVideoTrack = null;
            
            Utils.hideLoading();
            Utils.showNotification("Compartilhamento de tela finalizado", 'info');
        } catch (error) {
            console.error("Erro ao parar o compartilhamento de tela:", error);
            Utils.hideLoading();
            UI.showError("Falha ao parar o compartilhamento de tela", error.message);
        }
    },
    
    /**
     * Pausa o vídeo local temporariamente (otimização)
     */
    pauseLocalVideo: function() {
        if (this.localVideoTrack && !this.state.isVideoMuted) {
            // Não muda o estado de mudo, apenas pausa o processamento
            this.localVideoTrack.setEnabled(false);
        }
    },
    
    /**
     * Retoma o vídeo local após pausa temporária
     */
    resumeLocalVideo: function() {
        if (this.localVideoTrack && !this.state.isVideoMuted) {
            this.localVideoTrack.setEnabled(true);
        }
    },
    
    /**
     * Ajusta o volume do áudio local
     * @param {number} volume - Volume (0-200)
     */
    adjustLocalVolume: function(volume) {
        if (!this.localAudioTrack) return;
        
        volume = parseInt(volume);
        this.localAudioTrack.setVolume(volume);
        
        // Atualiza o valor na UI
        if (UI.elements.localVolumeValue) {
            UI.elements.localVolumeValue.textContent = volume + "%";
        }
    },
    
    /**
     * Ajusta o volume de um usuário remoto
     * @param {number|string} uid - ID do usuário
     * @param {number} volume - Volume (0-100)
     */
    adjustRemoteUserVolume: function(uid, volume) {
        const user = this.remoteUsers[uid];
        if (user && user.audioTrack) {
            volume = parseInt(volume);
            user.audioTrack.setVolume(volume);
            
            // Atualiza o valor na UI
            const volumeValueElement = document.getElementById(`volume-value-${uid}`);
            if (volumeValueElement) {
                volumeValueElement.textContent = volume + "%";
            }
        }
    },
    
    /**
     * Inicia o monitoramento de estatísticas de mídia
     */
    startStatsMonitoring: function() {
        // Limpa qualquer intervalo existente
        this.stopStatsMonitoring();
        
        // Inicia o monitoramento de estatísticas
        this.state.statsInterval = setInterval(() => {
            this.updateMediaStats();
        }, APP_CONFIG.connection.statsInterval);
        
        // Inicia o ping para verificação de qualidade da rede
        this.state.pingInterval = setInterval(() => {
            this.pingNetwork();
        }, APP_CONFIG.connection.pingInterval);
    },
    
    /**
     * Para o monitoramento de estatísticas
     */
    stopStatsMonitoring: function() {
        if (this.state.statsInterval) {
            clearInterval(this.state.statsInterval);
            this.state.statsInterval = null;
        }
        
        if (this.state.pingInterval) {
            clearInterval(this.state.pingInterval);
            this.state.pingInterval = null;
        }
    },
    
    /**
     * Atualiza as estatísticas de mídia
     */
    updateMediaStats: async function() {
        if (!this.client || !this.state.isJoined) return;
        
        try {
            // Estatísticas de vídeo local
            if (this.localVideoTrack) {
                const localStats = await this.client.getLocalVideoStats();
                const stats = {
                    resolution: {
                        width: localStats.sendResolution.width,
                        height: localStats.sendResolution.height
                    },
                    fps: Math.round(localStats.sendFrameRate),
                    bitrate: Math.round(localStats.sendBitrate / 1000) // kbps
                };
                
                UI.updateVideoStats('local', stats);
            }
            
            // Estatísticas de vídeo remoto
            for (const uid in this.remoteUsers) {
                const user = this.remoteUsers[uid];
                if (user && user.videoTrack) {
                    const remoteStats = await this.client.getRemoteVideoStats()[uid];
                    if (remoteStats) {
                        const stats = {
                            resolution: {
                                width: remoteStats.receiveResolution.width,
                                height: remoteStats.receiveResolution.height
                            },
                            fps: Math.round(remoteStats.receiveFrameRate),
                            bitrate: Math.round(remoteStats.receiveBitrate / 1000), // kbps
                            packetLoss: Math.round(remoteStats.receivePacketLossRate * 100) // porcentagem
                        };
                        
                        UI.updateVideoStats(uid, stats);
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao atualizar estatísticas:", error);
        }
    },
    
    /**
     * Executa um ping para verificar a qualidade da rede
     */
    pingNetwork: async function() {
        if (!navigator.onLine) {
            this.handleNetworkQuality(APP_CONFIG.networkQuality.DISCONNECTED);
            return;
        }
        
        try {
            // Tenta fazer uma requisição simples para verificar a conexão
            const start = Date.now();
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store'
            });
            const end = Date.now();
            const pingTime = end - start;
            
            // Estima qualidade com base no tempo de resposta
            let quality = APP_CONFIG.networkQuality.EXCELLENT;
            
            if (pingTime > 500) {
                quality = APP_CONFIG.networkQuality.VERY_BAD;
            } else if (pingTime > 300) {
                quality = APP_CONFIG.networkQuality.BAD;
            } else if (pingTime > 200) {
                quality = APP_CONFIG.networkQuality.POOR;
            } else if (pingTime > 100) {
                quality = APP_CONFIG.networkQuality.GOOD;
            }
            
            this.handleNetworkQuality(quality);
        } catch (error) {
            console.warn("Erro ao verificar conexão:", error);
            this.handleNetworkQuality(APP_CONFIG.networkQuality.DISCONNECTED);
        }
    },
    
    /**
     * Trata a qualidade de rede
     * @param {number} quality - Nível de qualidade da rede
     */
    handleNetworkQuality: function(quality) {
        // Atualiza o estado
        this.state.networkQuality = quality;
        
        // Atualiza a UI
        UI.updateNetworkQuality(quality);
        
        // Se a qualidade estiver muito ruim, avisa o usuário
        if (quality >= APP_CONFIG.networkQuality.BAD && quality !== APP_CONFIG.networkQuality.DISCONNECTED) {
            Utils.showNotification("Conexão instável. Verifique sua internet.", 'warning');
        }
    },
    
    /**
     * Trata o restabelecimento da conexão
     */
    handleConnectionEstablished: function() {
        if (this.state.currentAppState === APP_CONFIG.states.RECONNECTING) {
            Utils.hideLoading();
            this.updateState(APP_CONFIG.states.CONNECTED);
            Utils.showNotification("Conexão restabelecida", 'success');
            
            // Reseta contador de tentativas
            this.state.reconnectAttempts = 0;
        }
    },
    
    /**
     * Trata a perda de conexão de rede
     */
    handleNetworkDisconnection: function() {
        if (this.state.isJoined && this.state.currentAppState !== APP_CONFIG.states.RECONNECTING) {
            this.updateState(APP_CONFIG.states.RECONNECTING);
            Utils.showNotification("Conexão perdida. Tentando reconectar...", 'error');
            this.reconnect();
        }
    },
    
    /**
     * Trata o processo de reconexão
     */
    handleNetworkReconnecting: function() {
        if (this.state.isJoined && this.state.currentAppState !== APP_CONFIG.states.RECONNECTING) {
            this.updateState(APP_CONFIG.states.RECONNECTING);
            Utils.showLoading("Reconectando...");
            Utils.showNotification("Tentando reconectar...", 'warning');
        }
    },
    
    /**
     * Tenta reconectar ao canal
     */
    reconnect: function() {
        if (this.state.reconnectAttempts >= APP_CONFIG.connection.maxReconnectAttempts) {
            Utils.hideLoading();
            this.updateState(APP_CONFIG.states.ERROR);
            UI.showError("Não foi possível reconectar após várias tentativas. Tente entrar novamente.");
            this.state.isJoined = false;
            return;
        }
        
        this.state.reconnectAttempts++;
        
        Utils.showLoading(`Tentativa de reconexão ${this.state.reconnectAttempts}/${APP_CONFIG.connection.maxReconnectAttempts}...`);
        
        // A reconexão é gerenciada automaticamente pelo cliente Agora,
        // mas podemos fornecer feedback visual sobre o processo
        
        // Espera um pouco antes de tentar novamente
        setTimeout(() => {
            if (this.state.currentAppState === APP_CONFIG.states.RECONNECTING) {
                // Se ainda estiver tentando reconectar após o timeout,
                // provavelmente ainda há problemas de conexão
                if (this.state.reconnectAttempts < APP_CONFIG.connection.maxReconnectAttempts) {
                    this.reconnect();
                } else {
                    Utils.hideLoading();
                    this.updateState(APP_CONFIG.states.ERROR);
                    UI.showError("Não foi possível reconectar após várias tentativas. Tente entrar novamente.");
                    this.state.isJoined = false;
                }
            }
        }, APP_CONFIG.connection.reconnectTimeout);
    },
    
    /**
     * Trata erros do cliente Agora
     * @param {Error} error - Erro ocorrido
     */
    handleClientError: function(error) {
        // Erros específicos mais comuns
        switch (error.code) {
            case "OPERATION_ABORTED":
                // Operação cancelada, geralmente pelo usuário ou timeout
                break;
                
            case "INVALID_PARAMS":
                UI.showError("Parâmetros inválidos", error.message);
                break;
                
            case "INVALID_OPERATION":
                UI.showError("Operação inválida", error.message);
                break;
                
            case "OPERATION_RESOURCES_LIMITED":
                UI.showError("Recursos limitados", "Verifique se há outras aplicações usando sua câmera ou microfone");
                break;
                
            case "NETWORK_ERROR":
                this.handleNetworkDisconnection();
                break;
                
            default:
                UI.showError("Erro inesperado", error.message);
        }
    },
    
    /**
     * Atualiza o estado da aplicação
     * @param {string} state - Novo estado
     */
    updateState: function(state) {
        this.state.currentAppState = state;
        UI.updateState(state);
    }
};

// Exporta o objeto para uso global
window.App = App;
window.adjustRemoteUserVolume = App.adjustRemoteUserVolume.bind(App);

// Inicializa a aplicação quando a página for carregada
window.addEventListener('load', () => {
    App.initialize();
});
                    