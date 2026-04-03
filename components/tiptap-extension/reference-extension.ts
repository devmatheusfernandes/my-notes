import { Mark, mergeAttributes, InputRule, Editor, Range } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import suggestion, { SuggestionOptions } from '@tiptap/suggestion';
import { normalizeBookToken } from '@/data/constants/bible-abreviations';
import { jwpubReference } from '@/lib/jwpub-reference';
import { JwpubMetadata } from '@/schemas/jwpubSchema';

export interface ReferenceOptions {
  HTMLAttributes: Record<string, unknown>;
  onReferenceClick?: (reference: string, type: 'bible' | 'publication') => void;
  suggestion?: Partial<SuggestionOptions<JwpubMetadata>>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    reference: {
      /**
       * Set a reference mark
       */
      setReference: (attributes: { reference: string; type: 'bible' | 'publication' }) => ReturnType;
      /**
       * Unset a reference mark
       */
      unsetReference: () => ReturnType;
    };
  }
}

export const ReferenceExtension = Mark.create<ReferenceOptions>({
  name: 'reference',

  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'text-amber-500 cursor-pointer hover:underline reference-link font-medium',
      },
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: Editor, range: Range, props: JwpubMetadata }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(`${props.symbol} `)
            .run();
        },
      },
    };
  },

  addAttributes() {
    return {
      reference: {
        default: null,
        parseHTML: element => element.getAttribute('data-reference'),
        renderHTML: attributes => ({
          'data-reference': attributes.reference,
        }),
      },
      type: {
        default: null,
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => ({
          'data-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-reference]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setReference: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      unsetReference: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        // Matches @ followed by a Bible book and reference (e.g. @Ge 1:1)
        find: /@((?:[1-3]\s*)?[a-zA-ZçÇáÁéÉíÍóÓúÚâÂêÊôÔãÃõÕüÜ]+)\s+(\d+):(\d+)(?:-(\d+))?\s$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const bookPart = match[1];
          const isBible = !!normalizeBookToken(bookPart);

          if (isBible) {
            const start = range.from;
            const end = range.to;
            const referenceText = match[0].trim().substring(1); // Remove @ and trailing space

            // Re-insert the text without @ but keep the trailing space outside the mark
            tr.replaceWith(start, end, state.schema.text(referenceText + ' '));
            tr.addMark(start, start + referenceText.length, this.type.create({
              reference: referenceText,
              type: 'bible',
            }));
          }
        },
      }),
      new InputRule({
        // Matches Publication references (e.g. wp23 1:1, w21.05 p. 15, it-1 p. 250 par. 3, lmd lição 5)
        find: /(?:^|\s)([a-zA-Z0-9çÇáÁéÉíÍóÓúÚâÂêÊôÔãÃõÕüÜ.-]+\s+(?:[\w\d\s\.\/§\-çÇáÁéÉíÍóÓúÚâÂêÊôÔãÃõÕüÜ]{2,}\d))\s$/i,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const fullMatch = match[0];
          const referenceText = match[1].trim();
          
          // Verify if it's a valid publication reference
          const isPub = !!jwpubReference.parseReferenceString(referenceText);

          if (isPub) {
            const hasLeadingSpace = /^\s/.test(fullMatch);
            const start = range.from + (hasLeadingSpace ? 1 : 0);
            const end = range.to;

            // Re-insert the space at the end to keep it outside the mark
            tr.replaceWith(start, end, state.schema.text(referenceText + ' '));
            tr.addMark(start, start + referenceText.length, this.type.create({
              reference: referenceText,
              type: 'publication',
            }));
          }
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
      new Plugin({
        key: new PluginKey('reference-click-handler'),
        props: {
          handleClick: (view, pos) => {
            const { state } = view;
            const $pos = state.doc.resolve(pos);

            const marks = $pos.marks();
            const referenceMark = marks.find(m => m.type.name === this.name);

            if (referenceMark) {
              const { reference, type } = referenceMark.attrs;
              if (this.options.onReferenceClick) {
                this.options.onReferenceClick(reference, type);
                return true;
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});
