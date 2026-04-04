import { JwpubParagraph, JwpubReference } from "@/schemas/jwpubSchema";

/**
 * Parses the HTML content of a JWPUB file chapter into a list of paragraphs.
 * @param html The HTML content to parse.
 * @returns A list of paragraphs.
 */
export const jwpubParser = {
  parseChapterHtml(html: string): JwpubParagraph[] {
    if (typeof window === "undefined") return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const paragraphs: JwpubParagraph[] = [];
    
    let currentIndex = 0;
    let currentPage: number | undefined = undefined;
    let currentSectionTitle: string | undefined = undefined;

    const addParagraph = (el: Element, type: JwpubParagraph["type"], contentOverride?: string, htmlOverride?: string) => {
      const pNumSpan = el.querySelector(".parNum");
      const paragraphNumber = pNumSpan ? parseInt(pNumSpan.getAttribute("data-pnum") || "", 10) : undefined;
      
      const content = contentOverride ?? el.textContent?.trim() ?? "";
      if (!content && !el.querySelector("img") && !htmlOverride?.includes("<img")) return;

      // Preserve alignment classes (east/west -> jw-align-right/left)
      const classList = Array.from(el.classList);
      const isEast = classList.some(c => c.includes('east') || c === 'right');
      const isWest = classList.some(c => c.includes('west') || c === 'left');

      if (isEast) el.classList.add('jw-align-right');
      if (isWest) el.classList.add('jw-align-left');

      // If we have a fragment (split paragraph), we should extract references/images from that fragment only
      let fragmentEl = el;
      if (htmlOverride) {
        fragmentEl = document.createElement("div");
        fragmentEl.innerHTML = htmlOverride;
      }

      const index = currentIndex++;
      const id = el.id || el.getAttribute("data-pid") || `p${index}`;
      
      // Ensure the element has a data-pid for UI referencing if needed
      if (!el.hasAttribute('data-pid')) el.setAttribute('data-pid', id);

      paragraphs.push({
        id,
        index,
        type,
        content,
        html: htmlOverride ?? el.innerHTML,
        page: currentPage,
        paragraphNumber: !isNaN(paragraphNumber as number) ? paragraphNumber : undefined,
        sectionTitle: currentSectionTitle,
        images: this.extractImages(fragmentEl),
        references: this.extractReferences(fragmentEl),
      });
    };

    const walk = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();

        // Track Page Number
        if (el.classList.contains("pageNum")) {
          const pageNo = parseInt(el.getAttribute("data-no") || "", 10);
          if (!isNaN(pageNo)) currentPage = pageNo;
        }

        // Track Section/Header
        if (["h1", "h2", "h3"].includes(tagName)) {
          currentSectionTitle = el.textContent?.trim() || currentSectionTitle;
        }

        const type = this.getElementType(el);
        if (type && !el.classList.contains("pageNum")) {
          // Check for mid-paragraph page breaks
          const internalPageNums = Array.from(el.querySelectorAll(".pageNum"));
          
          if (internalPageNums.length === 0) {
            addParagraph(el, type);
          } else {
            // Split paragraph by page breaks
            let currentFragmentHtml = "";
            let currentFragmentText = "";
            
            for (const child of Array.from(el.childNodes)) {
              if (child.nodeType === Node.ELEMENT_NODE && (child as Element).classList.contains("pageNum")) {
                // Add current fragment before updating page
                if (currentFragmentText.trim() || el.querySelector("img")) {
                  addParagraph(el, type, currentFragmentText.trim(), currentFragmentHtml);
                }
                
                // Update page
                const pageNo = parseInt((child as Element).getAttribute("data-no") || "", 10);
                if (!isNaN(pageNo)) currentPage = pageNo;
                
                // Reset fragment
                currentFragmentHtml = "";
                currentFragmentText = "";
              } else {
                currentFragmentHtml += (child.nodeType === Node.ELEMENT_NODE ? (child as Element).outerHTML : child.textContent);
                currentFragmentText += child.textContent || "";
              }
            }
            
            // Add final fragment
            if (currentFragmentText.trim() || el.querySelector("img")) {
              addParagraph(el, type, currentFragmentText.trim(), currentFragmentHtml);
            }
          }
          return; // Prevent recursing into content we've already handled
        }

        // Recurse into containers (div.section, div.pGroup, etc.)
        for (const child of Array.from(el.childNodes)) {
          walk(child);
        }
      }
    };

    walk(doc.body);
    return paragraphs;
  },

  getElementType(el: Element): JwpubParagraph["type"] | null {
    const tag = el.tagName.toLowerCase();
    
    // Explicit exclusions to avoid container divs being treated as paragraphs
    if (el.classList.contains("section") || el.classList.contains("pGroup") || el.classList.contains("bodyTxt")) {
      return null;
    }

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
        if (tag === "div" && (el.classList.contains("p") || el.classList.contains("sb") || el.classList.contains("sa"))) {
          return "p";
        }
        return null;
    }
  },

  extractImages(el: Element): string[] {
    const images: string[] = [];
    const imgTags = Array.from(el.querySelectorAll("img"));
    for (const img of imgTags) {
      const src = img.getAttribute("src") || "";
      const match = src.match(/jwpub-media:\/\/([^\s"'<>]+)/);
      if (match) {
        images.push(match[1]);
      } else if (src && !src.startsWith("data:")) {
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
