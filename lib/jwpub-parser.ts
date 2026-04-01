import { JwpubParagraph, JwpubReference } from "@/types/jwpub";

export const jwpubParser = {
  parseChapterHtml(html: string): JwpubParagraph[] {
    if (typeof window === "undefined") return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const paragraphs: JwpubParagraph[] = [];

    // Select all top-level elements that usually contain text content
    const elements = Array.from(doc.body.children);
    let index = 0;

    for (const el of elements) {
      const type = this.getElementType(el);
      if (!type) continue;

      const text = el.textContent?.trim() || "";
      if (!text && !el.querySelector("img")) continue;

      const paragraph: JwpubParagraph = {
        index: index++,
        type,
        content: text,
        html: el.innerHTML,
        images: this.extractImages(el),
        references: this.extractReferences(el),
      };

      paragraphs.push(paragraph);
    }

    return paragraphs;
  },

  getElementType(el: Element): JwpubParagraph["type"] | null {
    const tag = el.tagName.toLowerCase();
    switch (tag) {
      case "p": return "p";
      case "h1": return "h1";
      case "h2": return "h2";
      case "h3": return "h3";
      case "li": return "li";
      case "blockquote": return "blockquote";
      case "figcaption":
      case "cite": return "caption";
      default:
        // Try to infer from class or nesting if tag is div
        if (tag === "div" && el.classList.contains("p")) return "p";
        return "p"; // Fallback to 'p' if it has text
    }
  },

  extractImages(el: Element): string[] {
    const images: string[] = [];
    const imgTags = Array.from(el.querySelectorAll("img"));
    for (const img of imgTags) {
      const src = img.getAttribute("src") || "";
      // JWPUB media links are usually jwpub-media://filename.jpg
      const match = src.match(/jwpub-media:\/\/([^\s"'<>]+)/);
      if (match) {
        images.push(match[1]);
      } else if (src && !src.startsWith("data:")) {
        // Fallback for simple filenames if already processed
        images.push(src.split("/").pop()!);
      }
    }
    return images;
  },

  extractReferences(el: Element): JwpubReference[] {
    const refs: JwpubReference[] = [];
    const linkTags = Array.from(el.querySelectorAll('a[href^="jwpub://b/"]'));
    for (const link of linkTags) {
      refs.push({
        label: link.textContent?.trim() || "Ref",
        url: link.getAttribute("href") || ""
      });
    }
    return refs;
  }
};
