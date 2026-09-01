import { nanoid } from '@reduxjs/toolkit'

class GlobalRAFManager {
  _taskList = new Map()
  _requestAnimationFrameId = null

  addTask(task) {
    const taskSize = this._taskList.size
    const id = nanoid()
    this._taskList.set(id, task)
    if (taskSize === 0) {
      this._start()
    }

    return () => {
      this._removeTask(id)
    }
  }

  _removeTask(id) {
    this._taskList.delete(id)
    if (this._taskList.size === 0) {
      this._stop()
    }
  }

  _start() {
    const loop = (time) => {
      this._taskList.forEach((cb) => {
        cb(time)
      })
      this._requestAnimationFrameId = requestAnimationFrame(loop)
    }
    this._requestAnimationFrameId = requestAnimationFrame(loop)
  }

  _stop() {
    cancelAnimationFrame(this._requestAnimationFrameId)
    this._requestAnimationFrameId = null
  }
}

export default new GlobalRAFManager()
