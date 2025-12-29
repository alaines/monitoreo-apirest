module.exports = (options, webpack) => {
  return {
    ...options,
    externals: {
      'bcrypt': 'commonjs bcrypt',
      '@nestjs/microservices': 'commonjs @nestjs/microservices',
      '@nestjs/websockets/socket-module': 'commonjs @nestjs/websockets/socket-module',
    },
  };
};
