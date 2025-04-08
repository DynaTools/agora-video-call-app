// Arquivo principal da aplicação

// Variáveis globais
let client = null;
let localAudioTrack = null;
let localVideoTrack = null;
let isAudioMuted = false;
let isVideoMuted = false;
let remoteUsers = {};
let isJoined = false;

// Inicializa a aplicação
function initializeApp() {
    // Adiciona eventos aos elementos da UI
    UI.joinBtn.addEventListener('click', joinChannel);
    UI.leaveBtn.addEventListener('click', leaveChannel);
    UI.toggleAudioBtn.addEventListener('click', toggleLocalAudio);
    UI.toggleVideoBtn.addEventListener('click', toggleLocalVideo);
    UI.localVolumeSlider.addEventListener('input', adjustLocalVolume);
    
    console.log('Aplicação inicializada');
}

// Inicializa o cliente Agora
function initializeClient() {
    // Estamos usando a variável AgoraRTC que é carregada do CDN no index.html
    client = AgoraRTC.createClient(AGORA_CLIENT_CONFIG);
    setupEventListeners();
}

// Configura os event listeners do cliente Agora
function setupEventListeners() {
    // Quando um usuário remoto publica uma mídia
    client.on("user-published", async (user, mediaType) => {
        // Inscreva-se na mídia do usuário remoto
        await client.subscribe(user, mediaType);
        console.log(`Inscrito na mídia ${mediaType} do usuário ${user.uid}`);
        
        // Se o usuário for novo, adicione-o à lista de usuários remotos
        if (!remoteUsers[user.uid]) {
            remoteUsers[user.uid] = user;
            addRemoteUserUI(user);
        }
        
        // Trate o tipo de mídia apropriadamente
        if (mediaType === "video") {
            displayRemoteVideo(user);
        } else if (mediaType === "audio") {
            user.audioTrack.play();
        }
    });
    
    // Quando um usuário remoto cancela a publicação de uma mídia
    client.on("user-unpublished", (user, mediaType) => {
        console.log(`Usuário ${user.uid} parou de publicar a mídia ${mediaType}`);
        
        // Se for vídeo, remova o container de vídeo
        if (mediaType === "video") {
            removeRemoteVideo(user.uid);
        }
    });
    
    // Quando um usuário remoto sai do canal
    client.on("user-left", (user) => {
        console.log(`Usuário ${user.uid} saiu do canal`);
        
        // Remova o usuário dos nossos dados
        delete remoteUsers[user.uid];
        
        // Remova os elementos da UI
        removeRemoteUser(user.uid);
    });
}

// Entra no canal
async function joinChannel() {
    try {
        const appId = UI.appIdInput.value.trim();
        const channel = UI.channelInput.value.trim();
        const token = UI.tokenInput.value.trim() || null;
        
        // Valida os campos de entrada
        if (!appId) {
            alert("Por favor, insira um App ID");
            return;
        }
        if (!channel) {
            alert("Por favor, insira um nome de canal");
            return;
        }
        
        // Inicializa o cliente se ainda não tiver sido feito
        if (!client) {
            initializeClient();
        }
        
        // Atualiza a UI para o estado de conexão
        updateUIState('joining');
        
        // Entra no canal
        const uid = await client.join(appId, channel, token, null);
        console.log(`Entrou no canal ${channel} com UID ${uid}`);
        
        try {
            // Cria as tracks de áudio e vídeo locais
            localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            localVideoTrack = await AgoraRTC.createCameraVideoTrack();
            
            // Exibe o vídeo local
            displayLocalVideo(localVideoTrack);
            
            // Publica as tracks locais
            await client.publish([localAudioTrack, localVideoTrack]);
            console.log("Tracks locais publicadas com sucesso");
            
            // Atualiza a UI
            updateUIState('joined');
            isJoined = true;
        } catch (error) {
            // Se houver erro ao criar ou publicar as tracks
            console.error("Erro ao configurar mídias locais:", error);
            await client.leave();
            updateUIState('disconnected');
            
            if (error.code === 'PERMISSION_DENIED') {
                alert("Permissão para acessar câmera ou microfone negada. Por favor, permita o acesso e tente novamente.");
            } else {
                alert(`Erro ao configurar mídias locais: ${error.message}`);
            }
        }
    } catch (error) {
        console.error("Erro ao entrar no canal:", error);
        alert(`Falha ao entrar no canal: ${error.message}`);
        updateUIState('disconnected');
    }
}

// Sai do canal
async function leaveChannel() {
    try {
        // Fecha as tracks locais
        if (localAudioTrack) {
            localAudioTrack.close();
            localAudioTrack = null;
        }
        if (localVideoTrack) {
            localVideoTrack.close();
            localVideoTrack = null;
        }
        
        // Sai do canal
        await client.leave();
        console.log("Saiu do canal");
        
        // Limpa os usuários remotos
        remoteUsers = {};
        
        // Atualiza a UI e o estado da aplicação
        updateUIState('disconnected');
        isJoined = false;
        clearRemoteVideos();
        
        // Reseta os estados de mudo
        isAudioMuted = false;
        isVideoMuted = false;
        updateAudioButtonState(false);
        updateVideoButtonState(false);
    } catch (error) {
        console.error("Erro ao sair do canal:", error);
        alert(`Falha ao sair do canal: ${error.message}`);
    }
}

// Ativa/desativa o áudio local
function toggleLocalAudio() {
    if (!localAudioTrack) return;
    
    if (isAudioMuted) {
        // Ativa o áudio
        localAudioTrack.setMuted(false);
        isAudioMuted = false;
        updateAudioButtonState(false);
    } else {
        // Desativa o áudio
        localAudioTrack.setMuted(true);
        isAudioMuted = true;
        updateAudioButtonState(true);
    }
}

// Ativa/desativa o vídeo local
function toggleLocalVideo() {
    if (!localVideoTrack) return;
    
    if (isVideoMuted) {
        // Ativa o vídeo
        localVideoTrack.setMuted(false);
        isVideoMuted = false;
        updateVideoButtonState(false);
    } else {
        // Desativa o vídeo
        localVideoTrack.setMuted(true);
        isVideoMuted = true;
        updateVideoButtonState(true);
    }
}

// Ajusta o volume do áudio local
function adjustLocalVolume() {
    if (!localAudioTrack) return;
    
    const volume = parseInt(UI.localVolumeSlider.value);
    localAudioTrack.setVolume(volume);
    UI.localVolumeValue.textContent = volume + "%";
}

// Ajusta o volume de um usuário remoto
function adjustRemoteUserVolume(uid, volume) {
    const user = remoteUsers[uid];
    if (user && user.audioTrack) {
        user.audioTrack.setVolume(volume);
    }
}

// Função auxiliar para lidar com erros
function showErrorMessage(message, error = null) {
    console.error(message, error);
    let errorMessage = message;
    if (error && error.message) {
        errorMessage += `: ${error.message}`;
    }
    alert(errorMessage);
}

// Inicia a aplicação quando a página for carregada
window.addEventListener('load', initializeApp);