/**
 * Transforms JWPub DocId links into Watchtower Online Library (WOL) links.
 * Pattern: jwpub://p/T:1200000309/5-5 -> https://wol.jw.org/pt/wol/d/r5/lp-t/1200000309#h=5-5
 * Support for ranges: 1200000309/5:7 -> #h=5-7, 1200000309/5:7-9 -> #h=5-9
 * 
 * @param html The HTML content string to process.
 * @returns The HTML with transformed docid links.
 */
export function transformDocIdLinks(html: string): string {
  if (!html) return html;

  // Capture docId and optional reference part
  return html.replace(/href=["']jwpub:\/\/p\/T:(\d+)(?:\/([^"']+))?["']/g, (match, docId, ref) => {
    let url = `https://wol.jw.org/pt/wol/d/r5/lp-t/${docId}`;
    
    if (ref) {
      // Find all numbers in the reference string.
      const numbers = ref.match(/\d+/g);
      
      if (numbers && numbers.length > 0) {
        if (numbers.length === 1) {
          url += `#h=${numbers[0]}`;
        } else {
          // As requested by user: 5:7 -> 5-7, 5:7-9 -> 5-9
          // Range is FirstNumber-LastNumber
          const start = numbers[0];
          const end = numbers[numbers.length - 1];
          url += `#h=${start}-${end}`;
        }
      }
    }

    return `href="${url}" target="_blank" rel="noopener noreferrer"`;
  });
}

/**
 * Generates a WOL URL for a given publication symbol.
 * 
 * @param symbol The publication symbol (e.g. 'w23', 'nwt')
 * @param chapter Optional chapter number
 * @param paragraph Optional paragraph number
 * @returns The WOL URL for the publication.
 */
export function getWolUrlForSymbol(symbol: string, chapter?: number, paragraph?: number): string {
  let url = `https://wol.jw.org/pt/wol/pub/r5/lp-t/${symbol}`;
  
  if (chapter !== undefined && paragraph !== undefined) {
    url += `#h=${chapter}-${paragraph}`;
  } else if (paragraph !== undefined) {
    url += `#h=${paragraph}`;
  } else if (chapter !== undefined && chapter > 0) {
    url += `#h=${chapter}`;
  }
  
  return url;
}
