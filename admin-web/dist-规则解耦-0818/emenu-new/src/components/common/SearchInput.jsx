import { memo, useRef } from 'react'
import { InputBase } from '@material-ui/core'

function SearchInput(props) {
  const { onInput } = props
  const lockRef = useRef(false)

  // 进入组合输入状态
  const handleStart = () => {
    lockRef.current = true
  }

  const handleInput = (event) => {
    // 处于组合输入状态，不予处理
    if (lockRef.current) return

    // 非组合输入状态，触发 onInput
    onInput(event)
  }

  // 选字结束，触发 onInput
  const handleEnd = (event) => {
    lockRef.current = false
    onInput(event)
  }

  return (
    <InputBase
      {...props}
      onCompositionStart={handleStart}
      onCompositionEnd={handleEnd}
      onInput={handleInput}
    />
  )
}

export default memo(SearchInput)
