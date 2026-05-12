import { Provider } from '@angular/core';
import { FieldsBridgeService } from './services/fields-bridge.service';
import { FieldsService } from './services/fields.service';

/**
 * Scoped providers for the v2 PDF field framework.
 *
 * MUST be provided in the same scope that mounts the `<pdf-viewer>` (the
 * builder route, the filler route, a story decorator). NOT
 * `providedIn: 'root'` — multiple `<pdf-viewer>` instances on the same page
 * each get their own bridge + service so id caches and `setCustomRenderers`
 * registrations don't cross-contaminate.
 *
 * Usage:
 * ```ts
 * @Component({
 *   providers: [provideFieldFramework()],
 *   ...
 * })
 * export class MyPdfBuilderComponent { ... }
 * ```
 */
export function provideFieldFramework(): Provider[] {
  return [FieldsBridgeService, FieldsService];
}
