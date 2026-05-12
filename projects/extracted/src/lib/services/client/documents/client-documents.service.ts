import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import type { ExistingFileMetadata } from '../../../models/documents/fileModels';

import { DocumentService } from '../../documents/document.service';

@Injectable({
  providedIn: 'root',
})
export class ClientDocumentsService {
  readonly documents = signal<ExistingFileMetadata[]>([]);
  readonly documentLoaded = signal<boolean>(false);

  // DEPENDENCIES
  private documentService = inject(DocumentService);

  fetchDocument(
    fileId: string | undefined,
    digest: string | undefined,
    options?: { forceReload?: boolean }
  ): Observable<ExistingFileMetadata | undefined> {
    const { forceReload = false } = options ?? {};
    this.documentLoaded.set(false);

    if (!fileId || !digest) {
      this.documentLoaded.set(true);
      return of(undefined);
    }

    const document = this.documents().find(
      document => document.id === fileId && document.digest === digest
    );

    if (document && !forceReload) {
      this.documentLoaded.set(true);
      return of(document);
    } else {
      return this.documentService.getFileMetadata(fileId, digest).pipe(
        tap((response: ExistingFileMetadata) => {
          // Remove any cached versions of this file with different digests
          this.documents.update(docs => docs.filter(doc => doc.id !== fileId));
          this.documents.set([...this.documents(), response]);
          this.documentLoaded.set(true);
        })
      );
    }
  }
}
