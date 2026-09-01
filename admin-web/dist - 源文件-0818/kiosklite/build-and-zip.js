const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');

function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`; //加上时间，防止到时候测试包和正式包对应不上
}

// 获取当前 Git 分支名称
function getCurrentBranch() {
  return new Promise((resolve, reject) => {
    exec('git rev-parse --abbrev-ref HEAD', (error, stdout, stderr) => {
      if (error) {
        console.error(`获取分支名称时出错: ${error}`);
        reject(error);
        return;
      }
      const fullBranchName = stdout.trim();
      const branchName = fullBranchName.includes('/')
        ? fullBranchName.split('/').pop() // 取"/"后面的内容
        : fullBranchName;
      console.log(`当前分支名称: ${branchName}`);
      resolve(branchName);
    });
  });
}
// 更新 version.json 文件中的版本信息
function updateVersionFile(branchName) {
  const versionFilePath = 'public/version.json';

  try {
    const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));
    versionData.version = branchName; // 修改版本号为当前分支名称
    fs.writeFileSync(
      versionFilePath,
      JSON.stringify(versionData, null, 2),
      'utf-8'
    );
    console.log(`版本信息已更新为当前分支号: ${branchName}`);
  } catch (error) {
    console.error(`更新版本出错: ${error}`);
    throw error;
  }
}
// 运行构建命令并压缩
function runBuild(command, outputDir, zipENV) {
  return new Promise(async (resolve, reject) => {
    try {
      const branchName = await getCurrentBranch();
      updateVersionFile(branchName); // 更新 public/version.json文件内的version版本
      const finalZipName = `K-V${branchName}_${getCurrentDate()}_${zipENV}`;
      // 把当前的node环境切换到18
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
        if (!fs.existsSync(outputDir)) {
          console.log(`打包目录 ${outputDir} 不存在，正在创建...`);
          fs.mkdirSync(outputDir, { recursive: true });
        }
        // 压缩目录
        zipDirectory(outputDir, finalZipName).then(resolve).catch(reject);
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
    await runBuild('npm run build:test', 'dist', 'QA');
    console.log('qa环境构建并压缩完成');
    //        dev环境
    await runBuild('npm run build:dev', 'dist', 'DEV');
    console.log('dev环境构建并压缩完成');

    // 第二步：构建生产环境并压缩
    await runBuild('npm run build:prod', 'dist', 'PR');
    console.log('生产环境构建并压缩完成');
  } catch (error) {
    console.error('脚本执行出错:', error);
    process.exitCode = 1;
  }
})();
