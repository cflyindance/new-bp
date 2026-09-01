import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import reducer from './index'

const middleware = [thunk]

const createStoreWithMiddleware = compose(
  applyMiddleware(...middleware),
  window.devToolsExtension ? window.devToolsExtension() : (f) => f
)(createStore)

const store = createStoreWithMiddleware(reducer)

export default store
