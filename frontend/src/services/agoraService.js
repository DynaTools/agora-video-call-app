import AgoraRTC from 'agora-rtc-sdk-ng';

// Configurar cliente Agora
AgoraRTC.setLogLevel(process.env.NODE_ENV === 'production' ? 4 : 0);

/**
 * Classe para gerenciar conexão Agora
 */
class AgoraService {
  constructor() {
    this.client = null;
    this.localAudioTrack = null;
    this.localVideoTrack = null;
    this.isJoined = false;
    this.onRemoteUserJoined = null;
    this.onRemoteUserLeft = null;
  }

  /**
   * Inicializa o cliente Agora
   */
  init() {
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    this._registerEventHandlers();
    console.log('Cliente Agora inicializado');
  }

  /**
   * Registra handlers de eventos
   */
  _registerEventHandlers() {
    // Quando um usuário remoto entra no canal
    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType);
      console.log('Inscrito no usuário remoto:', user.uid);
      
      if (mediaType === 'video' && this.onRemoteUserJoined) {
        this.onRemoteUserJoined(user);
      }
      
      if (mediaType === 'audio') {
        user.audioTrack.play();
      }
    });

    // Quando um usuário remoto sai do canal
    this.client.on('user-left', (user) => {
      console.log('Usuário remoto saiu:', user.uid);
      if (this.onRemoteUserLeft) {
        this.onRemoteUserLeft(user);
      }
    });
  }

  /**
   * Entra em um canal Agora
   * @param {String} appId - App ID da Agora
   * @param {String} channel - Nome do canal 
   * @param {String} token - Token gerado pelo servidor
   * @param {Number|String} uid - ID do usuário (opcional)
   */
  async join(appId, channel, token, uid = null) {
    if (!this.client) this.init();
    
    try {
      // Entrar no canal
      await this.client.join(appId, channel, token, uid);
      console.log('Entrou no canal com sucesso:', channel);
      this.isJoined = true;
      
      // Criar e publicar tracks de áudio e vídeo locais
      [this.localAudioTrack, this.localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      
      // Publicar tracks locais
      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
      console.log('Tracks locais publicados');
      
      return true;
    } catch (error) {
      console.error('Erro ao entrar no canal:', error);
      throw error;
    }
  }

  /**
   * Sai do canal atual
   */
  async leave() {
    if (!this.isJoined) return;
    
    // Liberar recursos de áudio e vídeo locais
    if (this.localAudioTrack) {
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }
    
    if (this.localVideoTrack) {
      this.localVideoTrack.close();
      this.localVideoTrack = null;
    }
    
    // Sair do canal
    await this.client.leave();
    console.log('Saiu do canal');
    this.isJoined = false;
  }

  /**
   * Ativa/desativa o áudio local
   * @param {Boolean} enabled - Se o áudio deve estar ativo
   */
  toggleMicrophone(enabled) {
    if (this.localAudioTrack) {
      this.localAudioTrack.setEnabled(enabled);
      return enabled;
    }
    return false;
  }

  /**
   * Ativa/desativa o vídeo local
   * @param {Boolean} enabled - Se o vídeo deve estar ativo
   */
  toggleCamera(enabled) {
    if (this.localVideoTrack) {
      this.localVideoTrack.setEnabled(enabled);
      return enabled;
    }
    return false;
  }

  /**
   * Retorna os tracks locais (áudio e vídeo)
   */
  getLocalTracks() {
    return {
      audioTrack: this.localAudioTrack,
      videoTrack: this.localVideoTrack
    };
  }

  /**
   * Define callbacks para eventos de usuários remotos
   * @param {Function} onJoined - Callback quando um usuário entra
   * @param {Function} onLeft - Callback quando um usuário sai
   */
  setRemoteUserCallbacks(onJoined, onLeft) {
    this.onRemoteUserJoined = onJoined;
    this.onRemoteUserLeft = onLeft;
  }
}

// Exportar uma instância única
const agoraService = new AgoraService();
export default agoraService;