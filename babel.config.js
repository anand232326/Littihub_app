module.exports = function (api) {
  api.cache(true);
  const babelPresetExpo = require.resolve('babel-preset-expo', {
    paths: [require.resolve('expo/package.json')],
  });
  return {
    presets: [
      [babelPresetExpo, { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
