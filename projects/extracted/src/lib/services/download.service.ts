import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  private http = inject(HttpClient);


  // Allow to download a file specifying the file name that will be used to save the file
  // Without it, most of the time the file will be saved with the name of the endpoint and w/o extension
  downloadFile(fileUrl: string, fileName: string): void {
    this.downloadFileWithSubscription(fileUrl, fileName).subscribe();
  }

  downloadFileWithSubscription(fileUrl: string, fileName: string) {
    return this.http.get(fileUrl, { responseType: 'blob' }).pipe(
      tap((blob: Blob) => {
        this.downloadBlob(blob, fileName);
      })
    );
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.setAttribute('style', 'display: none');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
