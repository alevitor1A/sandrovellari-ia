export const MODES = {
  CONVERSA: 'conversa',
  EXECUCAO: 'execucao'
};

// detecta automaticamente o modo
export function detectMode(message) {
  const comandosExecucao = [
    'abra',
    'abre',
    'mande',
    'envie',
    'abre o whatsapp',
    'envia mensagem',
    'abra o telegram',
    'faça',
    'executa',
    'execute',
    'manda mensagem'
  ];

  const texto = (message || '').toLowerCase();

  const isExecucao = comandosExecucao.some(cmd => texto.includes(cmd));

  return isExecucao ? MODES.EXECUCAO : MODES.CONVERSA;
}
