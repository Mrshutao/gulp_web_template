const { src, dest, parallel, series, watch, registry } = require("gulp");
const del = require("del");
const browserSync = require("browser-sync");
// const proxyMiddleware = require("http-proxy-middleware");

const loadPlugins = require("gulp-load-plugins");
const plugins = loadPlugins();
const bs = browserSync.create();

const clean = () => del(["dist", "temp"]);

const style = () => {
  return src(["src/assets/styles/*.scss", "src/assets/styles/*.css"], {
    base: "src",
  })
    .pipe(
      plugins.sass({
        outputStyle: "expanded",
      })
    )
    .pipe(dest("temp"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
};

const script = () => {
  console.log(registry);
  return src("src/assets/scripts/*.js", {
    base: "src",
  })
    .pipe(
      plugins.babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(dest("temp"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
};

const page = () => {
  return src("src/**/*.html", {
    base: "src",
  })
    .pipe(
      plugins.swig({
        defaults: {
          cache: false,
        },
      })
    )
    .pipe(dest("temp"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
};

const image = () => {
  return src("src/assets/images/**", {
    base: "src",
  }).pipe(dest("dist"));
};

const font = () => {
  return src("src/assets/fonts/**", {
    base: "src",
  }).pipe(dest("dist"));
};

const extra = () => {
  return src("public/**", {
    base: "public",
  }).pipe(dest("dist"));
};

// const middleware = proxyMiddleware.createProxyMiddleware("/api", {
//   target: "http://114.67.205.23:50005",
//   changeOrigin: true,
//   pathRewrite: {
//     "^/api": "",
//   },
//   logLevel: "debug",
// });

const serve = () => {
  watch("src/assets/styles/*.scss", style);
  watch("src/assets/scripts/*.js", script);
  watch("src/**/*.html", page);
  watch(
    ["src/assets/images/**", "src/assets/fonts/**", "public/**"],
    bs.reload
  );
  bs.init({
    notify: false,
    server: {
      baseDir: ["temp", "src", "public"],
      routes: {
        "/node_modules": "node_modules",
      },
    },
  });
};

const useref = () => {
  return src("temp/*.html", {
    base: "temp",
  })
    .pipe(
      plugins.useref({
        searchPath: ["temp", "."],
      })
    )
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(
      plugins.if(
        /\.html$/,
        plugins.htmlmin({
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true,
        })
      )
    )
    .pipe(plugins.if(/\.(js|css)$/, plugins.rev()))
    .pipe(plugins.revReplace())
    .pipe(dest("dist"));
};

const compile = parallel(style, script, page);
const build = series(
  clean,
  parallel(series(compile, useref), extra, image, font)
);

const develop = series(compile, serve);

module.exports = {
  clean,
  build,
  develop,
};
