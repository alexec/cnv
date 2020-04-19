const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BaseHrefWebpackPlugin } = require("base-href-webpack-plugin");
const path = require("path");
module.exports = (env, argv) => ({
  entry: path.resolve(__dirname, "src", "index.jsx"),
  devServer: {
    contentBase: path.join(__dirname, "dist")
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".js", ".jsx"]
  },
  module: {
    rules: [
      {
        test: /\.jsx/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  plugins: [
    new CopyPlugin([{ from: "src/assets", to: "assets" }]),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
    }),
    new BaseHrefWebpackPlugin({
      baseHref: argv.mode === "development" ? "/" : "https://alexec.github.io/cnv/"
    })
  ]
});
