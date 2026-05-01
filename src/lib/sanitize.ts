import DOMPurify from 'dompurify';

export function sanitizeHtmlForRender(input: string | null | undefined): string {
  if (!input) {
    return '';
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'a',
      'img',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });
}
