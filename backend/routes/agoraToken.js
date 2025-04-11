const express = require('express');
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

/**
 * @route   GET /api/agora-token
 * @desc    Gera um token para o Agora RTC
 * @access  Public (para este demo)
 */
router.get('/', (req, res) => {
  // Obter dados da requisição
  const channelName = req.query.channelName || process.env.DEFAULT_CHANNEL_NAME || 'default_channel';
  const uid = parseInt(req.query.uid) || 0; // 0 para uid gerado automaticamente
  const role = RtcRole.PUBLISHER; // Usuário tem permissão para publicar áudio/vídeo
  
  // Token expira em 1 hora (em segundos)
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  
  // Verificar se as variáveis de ambiente estão definidas
  if (!process.env.AGORA_APP_ID || !process.env.AGORA_APP_CERTIFICATE) {
    return res.status(500).json({ error: 'Credenciais Agora não configuradas no servidor' });
  }

  try {
    // Gerar o token
    const token = RtcTokenBuilder.buildTokenWithUid(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );
    
    // Responder com o token e informações adicionais
    res.json({
      token,
      appId: process.env.AGORA_APP_ID,
      channelName,
      uid,
      expiresIn: expirationTimeInSeconds
    });
    
    console.log(`Token gerado para o canal ${channelName}, uid ${uid}`);
  } catch (error) {
    console.error('Erro ao gerar token:', error);
    res.status(500).json({ error: 'Falha ao gerar token', details: error.message });
  }
});

module.exports = router;