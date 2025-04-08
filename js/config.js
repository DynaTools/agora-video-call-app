// Arquivo de configuração para armazenar valores constantes e configurações

// Você pode definir um App ID padrão aqui se desejar
// const DEFAULT_APP_ID = "seu-app-id-aqui";

// Configurações padrão do cliente Agora
const AGORA_CLIENT_CONFIG = {
    mode: "rtc",  // Modo RTC para comunicação em tempo real
    codec: "vp8"  // Formato de codificação de vídeo (VP8 tem melhor compatibilidade)
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

// Configurações de restrições de áudio
const AUDIO_CONSTRAINTS = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
};

// URLs para documentação de ajuda
const HELP_URLS = {
    general: "https://docs.agora.io/en/video-calling/get-started/get-started-sdk",
    token: "https://docs.agora.io/en/video-calling/reference/manage-agora-account#generate-a-temporary-token",
    troubleshooting: "https://docs.agora.io/en/video-calling/develop/troubleshooting-guide"
};