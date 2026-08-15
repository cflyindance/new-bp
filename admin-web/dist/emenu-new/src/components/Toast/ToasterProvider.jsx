import { Toaster } from 'react-hot-toast'

const ToasterProvider = () => {
  return (
    <Toaster
      containerStyle={{}}
      toastOptions={{
        duration: 3000,
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          padding: '16px',
        },
      }}
    />
  )
}

export default ToasterProvider
