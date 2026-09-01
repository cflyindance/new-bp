const countDishNum = (ruleWithItem, crmType ) => {
    let num = 0;
    if (crmType === 1) {
        num = ruleWithItem.reduce((pre, cur) => {
            return pre + cur.items?.length;
        }, 0);
    }
    if (crmType === 2) {
        num = ruleWithItem.reduce((pre, cur) => {
            const count = cur.hasOwnProperty('extSkuMapping')
                ? cur.extSkuMapping.length
                : 1;
            return pre + count;
        }, 0);
    }
    if (num < 10) return num;

    return `${Math.floor(num / 10) * 10}+`;
};

export default countDishNum