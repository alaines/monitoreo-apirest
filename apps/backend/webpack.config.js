module.exports = (options, webpack) => {
  return {
    ...options,
    externals: {
      '@nestjs/microservices': 'commonjs @nestjs/microservices',
      '@nestjs/websockets/socket-module': 'commonjs @nestjs/websockets/socket-module',
    },
  };
};
