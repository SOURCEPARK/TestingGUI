import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(text: string | null | undefined): SafeHtml {
    if (!text) return '';
    const html = marked.parse(text, { breaks: true }) as string; // 👈 cast
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
