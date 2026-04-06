import React, {
  forwardRef,
  useImperativeHandle,
  useState,
} from 'react'
import { motion } from 'framer-motion'
import { FileText, Tag, Search } from 'lucide-react'

export interface SuggestionItem {
  id: string
  label: string
  type?: string
}

export interface SuggestionListProps {
  items: SuggestionItem[]
  command: (item: SuggestionItem) => void
}

export interface SuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const SuggestionList = forwardRef<SuggestionListRef, SuggestionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command(item)
    }
  }

  const upHandler = () => {
    setSelectedIndex(((selectedIndex + props.items.length - 1) % props.items.length))
  }

  const downHandler = () => {
    setSelectedIndex(((selectedIndex + 1) % props.items.length))
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  const [prevItems, setPrevItems] = useState(props.items)

  if (props.items !== prevItems) {
    setSelectedIndex(0)
    setPrevItems(props.items)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden min-w-[280px] max-h-[320px] flex flex-col z-[1000]"
    >
      <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50/50 dark:bg-zinc-800/30">
        <Search className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Sugestões
        </span>
      </div>

      <div className="overflow-y-auto p-1 py-1.5 no-scrollbar">
        {props.items.length > 0 ? (
          props.items.map((item, index) => (
            <button
              key={index}
              onClick={() => selectItem(index)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all group ${index === selectedIndex
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${index === selectedIndex
                ? 'bg-white/20'
                : 'bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
                }`}>
                {item.type === 'tag' ? (
                   <Tag className={`w-4 h-4 ${index === selectedIndex ? 'text-white' : 'text-zinc-500'}`} />
                ) : (
                   <FileText className={`w-4 h-4 ${index === selectedIndex ? 'text-white' : 'text-zinc-500'}`} />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate leading-tight">
                  {item.label}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="p-4 text-center">
            <p className="text-xs text-zinc-500">Nenhum resultado encontrado.</p>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[9px] font-bold bg-white dark:bg-zinc-900 text-zinc-400">
            &uarr;&arr;
          </kbd>
          <span className="text-[9px] text-zinc-400 font-medium tracking-wide">NAVEGAR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[9px] font-bold bg-white dark:bg-zinc-900 text-zinc-400">
            ENTER
          </kbd>
          <span className="text-[9px] text-zinc-400 font-medium tracking-wide">SELECIONAR</span>
        </div>
      </div>
    </motion.div>
  )
})

SuggestionList.displayName = 'SuggestionList'
