import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { difference } from 'es-toolkit';
import { Observable, map, of, shareReplay, tap } from 'rxjs';
import {
  ExistingFileMetadata,
  FileMetadata,
  UploadConfiguration,
} from '../../models/documents/fileModels';
import { Signature } from '../../models/sectionModels';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private apiService = inject(ApiService);
  private httpClient = inject(HttpClient);

  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Documents;
  }

  /** File Templates */

  public getAllFileTemplates() {
    return this.apiService.get<FileMetadata[]>(
      this.serviceConfiguration,
      `/templates/files`
    );
  }

  public getFileTemplateMetadata(templateId: string) {
    return this.apiService.get<FileMetadata>(
      this.serviceConfiguration,
      `/templates/files/${templateId}`
    );
  }

  public createFileTemplateMetadata(file: FileMetadata) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/templates/files`,
      file
    );
  }

  public updateFileTemplateMetadata(template: FileMetadata) {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/templates/files/${template.id}`,
      template
    );
  }

  public getFileTemplateUploadConfiguration(templateId: string) {
    return this.apiService.post<UploadConfiguration>(
      this.serviceConfiguration,
      `/templates/files/${templateId}/upload`,
      {}
    );
  }

  public downloadFileTemplate(templateId: string) {
    return this.apiService.get<{ url: string }>(
      this.serviceConfiguration,
      `/templates/files/${templateId}/download?redirect=false`
    );
  }

  public deleteFileTemplate(templateId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/templates/files/${templateId}`
    );
  }

  /** FILES */

  public fileMetadataExists(fileId: string, digest: string) {
    return this.apiService.head(
      this.serviceConfiguration,
      `/files/${fileId}?digest=${digest}`
    );
  }

  public getFileMetadata(
    fileId: string,
    digest: string
  ): Observable<ExistingFileMetadata> {
    return this.apiService.get<ExistingFileMetadata>(
      this.serviceConfiguration,
      `/files/${fileId}?digest=${digest}`
    );
  }

  public getFileMetadataBatch(
    input: {
      id: string;
      digest: string;
    }[]
  ): Observable<ExistingFileMetadata[]> {
    if (!input.length) {
      return of([]);
    }

    const target_files = encodeURIComponent(JSON.stringify(input));
    return this.apiService.get<ExistingFileMetadata[]>(
      this.serviceConfiguration,
      `/files/batch?target_files=${target_files}`
    );
  }

  public createFileMetadata(file: FileMetadata) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/files`,
      file
    );
  }

  public updateFileMetadata(file: FileMetadata, digest: string) {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/files/${file.id}?digest=${digest}`,
      file
    );
  }

  patchPdfMetadata(
    fileId: string,
    digest: string,
    pdfMetadata: Record<string, unknown>
  ) {
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/files/${fileId}?digest=${digest}`,
      {
        pdfMetadata,
      }
    );
  }

  public deleteFileMetadata(fileId: string, digest: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/files/${fileId}?digest=${digest}`
    );
  }

  public cloneTemplateToFile(templateId: string) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/templates/files/${templateId}/clone`,
      {}
    );
  }

  public cloneTemplateToDynamicForm(templateId: string) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/templates/forms/${templateId}/clone`,
      {}
    );
  }

  /**
   * @deprecated Use `batchCloneDocumentTemplates` instead
   */
  public batchCloneTemplateToFile(templateIds: string[]) {
    return this.apiService.post<
      Array<{
        digest: string;
        // The new fileId/documentId, result of cloning the template file
        id: string;
        // The original fileId/documentId, which was cloned
        originalId: string;
        originalName: null | string;
      }>
    >(this.serviceConfiguration, `/templates/files/clone/batch`, templateIds);
  }

  public batchCloneDocumentTemplates(templates: {
    files: Array<{ id: string }>;
    dynamicForms: Array<{ id: string }>;
  }): Observable<{
    success: {
      files: Array<{
        id: string;
        originalName: string;
        originalId: string;
        digest: string;
      }>;
      dynamicForms: Array<{
        id: string;
        originalId: string;
        digest: string;
      }>;
    };
    fail: {
      files: string[];
      dynamicForms: string[];
    };
  }> {
    return this.apiService
      .post<{
        files: Array<{
          id: string;
          originalName: string;
          originalId: string;
          digest: string;
        }>;
        dynamicForms: Array<{
          id: string;
          originalId: string;
          digest: string;
        }>;
      }>(this.serviceConfiguration, `/clone/batch`, templates)
      .pipe(
        map(response => {
          const requestedFiles = templates.files.map(file => file.id);
          const requestedDynamicForms = templates.dynamicForms.map(
            dynamicForm => dynamicForm.id
          );

          const success = response;
          const fail = {
            files: difference(
              requestedFiles,
              response.files.map(file => file.originalId)
            ),
            dynamicForms: difference(
              requestedDynamicForms,
              response.dynamicForms.map(file => file.originalId)
            ),
          };

          return { success, fail };
        })
      );
  }

  public getUploadConfiguration(fileId: string, digest: string) {
    return this.apiService.post<UploadConfiguration>(
      this.serviceConfiguration,
      `/files/${fileId}/upload?digest=${digest}`,
      {}
    );
  }

  public downloadFile(fileId: string, digest: string) {
    return this.apiService.get<{ url: string }>(
      this.serviceConfiguration,
      `/files/${fileId}/download?redirect=false&digest=${digest}`
    );
  }

  // TODO: Review file type. Currently inferred by usage
  public uploadFile<T extends { file: File }>(
    uploadConfiguration: UploadConfiguration,
    file: T
  ): Observable<HttpEvent<unknown>> {
    const formData = new FormData();

    for (const key of Object.keys(uploadConfiguration.fields)) {
      formData.append(key, uploadConfiguration.fields[key]);
    }
    formData.append('file', file.file);

    const req = new HttpRequest('POST', uploadConfiguration.url, formData, {
      reportProgress: true,
      responseType: 'json',
      transferCache: true,
    });

    return this.httpClient.request(req);
  }

  // TODO: Check if we can use HTTPBaseResponse here as the event type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getPercentageUploaded(event: any): number {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        return event.total ? Math.round((100 * event.loaded) / event.total) : 0;
      case HttpEventType.Sent:
        return 0;
      case HttpEventType.Response:
        return 100;
      default:
        return 0;
    }
  }

  // SIGNATURES

  public createSignature(signature: Signature) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/signatures`,
      signature
    );
  }

  public getSignature(signatureId: string, digest: string) {
    return this.apiService.get<Signature>(
      this.serviceConfiguration,
      `/signatures/${signatureId}?digest=${digest}`
    );
  }

  public createSignatureToken(): Observable<{
    id: string;
    accessToken: string;
  }> {
    return this.apiService.post<{
      id: string;
      accessToken: string;
    }>(this.serviceConfiguration, `/signatures/token`, null);
  }

  private _signatureCertificates$: Observable<{
    caCertificates: string[];
  }> | null = null;

  public getSignatureCertificates(): Observable<{
    caCertificates: string[];
  }> {
    if (!this._signatureCertificates$) {
      this._signatureCertificates$ = this.apiService
        .get<{
          caCertificates: string[];
        }>(this.serviceConfiguration, `/signatures/certificates`)
        .pipe(
          tap({
            error: () => {
              this._signatureCertificates$ = null;
            },
          }),
          shareReplay(1)
        );
    }
    return this._signatureCertificates$;
  }
}
