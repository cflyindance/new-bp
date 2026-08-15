import { TreeSelect } from 'antd'

const TreeSelectDish = (props) => {
  const { value, onChange, treeData, isMultiple = true, ...rest } = props
  return (
    <TreeSelect
      onChange={(newValue) => onChange(newValue)}
      treeData={treeData}
      value={value}
      style={{ width: '100%' }}
      listHeight={660}
      allowClear
      showArrow
      treeCheckable={isMultiple}
      maxTagCount={10}
      treeDefaultExpandAll
      treeNodeFilterProp="title"
      multiple={isMultiple}
      {...rest}
    />
  )
}

export default TreeSelectDish
