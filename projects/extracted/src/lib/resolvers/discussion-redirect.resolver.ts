import {
  ActivatedRouteSnapshot,
  UrlTree,
  RedirectFunction,
} from '@angular/router';

enum TargetEntityType {
  REQUEST = 'requests',
}

export const redirectDiscussionsToEntity: RedirectFunction = (
  redirectData: Pick<
    ActivatedRouteSnapshot,
    | 'routeConfig'
    | 'url'
    | 'params'
    | 'queryParams'
    | 'fragment'
    | 'data'
    | 'outlet'
    | 'title'
  >
): string | UrlTree => {
  const targetEntityType = redirectData.params['target_entity_type'];
  const targetEntityId = redirectData.params['target_entity_id'];
  const commentId = redirectData.queryParams['comment_id'];
  const path =
    TargetEntityType[
      targetEntityType?.toUpperCase() as keyof typeof TargetEntityType
    ];
  if (path) {
    return commentId
      ? `/${path}/${targetEntityId}?comment_id=${commentId}`
      : `/${path}/${targetEntityId}`;
  }

  return '/not-found';
};
