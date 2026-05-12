import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'SafeHtml',
  standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);


  transform(html: string | undefined) {
    if (!html) {
      return '';
    }

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
