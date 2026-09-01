/* 自动替换POS安装包下当前应用物料, 请自行替换路径, 除windows环境下可能会替换失败 */

const fs = require('fs')
const path = require('path')

// 在POS安装包下查找路径
function findEmenuPath(dir, aimFolderName) {
  const items = fs.readdirSync(dir)
  for (let i = 0; i < items.length; i++) {
    const itemPath = path.join(dir, items[i])
    const stat = fs.statSync(itemPath)
    if (stat.isDirectory()) {
      if (path.basename(itemPath) === aimFolderName) {
        return itemPath
      }
      const aimPath = findEmenuPath(itemPath, aimFolderName)
      if (aimPath) {
        return aimPath
      }
    }
  }
  return null
}

const dirPath = findEmenuPath('C:\\Wisdomount', 'emenu')

// 删除pos emenu 下文件
function deleteFolderFile(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const filePath = path.join(folderPath, file)
      const fileStatus = fs.lstatSync(filePath)
      if (fileStatus.isDirectory()) {
        deleteFolderFile(filePath)
        fs.rmdirSync(filePath)
      } else {
        fs.unlinkSync(filePath)
      }
    })
  } else {
    console.log(`Path: ${folderPath} is not exist`)
  }
}

deleteFolderFile(dirPath)

// 把build文件夹复制到pos emenu
function copyFileToTargetDir(distDirPath, dirPath) {
  if (fs.existsSync(distDirPath)) {
    fs.readdirSync(distDirPath).forEach((file) => {
      const filePath = path.join(distDirPath, file)
      const targetFilePath = path.join(dirPath, file)
      const fileStatus = fs.lstatSync(filePath)
      if (fileStatus.isDirectory()) {
        if (!fs.existsSync(targetFilePath)) {
          fs.mkdirSync(targetFilePath)
        }
        copyFileToTargetDir(filePath, targetFilePath)
      } else {
        fs.copyFileSync(filePath, targetFilePath)
      }
    })
  }
}

const distDirPath = path.resolve(__dirname, './build')
copyFileToTargetDir(distDirPath, dirPath)
