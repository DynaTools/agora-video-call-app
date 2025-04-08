// Arquivo para gerenciar o agente AI usando Azure e Gemini

// Configurações dos serviços AI
const AI_CONFIG = {
    // Configurações do Azure Speech Services
    azure: {
        speechKey: "", // Sua chave do Azure Speech Services
        speechRegion: "eastus", // Sua região do Azure Speech Services
        voiceName: "Paulo Augusto Giavoni" // Voz para síntese de fala em português
    },
    // Configurações do Gemini AI
    gemini: {
        apiKey: "", // Sua chave da API Gemini
        model: "gemini-2.0-flash" // Modelo Gemini a ser usado
    }
};

// Classe para gerenciar a funcionalidade do agente AI
class AIAgent {
    constructor() {
        this.isInitialized = false;
        this.isListening = false;
        this.speechRecognizer = null;
        this.speechSynthesizer = null;
        this.lastQuery = "";
        this.lastResponse = "";
        this.onConversationUpdated = null; // Callback para atualizar a UI
        this.isSpeaking = false;
    }

    // Inicializa os serviços de reconhecimento e síntese de fala
    async initialize(azureKey, azureRegion, voiceName) {
        try {
            if (!azureKey || !azureRegion) {
                throw new Error("Azure Speech Services key e region são necessários");
            }

            // Inicializar Speech SDK
            const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(azureKey, azureRegion);
            speechConfig.speechRecognitionLanguage = "pt-BR";
            speechConfig.speechSynthesisVoiceName = voiceName;

            // Configuração do reconhecedor de fala
            this.speechRecognizer = new SpeechSDK.SpeechRecognizer(speechConfig);
            
            // Configuração do sintetizador de fala
            this.speechSynthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);

            // Configurar handlers de eventos para reconhecimento contínuo
            this.speechRecognizer.recognized = (s, e) => {
                if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                    const transcript = e.result.text;
                    if (transcript.trim().length > 0) {
                        this.lastQuery = transcript;
                        this.processWithGemini(transcript);
                        
                        if (this.onConversationUpdated) {
                            this.onConversationUpdated({
                                type: 'user',
                                text: transcript
                            });
                        }
                    }
                }
            };

            this.isInitialized = true;
            console.log("Agente AI inicializado com sucesso");
            return true;
        } catch (error) {
            console.error("Erro ao inicializar o agente AI:", error);
            return false;
        }
    }

    // Inicia o reconhecimento contínuo de fala
    startListening() {
        if (!this.isInitialized) {
            console.error("Agente AI não inicializado");
            return false;
        }

        if (!this.isListening) {
            try {
                console.log("Iniciando reconhecimento de fala...");
                this.speechRecognizer.startContinuousRecognitionAsync();
                this.isListening = true;
                return true;
            } catch (error) {
                console.error("Erro ao iniciar reconhecimento de fala:", error);
                return false;
            }
        }
        return true;
    }

    // Para o reconhecimento contínuo de fala
    stopListening() {
        if (this.isListening && this.speechRecognizer) {
            try {
                this.speechRecognizer.stopContinuousRecognitionAsync();
                this.isListening = false;
                console.log("Reconhecimento de fala parado");
                return true;
            } catch (error) {
                console.error("Erro ao parar reconhecimento de fala:", error);
                return false;
            }
        }
        return true;
    }

    // Processa o texto reconhecido com o Gemini AI
    async processWithGemini(text) {
        if (!text || text.trim().length === 0) return;

        try {
            // Exibe mensagem de processamento na UI
            if (this.onConversationUpdated) {
                this.onConversationUpdated({
                    type: 'processing',
                    text: 'Processando...'
                });
            }

            const response = await this.callGeminiAPI(text);
            
            if (response) {
                this.lastResponse = response;
                
                // Atualiza a UI com a resposta
                if (this.onConversationUpdated) {
                    this.onConversationUpdated({
                        type: 'assistant',
                        text: response
                    });
                }
                
                // Sintetiza a resposta em fala
                this.speakResponse(response);
            }
        } catch (error) {
            console.error("Erro ao processar com Gemini:", error);
            
            if (this.onConversationUpdated) {
                this.onConversationUpdated({
                    type: 'error',
                    text: 'Erro ao processar a solicitação'
                });
            }
        }
    }

    // Chama a API do Gemini
    async callGeminiAPI(text) {
        const apiKey = AI_CONFIG.gemini.apiKey;
        if (!apiKey) {
            throw new Error("Chave da API Gemini não configurada");
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1/models/${AI_CONFIG.gemini.model}:generateContent?key=${apiKey}`;
            
            const requestBody = {
                contents: [
                    {
                        role: "user",
                        parts: [{ text }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(`API Error: ${data.error.message}`);
            }
            
            // Extrai o texto da resposta
            if (data.candidates && 
                data.candidates[0] && 
                data.candidates[0].content && 
                data.candidates[0].content.parts && 
                data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Formato de resposta inesperado");
            }
        } catch (error) {
            console.error("Erro na chamada da API Gemini:", error);
            throw error;
        }
    }

    // Sintetiza a resposta em fala usando Azure Speech Services
    async speakResponse(text) {
        if (!this.isInitialized || !this.speechSynthesizer) {
            console.error("Sintetizador de fala não inicializado");
            return;
        }

        try {
            console.log("Tentando sintetizar fala com o texto:", text);
            console.log("Estado do sintetizador:", this.speechSynthesizer ? "Inicializado" : "Não inicializado");
            
            this.isSpeaking = true;
            
            // Sintetiza a fala
            const result = await this.speechSynthesizer.speakTextAsync(text)
                .catch(error => {
                    console.error("Erro detalhado na síntese de fala:", error);
                    // Exibir mensagem visível para o usuário
                    if (this.onConversationUpdated) {
                        this.onConversationUpdated({
                            type: 'error',
                            text: 'Erro na síntese de voz: ' + error.message
                        });
                    }
                });
            
            if (result && result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                console.log("Síntese de fala concluída com sucesso");
            } else if (result) {
                console.error("Erro na síntese de fala:", result.errorDetails);
            }
            
            this.isSpeaking = false;
        } catch (error) {
            console.error("Erro ao sintetizar fala:", error);
            this.isSpeaking = false;
        }
    }

    // Cancela qualquer síntese de fala em andamento
    cancelSpeech() {
        if (this.speechSynthesizer && this.isSpeaking) {
            try {
                this.speechSynthesizer.cancelSynthesis();
                this.isSpeaking = false;
                console.log("Síntese de fala cancelada");
            } catch (error) {
                console.error("Erro ao cancelar síntese de fala:", error);
            }
        }
    }

    // Libera recursos do agente
    dispose() {
        // Cancela qualquer fala em andamento
        this.cancelSpeech();
        
        if (this.speechRecognizer) {
            this.stopListening();
            this.speechRecognizer.close();
            this.speechRecognizer = null;
        }
        
        if (this.speechSynthesizer) {
            this.speechSynthesizer.close();
            this.speechSynthesizer = null;
        }
        
        this.isInitialized = false;
        console.log("Recursos do agente AI liberados");
    }

    // Verifica se as chaves de API estão configuradas
    static validateConfig(config) {
        if (!config) return false;
        
        const azureValid = config.azure && 
                           config.azure.speechKey && 
                           config.azure.speechRegion;
        
        const geminiValid = config.gemini && 
                            config.gemini.apiKey;
        
        return azureValid && geminiValid;
    }
}

// Exporta a classe e configuração para uso em outros arquivos
window.AIAgent = AIAgent;
window.AI_CONFIG = AI_CONFIG;