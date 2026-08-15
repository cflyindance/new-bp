import { createContext, useContext } from 'react'

const SwiperContext = createContext(null)

const SwiperProvider = (props) => {
  return (
    <SwiperContext.Provider value={props.swiper}>
      {props.children}
    </SwiperContext.Provider>
  )
}

export default SwiperProvider

export const useSwiper = () => {
  return useContext(SwiperContext)
}
