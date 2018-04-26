const gulp = require('gulp');
const clean = require('gulp-clean');
const {createProject} = require('gulp-typescript');
const jest = require('gulp-jest').default;

gulp.task('build', function() {
  let failed = false;
  const tsProject = createProject('tsconfig.json');
  return gulp.src([
    'src/**/*.ts',
    '!**/__tests__/**'
  ], {nodir: true})
  .pipe(tsProject())
  .on('error', () => failed = true)
  .on('finish', () => failed && process.exit(1))
  .pipe(gulp.dest('lib'));
});

gulp.task('copy-config', function() {
  return gulp.src([
    'package.json',
    'README.md',
    'LICENSE'
  ]).pipe(gulp.dest('lib'));
})

gulp.task('test', function() {
  return gulp.src('src/**/__tests__/**/*.ts')
    .pipe(jest());
});

gulp.task('clean', () => {
  return gulp.src('lib', {read: false})
  .pipe(clean());
})

gulp.task('default',['build', 'test', 'copy-config']);
