export type Turno = 'MANHÃ' | 'NOITE' | 'FORA_DE_TURNO';

export function getTurnoAtual(): Turno {
  const agora = new Date();
  const hora = agora.getHours();
  const minuto = agora.getMinutes();
  const tempoEmMinutos = hora * 60 + minuto;

  // Manhã: 06:00 às 16:00
  const inicioManha = 6 * 60; // 360
  const fimManha = 16 * 60; // 960

  // Noite: 16:48 às 02:00 (dia seguinte)
  const inicioNoite = 16 * 60 + 48; // 1008
  const fimNoite = 2 * 60; // 120 (dia seguinte)

  if (tempoEmMinutos >= inicioManha && tempoEmMinutos < fimManha) {
    return 'MANHÃ';
  }

  // Lógica para turno da noite que cruza a meia-noite
  if (tempoEmMinutos >= inicioNoite || tempoEmMinutos < fimNoite) {
    return 'NOITE';
  }

  return 'FORA_DE_TURNO';
}

export function getDescricaoTurno(role: string, turno: Turno): string {
  const roleFormatada = role === 'ADMINISTRADOR' ? 'Assistente Administrativo' : 
                       role === 'ESTOQUISTA' ? 'Estoquista' : 
                       role === 'LIDER' ? 'Líder' : role;

  if (turno === 'MANHÃ') return `${roleFormatada} (Manhã)`;
  if (turno === 'NOITE') return `${roleFormatada} Noturno`;
  
  return roleFormatada;
}
