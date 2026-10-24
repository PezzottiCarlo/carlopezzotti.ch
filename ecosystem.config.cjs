// Il processo pm2 del server, nel pm2 di sgablo.
//   pm2 start ecosystem.config.cjs && pm2 save
// --deploy: segue GitHub (webhook su /_deploy e controllo all'avvio). Quando cambia il codice
// del server il processo esce e pm2 lo riavvia, quindi qui non serve "watch".
module.exports = {
  apps: [{
    name: 'carlopezzotti',
    script: 'server/main.mjs',
    args: '--deploy',
    cwd: __dirname,
    max_memory_restart: '300M'
  }]
};
