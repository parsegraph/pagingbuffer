const {webpackConfig, relDir} = require("./webpack.common");

module.exports = {
  entry: {
    index: relDir("src/index.ts"),
    doc: relDir("src/doc.ts"),
    demo: relDir("src/demo.ts"),
  },
  ...webpackConfig(false),
};
