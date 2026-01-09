module.exports = {
  apps: [
    {
      name: 'monitoreo-backend',
      cwd: './apps/backend',
      script: 'npm',
      args: 'run start:prod',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'monitoreo-frontend',
      cwd: './apps/frontend',
      script: 'npm',
      args: 'run dev',
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
