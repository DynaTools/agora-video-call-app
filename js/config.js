/**
 * Configurações para o Agora Video Call App com Assistente AI
 * Contém constantes, padrões e opções de configuração centralizadas
 */

// Versão da aplicação
const APP_VERSION = '1.0.0';

// Configurações padrão do cliente Agora
const AGORA_CLIENT_CONFIG = {
    mode: "rtc",              // Modo RTC para comunicação em tempo real
    codec: "vp8",             // Formato de codificação de vídeo (VP8 tem melhor compatibilidade)
    enableDualStream: true,   // Habilita streams duplos para adaptação de qualidade
    logLevel: 1               // Nível de log (0: debug, 1: info, 2: warning, 3: error, 4: none)
};

// Configurações de qualidade do vídeo
const VIDEO_ENCODINGS = {
    low: {
        width: 320,
        height: 240,
        frameRate: 15,
        bitrateMin: 200,
        bitrateMax: 500
    },
    medium: {
        width: 640,
        height: 480,
        frameRate: 30,
        bitrateMin: 500,
        bitrateMax: 1000
    },
    high: {
        width: 1280,
        height: 720,
        frameRate: 30,
        bitrateMin: 1000,
        bitrateMax: 2000
    }
};

// Configurações padrão de mídia
const DEFAULT_MEDIA_CONFIG = {
    audioConfig: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    },
    videoConfig: VIDEO_ENCODINGS.medium,
    defaultMicVolume: 100,
    defaultSpeakerVolume: 100
};

// Configurações de timeout e reconexão
const CONNECTION_CONFIG = {
    joinTimeout: 10000,           // Tempo máximo para tentar entrar no canal (ms)
    reconnectTimeout: 5000,       // Tempo de espera antes de tentar reconectar (ms)
    maxReconnectAttempts: 3,      // Número máximo de tentativas de reconexão
    pingInterval: 3000,           // Intervalo para verificação de qualidade da rede (ms)
    statsInterval: 2000           // Intervalo para atualização de estatísticas (ms)
};

// Configurações para o armazenamento local
const STORAGE_KEYS = {
    appId: 'agoraApp_appId',
    channel: 'agoraApp_channel',
    azureKey: 'agoraApp_azureKey',
    azureRegion: 'agoraApp_azureRegion',
    geminiKey: 'agoraApp_geminiKey',
    voiceName: 'agoraApp_voiceName',
    firstVisit: 'agoraApp_firstVisit',
    theme: 'agoraApp_theme',
    videoQuality: 'agoraApp_videoQuality'
};

// URLs para documentação de ajuda
const HELP_URLS = {
    general: "https://docs.agora.io/en/video-calling/get-started/get-started-sdk",
    token: "https://docs.agora.io/en/video-calling/reference/manage-agora-account#generate-a-temporary-token",
    troubleshooting: "https://docs.agora.io/en/video-calling/develop/troubleshooting-guide",
    azure: "https://docs.microsoft.com/azure/cognitive-services/speech-service/",
    gemini: "https://ai.google.dev/docs"
};

// Estados da aplicação
const APP_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error'
};

// Estados da mídia
const MEDIA_STATES = {
    ENABLED: 'enabled',
    DISABLED: 'disabled',
    LOADING: 'loading',
    ERROR: 'error'
};

// Níveis de qualidade de rede
const NETWORK_QUALITY = {
    UNKNOWN: 0,
    EXCELLENT: 1,
    GOOD: 2,
    POOR: 3,
    BAD: 4,
    VERY_BAD: 5,
    DISCONNECTED: 6
};

// Nomes de qualidade de rede
const NETWORK_QUALITY_NAMES = {
    0: 'Desconhecida',
    1: 'Excelente',
    2: 'Boa',
    3: 'Regular',
    4: 'Ruim',
    5: 'Muito ruim',
    6: 'Desconectado'
};

// Classes CSS para qualidade de rede
const NETWORK_QUALITY_CLASSES = {
    0: '',
    1: 'good',
    2: 'good',
    3: 'fair',
    4: 'poor',
    5: 'poor',
    6: ''
};

// Mensagens de erro
const ERROR_MESSAGES = {
    CONNECTION_TIMEOUT: 'Tempo esgotado ao tentar conectar. Verifique sua conexão e tente novamente.',
    DEVICE_NOT_FOUND: 'Não foi possível encontrar os dispositivos de mídia. Verifique se câmera e microfone estão conectados.',
    PERMISSION_DENIED: 'Permissão para acessar câmera ou microfone negada. Por favor, permita o acesso e tente novamente.',
    INVALID_APP_ID: 'App ID inválido ou não fornecido.',
    INVALID_TOKEN: 'Token inválido ou expirado.',
    NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente.',
    CHANNEL_ERROR: 'Não foi possível entrar no canal especificado.',
    GENERAL_ERROR: 'Ocorreu um erro inesperado. Por favor, tente novamente.'
};

// Exportar as configurações como um objeto global
window.APP_CONFIG = {
    version: APP_VERSION,
    agora: AGORA_CLIENT_CONFIG,
    video: VIDEO_ENCODINGS,
    media: DEFAULT_MEDIA_CONFIG,
    connection: CONNECTION_CONFIG,
    storage: STORAGE_KEYS,
    help: HELP_URLS,
    states: APP_STATES,
    mediaStates: MEDIA_STATES,
    networkQuality: NETWORK_QUALITY,
    networkQualityNames: NETWORK_QUALITY_NAMES,
    networkQualityClasses: NETWORK_QUALITY_CLASSES,
    errorMessages: ERROR_MESSAGES
};