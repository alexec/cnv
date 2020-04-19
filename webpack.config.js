const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BaseHrefWebpackPlugin } = require("base-href-webpack-plugin");
const path = require("path");
module.exports = {
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
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
    }),
    new BaseHrefWebpackPlugin({
      baseHref: process.env.NODE_ENV === "development" ? "/" : "https://alexec.github.io/cnv/"
    })
  ]
};
