/**
 * Gerenciador do assistente AI usando Azure Speech Services e Gemini AI
 * Responsável pelo reconhecimento de fala, processamento com IA e síntese de voz
 */

// Configurações dos serviços AI
const AI_CONFIG = {
    // Configurações do Azure Speech Services
    azure: {
        speechKey: "", // Chave do Azure Speech Services
        speechRegion: "eastus", // Região do Azure Speech Services
        voiceName: "pt-BR-AntonioNeural", // Voz padrão para síntese de fala em português
        recognitionLanguage: "pt-BR", // Idioma para reconhecimento de fala
        profanityOption: "masked", // Opção para palavrões (raw, masked, removed)
        audioConfig: {
            enableAudioLogging: false, // Não registra áudio para privacidade
            enableDictation: true, // Melhor para comandos
            enableAudioGainControl: true // Ajusta ganho automaticamente
        },
        synthesisConfig: {
            speakingRate: 1.0, // Taxa de fala normal
            speakingPitch: 1.0 // Tom de voz normal
        }
    },
    // Configurações do Gemini AI
    gemini: {
        apiKey: "", // Chave da API Gemini
        model: "gemini-2.0-flash", // Modelo Gemini a ser usado
        temperature: 0.7, // Criatividade (0.0 a 1.0)
        maxOutputTokens: 800, // Limita o tamanho da resposta
        systemPrompt: "Você é um assistente virtual em uma chamada de vídeo. " +
                     "Responda de forma concisa e útil. " +
                     "Evite respostas longas pois será necessário falar sua resposta. " +
                     "Tente limitar suas respostas a no máximo 3 frases curtas quando possível. " +
                     "Dê preferência para sentenças diretas e objetivas. " +
                     "Fale em português do Brasil de forma natural."
    }
};

/**
 * Classe que gerencia a funcionalidade do assistente AI
 */
class AIAgent {
    /**
     * Construtor
     */
    constructor() {
        this.isInitialized = false;
        this.isListening = false;
        this.speechRecognizer = null;
        this.speechSynthesizer = null;
        this.lastQuery = "";
        this.lastResponse = "";
        this.onConversationUpdated = null; // Callback para atualizar a UI
        this.isSpeaking = false;
        this.conversation = []; // Histórico de conversa para contexto
        this.retryCount = 0;
        this.maxRetries = 3;
        this.azureSpeechSDK = null;
    }

    /**
     * Inicializa os serviços de reconhecimento e síntese de fala
     * @param {string} azureKey - Chave do Azure Speech Services
     * @param {string} azureRegion - Região do Azure Speech Services
     * @param {string} voiceName - Nome da voz para síntese
     * @return {Promise<boolean>} Sucesso da inicialização
     */
    async initialize(azureKey, azureRegion, voiceName) {
        try {
            if (!azureKey || !azureRegion) {
                throw new Error("Azure Speech Services key e region são necessários");
            }

            // Carrega o Speech SDK de forma preguiçosa
            if (!this.azureSpeechSDK) {
                this.azureSpeechSDK = await this.loadAzureSpeechSDK();
            }

            const SpeechSDK = this.azureSpeechSDK;
            
            // Inicializar Speech SDK
            const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(azureKey, azureRegion);
            speechConfig.speechRecognitionLanguage = AI_CONFIG.azure.recognitionLanguage;
            speechConfig.speechSynthesisVoiceName = voiceName || AI_CONFIG.azure.voiceName;
            speechConfig.setProfanity(AI_CONFIG.azure.profanityOption);
            
            // Configurações avançadas para reconhecimento
            speechConfig.enableAudioLogging(AI_CONFIG.azure.audioConfig.enableAudioLogging);
            if (AI_CONFIG.azure.audioConfig.enableDictation) {
                speechConfig.enableDictation();
            }

            // Configuração do reconhecedor de fala
            const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
            this.speechRecognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
            
            // Configuração do sintetizador de fala
            this.speechSynthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);

            // Configurar handlers de eventos para reconhecimento contínuo
            this.setupRecognizerEvents();

            this.isInitialized = true;
            console.log("Agente AI inicializado com sucesso");
            return true;
        } catch (error) {
            console.error("Erro ao inicializar o agente AI:", error);
            return false;
        }
    }

    /**
     * Carrega o Azure Speech SDK de forma preguiçosa
     * @return {Promise<Object>} SDK carregado
     */
    async loadAzureSpeechSDK() {
        if (window.SpeechSDK) {
            return window.SpeechSDK;
        }

        return new Promise((resolve, reject) => {
            try {
                Utils.showLoading("Carregando Speech SDK...");
                const script = document.createElement('script');
                script.src = "https://aka.ms/csspeech/jsbrowserpackageraw";
                script.async = true;
                script.onload = () => {
                    Utils.hideLoading();
                    if (window.SpeechSDK) {
                        resolve(window.SpeechSDK);
                    } else {
                        reject(new Error("Falha ao carregar o Azure Speech SDK"));
                    }
                };
                script.onerror = () => {
                    Utils.hideLoading();
                    reject(new Error("Falha ao carregar o Azure Speech SDK"));
                };
                document.body.appendChild(script);
            } catch (error) {
                Utils.hideLoading();
                reject(error);
            }
        });
    }

    /**
     * Configura os eventos do reconhecedor de fala
     */
    setupRecognizerEvents() {
        if (!this.speechRecognizer) return;

        // Evento para quando o reconhecimento é finalizado
        this.speechRecognizer.recognized = (s, e) => {
            if (e.result.reason === this.azureSpeechSDK.ResultReason.RecognizedSpeech) {
                const transcript = e.result.text;
                if (transcript.trim().length > 0) {
                    this.lastQuery = transcript;
                    
                    // Adiciona a consulta ao histórico
                    this.conversation.push({
                        role: "user",
                        content: transcript
                    });
                    
                    // Processa a consulta com IA
                    this.processWithGemini(transcript);
                    
                    // Atualiza a UI
                    if (this.onConversationUpdated) {
                        this.onConversationUpdated({
                            type: 'user',
                            text: transcript
                        });
                    }
                }
            }
        };

        // Evento para quando ocorre um erro no reconhecimento
        this.speechRecognizer.canceled = (s, e) => {
            if (e.reason === this.azureSpeechSDK.CancellationReason.Error) {
                console.error(`Erro de reconhecimento: ${e.errorCode} - ${e.errorDetails}`);
                
                if (this.onConversationUpdated) {
                    this.onConversationUpdated({
                        type: 'error',
                        text: `Erro no reconhecimento de fala: ${e.errorDetails}`
                    });
                }
            }
        };

        // Evento para iniciar uma nova sessão
        this.speechRecognizer.sessionStarted = (s, e) => {
            console.log("Sessão de reconhecimento iniciada");
        };

        // Evento para finalizar uma sessão
        this.speechRecognizer.sessionStopped = (s, e) => {
            console.log("Sessão de reconhecimento encerrada");
            // Se o reconhecimento foi parado inesperadamente, reinicie-o
            if (this.isListening) {
                console.log("Tentando reiniciar o reconhecimento...");
                this.retryRecognition();
            }
        };
    }

    /**
     * Tenta reiniciar o reconhecimento após falha
     */
    retryRecognition() {
        if (this.retryCount >= this.maxRetries) {
            console.error("Número máximo de tentativas de reconhecimento excedido");
            this.isListening = false;
            
            if (this.onConversationUpdated) {
                this.onConversationUpdated({
                    type: 'error',
                    text: 'Falha ao reconhecer fala após várias tentativas. Por favor, reinicie o assistente.'
                });
            }
            return;
        }
        
        this.retryCount++;
        
        setTimeout(() => {
            try {
                this.speechRecognizer.startContinuousRecognitionAsync();
                console.log(`Reconhecimento reiniciado (tentativa ${this.retryCount})`);
            } catch (error) {
                console.error("Erro ao reiniciar reconhecimento:", error);
                this.retryRecognition();
            }
        }, 1000);
    }

    /**
     * Inicia o reconhecimento contínuo de fala
     * @return {boolean} Sucesso da operação
     */
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
                this.retryCount = 0;
                return true;
            } catch (error) {
                console.error("Erro ao iniciar reconhecimento de fala:", error);
                return false;
            }
        }
        return true;
    }

    /**
     * Para o reconhecimento contínuo de fala
     * @return {boolean} Sucesso da operação
     */
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

    /**
     * Processa o texto reconhecido com o Gemini AI
     * @param {string} text - Texto reconhecido para processar
     */
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
                
                // Adiciona a resposta ao histórico
                this.conversation.push({
                    role: "assistant",
                    content: response
                });
                
                // Mantém o histórico com tamanho razoável (últimas 10 interações)
                if (this.conversation.length > 20) {
                    this.conversation = this.conversation.slice(-20);
                }
                
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
                    text: 'Erro ao processar a solicitação: ' + (error.message || 'Falha na comunicação com o serviço de IA')
                });
            }
        }
    }

    /**
     * Chama a API do Gemini
     * @param {string} text - Texto do usuário
     * @return {Promise<string>} Resposta gerada
     */
    async callGeminiAPI(text) {
        const apiKey = AI_CONFIG.gemini.apiKey;
        if (!apiKey) {
            throw new Error("Chave da API Gemini não configurada");
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1/models/${AI_CONFIG.gemini.model}:generateContent?key=${apiKey}`;
            
            // Preparar o contexto com o histórico de conversa
            const requestBody = {
                contents: [
                    { role: "system", parts: [{ text: AI_CONFIG.gemini.systemPrompt }] },
                    ...this.conversation
                ],
                generationConfig: {
                    temperature: AI_CONFIG.gemini.temperature,
                    maxOutputTokens: AI_CONFIG.gemini.maxOutputTokens
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

    /**
     * Sintetiza a resposta em fala usando Azure Speech Services
     * @param {string} text - Texto para converter em fala
     */
    async speakResponse(text) {
        if (!this.isInitialized || !this.speechSynthesizer) {
            console.error("Sintetizador de fala não inicializado");
            return;
        }

        try {
            console.log("Sintetizando fala com o texto:", text);
            
            this.isSpeaking = true;
            
            // Pausa o reconhecimento durante a fala para evitar eco
            if (this.isListening) {
                await this.speechRecognizer.stopContinuousRecognitionAsync();
            }
            
            // Prepara o texto com SSML para melhor controle
            const ssml = `
                <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
                       xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${AI_CONFIG.azure.recognitionLanguage}">
                    <voice name="${AI_CONFIG.azure.voiceName}">
                        <mstts:express-as style="assistant">
                            <prosody rate="${AI_CONFIG.azure.synthesisConfig.speakingRate}" 
                                     pitch="${AI_CONFIG.azure.synthesisConfig.speakingPitch}">
                                ${this.escapeXml(text)}
                            </prosody>
                        </mstts:express-as>
                    </voice>
                </speak>
            `;
            
            // Sintetiza a fala
            const result = await this.speechSynthesizer.speakSsmlAsync(ssml)
                .catch(error => {
                    console.error("Erro detalhado na síntese de fala:", error);
                    if (this.onConversationUpdated) {
                        this.onConversationUpdated({
                            type: 'error',
                            text: 'Erro na síntese de voz: ' + error.message
                        });
                    }
                });
            
            if (result && result.reason === this.azureSpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                console.log("Síntese de fala concluída com sucesso");
            } else if (result) {
                console.error("Erro na síntese de fala:", result.errorDetails);
            }
            
            this.isSpeaking = false;
            
            // Reinicia o reconhecimento após a fala
            if (this.isListening) {
                await this.speechRecognizer.startContinuousRecognitionAsync();
            }
        } catch (error) {
            console.error("Erro ao sintetizar fala:", error);
            this.isSpeaking = false;
            
            // Tenta reiniciar o reconhecimento
            if (this.isListening) {
                try {
                    await this.speechRecognizer.startContinuousRecognitionAsync();
                } catch (err) {
                    console.error("Erro ao reiniciar reconhecimento após falha na síntese:", err);
                }
            }
        }
    }

    /**
     * Escapa caracteres XML para uso em SSML
     * @param {string} text - Texto para escapar
     * @return {string} Texto escapado
     */
    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Cancela qualquer síntese de fala em andamento
     */
    cancelSpeech() {
        if (this.speechSynthesizer && this.isSpeaking) {
            try {
                this.speechSynthesizer.close();
                // Recria o sintetizador
                const SpeechSDK = this.azureSpeechSDK;
                const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
                    AI_CONFIG.azure.speechKey, 
                    AI_CONFIG.azure.speechRegion
                );
                speechConfig.speechSynthesisVoiceName = AI_CONFIG.azure.voiceName;
                this.speechSynthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
                
                this.isSpeaking = false;
                console.log("Síntese de fala cancelada");
                
                // Reinicia o reconhecimento se estiver ativo
                if (this.isListening) {
                    this.startListening();
                }
            } catch (error) {
                console.error("Erro ao cancelar síntese de fala:", error);
            }
        }
    }

    /**
     * Limpa o histórico de conversa
     */
    clearConversation() {
        this.conversation = [];
        console.log("Histórico de conversa limpo");
    }

    /**
     * Libera recursos do agente
     */
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
        this.isListening = false;
        console.log("Recursos do agente AI liberados");
    }

    /**
     * Verifica se as chaves de API estão configuradas
     * @param {Object} config - Configuração a ser validada
     * @return {boolean} Configuração é válida
     */
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

// Exporta a classe e configuração para uso global
window.AIAgent = AIAgent;
window.AI_CONFIG = AI_CONFIG;