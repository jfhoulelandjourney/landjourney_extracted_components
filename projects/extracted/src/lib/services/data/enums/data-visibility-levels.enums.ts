/**
 * Specifies the visibility level of data.
 *
 * - Public: All users can access the data.
 * - Private: Only the user and granted users (authorized representatives)
 *      can access the data.
 * - Hidden: Only the user can access the data.
 */
export enum DataVisibilityLevels {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  HIDDEN = 'HIDDEN',
}
