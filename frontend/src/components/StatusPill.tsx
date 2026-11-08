const labels: Record<string, string> = {
  ABERTA: 'Aberta',
  ENCERRADA: 'Encerrada',
  ENVIADA: 'Enviada',
  EM_ANALISE: 'Em análise',
  ENTREVISTA: 'Entrevista',
  APROVADA: 'Aprovada',
  REPROVADA: 'Reprovada',
  CANCELADA: 'Cancelada',
};

export function statusLabel(status: string) {
  return labels[status] ?? status;
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="pill" data-status={status}>
      {statusLabel(status)}
    </span>
  );
}
