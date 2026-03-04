module.exports = {
  apps: [
    {
      name: 'millerstorm',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/millerstorm',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 6789
      },
      error_file: '/var/www/millerstorm/logs/err.log',
      out_file: '/var/www/millerstorm/logs/out.log',
      log_file: '/var/www/millerstorm/logs/combined.log',
      time: true
    }
  ]
};
