const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');

const now = new Date();

const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
const day = String(now.getDate()).padStart(2, '0');

const time = `${year}.${month}.${day}`; //加上时间，防止到时候测试包和正式包对应不上
const versionFilePath = 'public/version.json';
const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));

// 运行构建命令并压缩
function runBuild(command, zipENV) {
  console.log('version', JSON.stringify(versionData));

  return new Promise(async (resolve, reject) => {
    try {
      const finalZipName = `K-V${versionData.version}_${time}_${zipENV}`;
      console.log(`开始运行 ${command}...`);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`运行 ${command} 时出错: ${error}`);
          reject(error);
          return;
        }
        console.log(stdout);
        console.error(stderr);

        // 确保打包目录存在
        if (!fs.existsSync('dist')) {
          console.log(`打包目录 ${'dist'} 不存在，正在创建...`);
          fs.mkdirSync('dist', { recursive: true });
        }

        // 压缩目录
        zipDirectory('dist', finalZipName).then(resolve).catch(reject);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 压缩目录到 zip 文件
function zipDirectory(sourceDir, zipName) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(`${zipName}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`${zipName}.zip 已创建，总计 ${archive.pointer()} 字节`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // 使用递归添加目录以确保目录结构完整
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// 主函数：按顺序执行任务
(async function main() {
  try {
    // 第一步：构建测试环境并压缩
    await runBuild('npm run build:test', 'QA');
    console.log('qa环境构建并压缩完成');
    //        dev环境
    await runBuild('npm run build:dev', 'DEV');
    console.log('dev环境构建并压缩完成');
  } catch (error) {
    console.error('脚本执行出错:', error);
    process.exitCode = 1;
  }
})();
