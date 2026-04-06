import { Note } from "@/schemas/noteSchema";
import { Tag } from "@/schemas/tagSchema";

export interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'tag';
  val: number; // Size/Importance
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'reference' | 'tagging';
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface MarkType {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TiptapNode {
  type?: string;
  content?: TiptapNode[];
  marks?: MarkType[];
  [key: string]: unknown;
}

/**
 * Recursively extracts all note-link and hashtag marks from Tiptap JSON content.
 */
function extractMarks(content: TiptapNode | TiptapNode[] | string | null | undefined, type: 'noteLink' | 'hashtag'): MarkType[] {
  if (!content || typeof content === 'string') return [];

  if (Array.isArray(content)) {
    let allMarks: MarkType[] = [];
    content.forEach((child) => {
      allMarks = allMarks.concat(extractMarks(child, type));
    });
    return allMarks;
  }

  let marks: MarkType[] = [];

  if (content.marks) {
    marks = marks.concat(content.marks.filter((m) => m.type === type));
  }

  if (content.content && Array.isArray(content.content)) {
    content.content.forEach((child) => {
      marks = marks.concat(extractMarks(child, type));
    });
  }

  return marks;
}

export function buildGraphData(notes: Note[], tags: Tag[]): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Add Tag nodes
  tags.forEach((tag) => {
    nodes.push({
      id: `tag-${tag.id}`,
      label: `#${tag.title}`,
      type: 'tag',
      val: 5,
      color: tag.color || '#10b981', // emerald-500 default
    });
  });

  // Add Note nodes and build links
  notes.forEach((note) => {
    nodes.push({
      id: note.id,
      label: note.title,
      type: 'note',
      val: 10,
    });

    // 1. Explicit tags from note metadata
    if (note.tagIds) {
      note.tagIds.forEach((tagId) => {
        links.push({
          source: note.id,
          target: `tag-${tagId}`,
          type: 'tagging',
        });
      });
    }

    // 2. Note links from content
    const noteLinks = extractMarks(note.content, 'noteLink');
    noteLinks.forEach((m) => {
      const attrs = m.attrs as { id?: string } | undefined;
      if (attrs?.id) {
        links.push({
          source: note.id,
          target: attrs.id,
          type: 'reference',
        });
      }
    });

    // 3. Hashtags from content
    const hashtags = extractMarks(note.content, 'hashtag');
    hashtags.forEach((m) => {
      const attrs = m.attrs as { id?: string } | undefined;
      if (attrs?.id) {
        links.push({
          source: note.id,
          target: `tag-${attrs.id}`,
          type: 'tagging',
        });
      }
    });
  });

  // Remove duplicate links (can happen if a tag is both explicit and in content)
  const uniqueLinks = links.filter((link, index, self) => 
    index === self.findIndex((l) => l.source === link.source && l.target === link.target)
  );

  return { nodes, links: uniqueLinks };
}
