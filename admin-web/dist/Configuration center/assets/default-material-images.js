(function () {
  var STORAGE_IMAGES = 'material_images';
  var DEFAULT_MATERIAL_IMAGES = [
  {
    "id": "m-demo-001",
    "name": "圣诞节",
    "category": "屏保素材",
    "tagColor": "blue",
    "url": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%20viewBox%3D%220%200%20800%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230f3d2e%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%231a5c40%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22680%22%20cy%3D%22120%22%20r%3D%2290%22%20fill%3D%22%23f5d547%22%20opacity%3D%220.18%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%22500%22%20r%3D%22110%22%20fill%3D%22%23f5d547%22%20opacity%3D%220.12%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22180%22%20height%3D%228%22%20rx%3D%224%22%20fill%3D%22%23f5d547%22%20opacity%3D%220.25%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2252%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22700%22%3E%E5%9C%A3%E8%AF%9E%E8%8A%82%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffffcc%22%20font-size%3D%2226%22%20font-family%3D%22system-ui%2Csans-serif%22%3EMerry%20Christmas%3C%2Ftext%3E%3C%2Fsvg%3E"
  },
  {
    "id": "m-demo-002",
    "name": "中秋节",
    "category": "广告素材",
    "tagColor": "red",
    "url": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%20viewBox%3D%220%200%20800%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%237c2d12%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23c2410c%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22680%22%20cy%3D%22120%22%20r%3D%2290%22%20fill%3D%22%23fde68a%22%20opacity%3D%220.18%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%22500%22%20r%3D%22110%22%20fill%3D%22%23fde68a%22%20opacity%3D%220.12%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22180%22%20height%3D%228%22%20rx%3D%224%22%20fill%3D%22%23fde68a%22%20opacity%3D%220.25%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2252%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22700%22%3E%E4%B8%AD%E7%A7%8B%E8%8A%82%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffffcc%22%20font-size%3D%2226%22%20font-family%3D%22system-ui%2Csans-serif%22%3E%E6%9C%88%E5%9C%86%E4%BA%BA%E5%9B%A2%E5%9C%86%3C%2Ftext%3E%3C%2Fsvg%3E"
  },
  {
    "id": "m-demo-003",
    "name": "新年",
    "category": "屏保素材",
    "tagColor": "blue",
    "url": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%20viewBox%3D%220%200%20800%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23991b1b%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23dc2626%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22680%22%20cy%3D%22120%22%20r%3D%2290%22%20fill%3D%22%23fcd34d%22%20opacity%3D%220.18%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%22500%22%20r%3D%22110%22%20fill%3D%22%23fcd34d%22%20opacity%3D%220.12%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22180%22%20height%3D%228%22%20rx%3D%224%22%20fill%3D%22%23fcd34d%22%20opacity%3D%220.25%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2252%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22700%22%3E%E6%96%B0%E5%B9%B4%E5%BF%AB%E4%B9%90%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffffcc%22%20font-size%3D%2226%22%20font-family%3D%22system-ui%2Csans-serif%22%3EHappy%20New%20Year%3C%2Ftext%3E%3C%2Fsvg%3E"
  },
  {
    "id": "m-demo-004",
    "name": "端午节",
    "category": "广告素材",
    "tagColor": "red",
    "url": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%20viewBox%3D%220%200%20800%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2314532d%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23166534%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22680%22%20cy%3D%22120%22%20r%3D%2290%22%20fill%3D%22%2386efac%22%20opacity%3D%220.18%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%22500%22%20r%3D%22110%22%20fill%3D%22%2386efac%22%20opacity%3D%220.12%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22180%22%20height%3D%228%22%20rx%3D%224%22%20fill%3D%22%2386efac%22%20opacity%3D%220.25%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2252%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22700%22%3E%E7%AB%AF%E5%8D%88%E8%8A%82%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffffcc%22%20font-size%3D%2226%22%20font-family%3D%22system-ui%2Csans-serif%22%3E%E7%B2%BD%E9%A6%99%E4%BC%A0%E6%83%85%3C%2Ftext%3E%3C%2Fsvg%3E"
  },
  {
    "id": "m-demo-005",
    "name": "春季特惠",
    "category": "广告素材",
    "tagColor": "red",
    "url": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%20viewBox%3D%220%200%20800%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23be185d%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23db2777%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22680%22%20cy%3D%22120%22%20r%3D%2290%22%20fill%3D%22%23fbcfe8%22%20opacity%3D%220.18%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%22500%22%20r%3D%22110%22%20fill%3D%22%23fbcfe8%22%20opacity%3D%220.12%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22180%22%20height%3D%228%22%20rx%3D%224%22%20fill%3D%22%23fbcfe8%22%20opacity%3D%220.25%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2252%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22700%22%3E%E6%98%A5%E5%AD%A3%E7%89%B9%E6%83%A0%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffffcc%22%20font-size%3D%2226%22%20font-family%3D%22system-ui%2Csans-serif%22%3E%E9%99%90%E6%97%B6%208%20%E6%8A%98%E8%B5%B7%3C%2Ftext%3E%3C%2Fsvg%3E"
  },
  {
    "id": "m-demo-006",
    "name": "招牌美食",
    "category": "其他",
    "tagColor": "green",
    "url": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%20viewBox%3D%220%200%20800%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2392400e%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23b45309%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22680%22%20cy%3D%22120%22%20r%3D%2290%22%20fill%3D%22%23fde68a%22%20opacity%3D%220.18%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%22500%22%20r%3D%22110%22%20fill%3D%22%23fde68a%22%20opacity%3D%220.12%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22180%22%20height%3D%228%22%20rx%3D%224%22%20fill%3D%22%23fde68a%22%20opacity%3D%220.25%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2252%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22700%22%3E%E6%8B%9B%E7%89%8C%E7%BE%8E%E9%A3%9F%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffffcc%22%20font-size%3D%2226%22%20font-family%3D%22system-ui%2Csans-serif%22%3E%E5%BA%97%E9%95%BF%E6%8E%A8%E8%8D%90%3C%2Ftext%3E%3C%2Fsvg%3E"
  },
  {
    "id": "m-demo-007",
    "name": "欢迎光临",
    "category": "屏保素材",
    "tagColor": "blue",
    "url": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%20viewBox%3D%220%200%20800%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%231e3a8a%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%232563eb%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22680%22%20cy%3D%22120%22%20r%3D%2290%22%20fill%3D%22%2393c5fd%22%20opacity%3D%220.18%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%22500%22%20r%3D%22110%22%20fill%3D%22%2393c5fd%22%20opacity%3D%220.12%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22180%22%20height%3D%228%22%20rx%3D%224%22%20fill%3D%22%2393c5fd%22%20opacity%3D%220.25%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2252%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22700%22%3E%E6%AC%A2%E8%BF%8E%E5%85%89%E4%B8%B4%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffffcc%22%20font-size%3D%2226%22%20font-family%3D%22system-ui%2Csans-serif%22%3EWelcome%3C%2Ftext%3E%3C%2Fsvg%3E"
  },
  {
    "id": "m-demo-008",
    "name": "会员专享",
    "category": "广告素材",
    "tagColor": "red",
    "url": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%20viewBox%3D%220%200%20800%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23581c87%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%237c3aed%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22680%22%20cy%3D%22120%22%20r%3D%2290%22%20fill%3D%22%23ddd6fe%22%20opacity%3D%220.18%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%22500%22%20r%3D%22110%22%20fill%3D%22%23ddd6fe%22%20opacity%3D%220.12%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22180%22%20height%3D%228%22%20rx%3D%224%22%20fill%3D%22%23ddd6fe%22%20opacity%3D%220.25%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2252%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22700%22%3E%E4%BC%9A%E5%91%98%E4%B8%93%E4%BA%AB%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffffcc%22%20font-size%3D%2226%22%20font-family%3D%22system-ui%2Csans-serif%22%3E%E7%A7%AF%E5%88%86%E7%BF%BB%E5%80%8D%3C%2Ftext%3E%3C%2Fsvg%3E"
  },
  {
    "id": "m-demo-009",
    "name": "限时促销",
    "category": "其他",
    "tagColor": "green",
    "url": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%20viewBox%3D%220%200%20800%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23b45309%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23ea580c%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22680%22%20cy%3D%22120%22%20r%3D%2290%22%20fill%3D%22%23ffedd5%22%20opacity%3D%220.18%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%22500%22%20r%3D%22110%22%20fill%3D%22%23ffedd5%22%20opacity%3D%220.12%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22180%22%20height%3D%228%22%20rx%3D%224%22%20fill%3D%22%23ffedd5%22%20opacity%3D%220.25%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2252%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22700%22%3E%E9%99%90%E6%97%B6%E4%BF%83%E9%94%80%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffffcc%22%20font-size%3D%2226%22%20font-family%3D%22system-ui%2Csans-serif%22%3E%E4%BB%8A%E6%97%A5%E7%89%B9%E4%BB%B7%3C%2Ftext%3E%3C%2Fsvg%3E"
  },
  {
    "id": "m-demo-010",
    "name": "秋日暖饮",
    "category": "屏保素材",
    "tagColor": "blue",
    "url": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22600%22%20viewBox%3D%220%200%20800%20600%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2378350f%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23a16207%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22680%22%20cy%3D%22120%22%20r%3D%2290%22%20fill%3D%22%23fef3c7%22%20opacity%3D%220.18%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%22500%22%20r%3D%22110%22%20fill%3D%22%23fef3c7%22%20opacity%3D%220.12%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%2260%22%20width%3D%22180%22%20height%3D%228%22%20rx%3D%224%22%20fill%3D%22%23fef3c7%22%20opacity%3D%220.25%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20text-anchor%3D%22middle%22%20fill%3D%22%23fff%22%20font-size%3D%2252%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22700%22%3E%E7%A7%8B%E6%97%A5%E6%9A%96%E9%A5%AE%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffffcc%22%20font-size%3D%2226%22%20font-family%3D%22system-ui%2Csans-serif%22%3E%E5%AD%A3%E8%8A%82%E9%99%90%E5%AE%9A%3C%2Ftext%3E%3C%2Fsvg%3E"
  }
];

  function readRawImages() {
    try {
      var saved = localStorage.getItem(STORAGE_IMAGES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function ensureDefaultMaterialImages() {
    var images = readRawImages();
    if (!Array.isArray(images) || images.length === 0) {
      localStorage.setItem(STORAGE_IMAGES, JSON.stringify(DEFAULT_MATERIAL_IMAGES));
      return;
    }
    var hasValidUrl = images.some(function (img) { return img && img.url; });
    if (!hasValidUrl) {
      localStorage.setItem(STORAGE_IMAGES, JSON.stringify(DEFAULT_MATERIAL_IMAGES));
    }
  }

  window.ensureDefaultMaterialImages = ensureDefaultMaterialImages;
  window.DEFAULT_MATERIAL_IMAGES = DEFAULT_MATERIAL_IMAGES;
})();
