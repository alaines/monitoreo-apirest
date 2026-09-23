module.exports = (options, webpack) => {
  return {
    ...options,
    externals: {
      '@prisma/client': 'commonjs @prisma/client',
      '.prisma/client': 'commonjs .prisma/client',
      '@nestjs/microservices': 'commonjs @nestjs/microservices',
      '@nestjs/websockets/socket-module': 'commonjs @nestjs/websockets/socket-module',
    },
  };
};

