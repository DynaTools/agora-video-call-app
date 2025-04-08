// Funções para interagir com a interface do usuário

// Referencias para elementos da UI
const UI = {
    // Botões
    joinBtn: document.getElementById('join'),
    leaveBtn: document.getElementById('leave'),
    toggleAudioBtn: document.getElementById('toggleAudio'),
    toggleVideoBtn: document.getElementById('toggleVideo'),
    
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
    remoteUsersContainer: document.getElementById('remoteUsers')
};

// Atualiza o estado dos botões de acordo com o estado da aplicação
function updateUIState(state) {
    switch (state) {
        case 'disconnected':
            UI.joinBtn.disabled = false;
            UI.leaveBtn.disabled = true;
            UI.toggleAudioBtn.disabled = true;
            UI.toggleVideoBtn.disabled = true;
            UI.localVolumeSlider.disabled = true;
            UI.appIdInput.disabled = false;
            UI.channelInput.disabled = false;
            UI.tokenInput.disabled = false;
            UI.localVideoContainer.style.display = 'none';
            break;
            
        case 'joining':
            UI.joinBtn.disabled = true;
            UI.leaveBtn.disabled = true;
            UI.toggleAudioBtn.disabled = true;
            UI.toggleVideoBtn.disabled = true;
            UI.localVolumeSlider.disabled = true;
            UI.appIdInput.disabled = true;
            UI.channelInput.disabled = true;
            UI.tokenInput.disabled = true;
            break;
            
        case 'joined':
            UI.joinBtn.disabled = true;
            UI.leaveBtn.disabled = false;
            UI.toggleAudioBtn.disabled = false;
            UI.toggleVideoBtn.disabled = false;
            UI.localVolumeSlider.disabled = false;
            UI.appIdInput.disabled = true;
            UI.channelInput.disabled = true;
            UI.tokenInput.disabled = true;
            UI.localVideoContainer.style.display = 'block';
            break;
    }
}

// Atualiza o botão de áudio com base no estado de mudo
function updateAudioButtonState(isMuted) {
    UI.toggleAudioBtn.textContent = isMuted ? 'Ativar Microfone' : 'Silenciar Microfone';
}

// Atualiza o botão de vídeo com base no estado de mudo
function updateVideoButtonState(isMuted) {
    UI.toggleVideoBtn.textContent = isMuted ? 'Ativar Câmera' : 'Desligar Câmera';
}

// Exibe o vídeo local no container apropriado
function displayLocalVideo(videoTrack) {
    UI.localVideoContainer.innerHTML = ''; // Limpa o conteúdo anterior
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.textContent = 'Usuário Local';
    UI.localVideoContainer.appendChild(userInfo);
    
    // Exibe o vídeo
    videoTrack.play(UI.localVideoContainer);
}

// Cria e exibe um container de vídeo para um usuário remoto
function displayRemoteVideo(user) {
    // Verifica se já existe um container para este usuário
    let remoteContainer = document.getElementById(`remote-video-${user.uid}`);
    
    // Se não existir, cria um novo
    if (!remoteContainer) {
        remoteContainer = document.createElement('div');
        remoteContainer.id = `remote-video-${user.uid}`;
        remoteContainer.className = 'video-container';
        
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.textContent = `Usuário: ${user.uid}`;
        
        remoteContainer.appendChild(userInfo);
        UI.videoGrid.appendChild(remoteContainer);
    }
    
    // Exibe o vídeo no container
    user.videoTrack.play(remoteContainer);
}

// Adiciona um usuário remoto à lista com controles de volume
function addRemoteUserUI(user) {
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
        // O controlador do volume será definido no app.js
        if (typeof adjustRemoteUserVolume === 'function') {
            adjustRemoteUserVolume(user.uid, volume);
        }
        volumeValue.textContent = volume + '%';
    });
    
    volumeControls.appendChild(volumeLabel);
    volumeControls.appendChild(volumeSlider);
    volumeControls.appendChild(volumeValue);
    
    userItem.appendChild(userInfo);
    userItem.appendChild(volumeControls);
    
    UI.remoteUsersContainer.appendChild(userItem);
}

// Remove o vídeo de um usuário remoto
function removeRemoteVideo(uid) {
    const remoteContainer = document.getElementById(`remote-video-${uid}`);
    if (remoteContainer) {
        remoteContainer.remove();
    }
}

// Remove completamente um usuário remoto da interface
function removeRemoteUser(uid) {
    removeRemoteVideo(uid);
    
    const userItem = document.getElementById(`remote-user-${uid}`);
    if (userItem) {
        userItem.remove();
    }
}

// Limpa todos os vídeos remotos
function clearRemoteVideos() {
    // Remove todos os containers de vídeo remoto
    const remoteContainers = UI.videoGrid.querySelectorAll('.video-container:not(#localVideoContainer)');
    remoteContainers.forEach(container => container.remove());
    
    // Limpa a lista de usuários remotos
    UI.remoteUsersContainer.innerHTML = '';
}

// Inicializa o estado da UI
updateUIState('disconnected');