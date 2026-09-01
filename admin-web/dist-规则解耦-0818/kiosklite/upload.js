import('./scripts/deploy.mjs')
  .then(({ deployFromCli }) => deployFromCli())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
