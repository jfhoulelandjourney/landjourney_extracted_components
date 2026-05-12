import {
  RequestUser,
  RequestUserTypes,
  TaskSummary,
} from '../../models/requestModels';
import { ClientRequest } from '../../services/client/requests/client-requests.service';

export type StatusColor = 'green' | 'yellow' | 'red' | 'white';

export function getUserStatusForBackoffice(
  userSummary: TaskSummary | undefined
): StatusColor {
  if (!userSummary) return 'white'; // No status color if we don't receive a summary
  if (userSummary.need_updates > 0 || userSummary.incomplete > 0) return 'red'; // any incomplete task means red
  if (userSummary.submitted > 0) return 'yellow'; // yellow if any submitted tasks but no incomplete tasks
  return 'green'; // green if no outstanding tasks
}

export function getUserStatusForClient(
  userSummary: TaskSummary | undefined
): StatusColor {
  if (!userSummary) return 'white'; // No status color if we don't receive a summary
  if (userSummary.need_updates > 0) return 'red'; // any task needing updates means red
  if (userSummary.incomplete > 0) return 'yellow'; // yellow if any incomplete tasks
  return 'green'; // green if no outstanding tasks
}

export function getTotalTaskSummary(
  summaries: Record<string, TaskSummary>
): TaskSummary {
  return Object.values(summaries).reduce(
    (acc: TaskSummary, summary: TaskSummary) => ({
      approved: acc.approved + (summary.approved || 0),
      submitted: acc.submitted + (summary.submitted || 0),
      incomplete: acc.incomplete + (summary.incomplete || 0),
      need_updates: acc.need_updates + (summary.need_updates || 0),
    }),
    { approved: 0, submitted: 0, incomplete: 0, need_updates: 0 }
  );
}

export function computedEntityStatusForRequest(
  request: ClientRequest | undefined,
  aliases: string[]
): StatusColor {
  const summaries: Record<string, TaskSummary> = {};

  aliases.forEach(alias => {
    if (request?.userSummaries?.[alias]) {
      Object.assign(summaries, { alias: request.userSummaries[alias] });
    }
  });

  if (Object.keys(summaries).length === 0) {
    return 'white';
  }

  return getUserStatusForClient(getTotalTaskSummary(summaries));
}

export function computedEntitySummariesForRequest(
  request: ClientRequest | undefined,
  aliases: string[]
): TaskSummary {
  const summaries: Record<string, TaskSummary> = {};

  aliases.forEach(alias => {
    if (request?.userSummaries?.[alias]) {
      Object.assign(summaries, { alias: request.userSummaries[alias] });
    }
  });

  return getTotalTaskSummary(summaries);
}

export function getAliasesForEntity(
  users: RequestUser[],
  entityId: string
): string[] {
  const aliases = new Set<string>();

  for (const user of users) {
    if (
      user.representatives?.length &&
      user.representatives.includes(entityId) &&
      user.userId
    ) {
      aliases.add(user.userId);
    }

    if (
      user.userType !== RequestUserTypes.INDIVIDUAL &&
      !aliases.has(user.userId ?? '')
    ) {
      const associates = (user.profile?.users as RequestUser[]) || [];
      for (const associate of associates) {
        if (associate.userId === entityId && user.userId) {
          aliases.add(user.userId);
        }
      }
    }
  }

  aliases.add(entityId);

  return Array.from(aliases);
}

export function computedEntityStatusForRequests(
  entity: RequestUser,
  requests: ClientRequest[]
): StatusColor {
  if (requests.length === 0) {
    return 'white';
  }

  // get all the possible status
  const statuses = requests.map(request => {
    const aliases = getAliasesForEntity(request.users, entity.userId ?? '');
    return computedEntityStatusForRequest(request, aliases);
  });

  // if any of the status are red, return red
  if (statuses.includes('red')) {
    return 'red';
  }

  // if all the status are green, return green
  if (statuses.every(status => status === 'green')) {
    return 'green';
  }

  // else return yellow
  return 'yellow';
}

export function mapEntityStatusToColor(status?: StatusColor): string {
  let color = '#ffffff';

  if (status === 'red') color = '#E9655D';
  if (status === 'green') color = '#41D78F';
  if (status === 'yellow') color = '#F3B75E';
  if (status === 'white') color = '#fff';

  return color;
}
