/** Merchant role detail modes; listing and creation routes are deliberately excluded. */
export function rolePageRoute(path:string):{id:string;readonly:boolean}|undefined {
  const match=/^\/permissions\/roles\/(view|edit)\/([^/]+)$/.exec(path);
  if(!match)return undefined;
  try{return {id:decodeURIComponent(match[2]),readonly:match[1]==='view'};}catch{return undefined;}
}
