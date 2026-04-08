export interface GenealogyNode {
  id: string;
  label: string;
  color?: string;
  tags?: string[];
  notes?: string;
  refs?: string;
  [key: string]: unknown;
}

export interface GenealogyLink {
  source: string;
  target: string;
  type: string;
}

export interface TreeNode {
  name: string;
  attributes?: Record<string, string | number | boolean>;
  children?: TreeNode[];
}

/**
 * Converte a lista flat de nós e links numa estrutura hierárquica para o react-d3-tree.
 * Ignora links do tipo "spouse" para evitar ciclos e recursividade infinita.
 */
export function buildHierarchy(
  nodes: GenealogyNode[],
  links: GenealogyLink[],
  rootId: string = "Adao"
): TreeNode | null {
  const nodeMap = new Map<string, GenealogyNode>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // Agrupar filhos por pai (apenas links de parentesco vertical)
  const childrenMap = new Map<string, string[]>();
  const spousesMap = new Map<string, string[]>();

  links.forEach((link) => {
    // Garantir que trabalhamos com IDs puros do JSON original (strings)
    // Se vierem como objetos de mutação anterior, extraímos o id
    const sourceId = String(typeof link.source === "string" ? link.source : (link.source as { id?: string }).id || "");
    const targetId = String(typeof link.target === "string" ? link.target : (link.target as { id?: string }).id || "");

    if (!sourceId || !targetId) return;

    if (
      link.type === "parent" ||
      link.type === "lineage" ||
      link.type === "adoptive_parent" ||
      link.type === "legal_parent"
    ) {
      if (!childrenMap.has(sourceId)) {
        childrenMap.set(sourceId, []);
      }
      childrenMap.get(sourceId)!.push(targetId);
    } else if (link.type === "spouse" || link.type === "father_in_law") {
      // Agrupa cônjuges e sogros como atributos laterais na árvore
      if (!spousesMap.has(sourceId)) spousesMap.set(sourceId, []);
      spousesMap.get(sourceId)!.push(targetId);

      if (!spousesMap.has(targetId)) spousesMap.set(targetId, []);
      spousesMap.get(targetId)!.push(sourceId);
    }
  });

  const visited = new Set<string>();

  /**
   * Função recursiva para construir a árvore.
   * Se o nó raiz não for encontrado, tenta procurar pelo ID exato.
   */
  function traverse(id: string): TreeNode | null {
    const node = nodeMap.get(id);
    if (!node || visited.has(id)) return null;

    visited.add(id);

    const spouses = spousesMap.get(id) || [];
    const spouseNames = spouses
      .map((sId) => nodeMap.get(sId)?.label)
      .filter(Boolean)
      .join(", ");

    const treeNode: TreeNode = {
      name: node.label,
      attributes: {
        id: node.id,
        color: node.color || "#A9A9A9",
        tags: node.tags?.join(", ") || "",
        spouses: spouseNames,
        notes: node.notes || "",
      },
    };

    const childIds = childrenMap.get(id) || [];
    const children = childIds
      .map((childId) => traverse(childId))
      .filter((child): child is TreeNode => child !== null);

    if (children.length > 0) {
      treeNode.children = children;
    }

    return treeNode;
  }

  return traverse(rootId);
}
