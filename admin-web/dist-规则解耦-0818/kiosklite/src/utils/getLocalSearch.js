export default function getLocalSearch (href){
    //http://localhost:3000/receipt?id=3a6f61ca-508c-48d2-8a9a-cb4619568d73&page=1&taskContract=HADTASK
    let searchJson = {}
    if (href.indexOf('?') > -1) {
        let search = href.split("?")[1]
        if(search&&search.length){
            search.split("&").map(s=>{
                let sArr = s.split("=")
                searchJson[sArr[0]] = sArr[1]
            })
        }
    } else {
        searchJson = {

        }
    }
    return searchJson
}