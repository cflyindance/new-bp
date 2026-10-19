import type {Catalog,MenuNode} from './center-catalog';
import type {Access} from './center-domain';

/** Display projection only: value must be the existing store-scoped effective resolver. */
export function effectiveMenuView(catalog:Catalog,value:(key:string)=>Access,requested:string):{tree:MenuNode[];page:string} {
  const filter=(nodes:MenuNode[]):MenuNode[]=>nodes.flatMap(node=>{
    if(node.key&&value(node.key)==='hidden')return [];
    const children=filter(node.children);
    if(node.children.length&&!children.length)return [];
    if(!node.key&&!children.length)return [];
    return [{...node,children}];
  });
  const tree=filter(catalog.tree),keys:string[]=[],pages:string[]=[];
  const collect=(nodes:MenuNode[]):void=>{for(const node of nodes){if(node.key){keys.push(node.key);if(catalog.resources.get(node.key)?.type==='page')pages.push(node.key);}collect(node.children);}};
  collect(tree);
  return {tree,page:keys.includes(requested)?requested:pages[0]??keys[0]??''};
}
