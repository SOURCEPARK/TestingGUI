import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

/**
 * ✅ Pipe zur Umwandlung von Markdown-Texten in sicheres HTML.
 * Nutzt die `marked`-Library zur Umwandlung und Angulars `DomSanitizer`,
 * um potenziell gefährliche HTML-Inhalte zu entschärfen.
 */
@Pipe({
  name: 'markdown',
  standalone: true, // Ermöglicht die direkte Nutzung ohne Modulimport
})
export class MarkdownPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  /**
   * Führt die Umwandlung durch.
   * @param text Ein Markdown-Text oder null/undefined
   * @returns HTML-Output, der mit DomSanitizer als sicher eingestuft wurde
   */
  transform(text: string | null | undefined): SafeHtml {
    if (!text) return ''; // Leerer String → kein HTML rendern

    // 📝 Mit `marked` in HTML umwandeln
    const html = marked.parse(text, { breaks: true }) as string;

    // 🛡️ Sicherheit: Angulars Sicherheitsmechanismus würde HTML sonst blockieren
    // Daher markieren wir den HTML-String explizit als "sicher"
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
