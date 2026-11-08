import type { ApplicationItem } from '../api';
import { StatusPill } from './StatusPill';

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}

export function Timeline({ events }: { events: ApplicationItem['events'] }) {
  if (events.length === 0) return null;
  return (
    <ol className="timeline">
      {events.map((event) => (
        <li key={event.id}>
          <StatusPill status={event.status} />
          <time dateTime={event.createdAt}>{formatWhen(event.createdAt)}</time>
          {event.note ? <span>{event.note}</span> : null}
        </li>
      ))}
    </ol>
  );
}
