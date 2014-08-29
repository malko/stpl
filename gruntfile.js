module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/* (c) Jonathan Gotti - licence: https://github.com/malko/stpl/LICENCE.txt */\n'
      },
      build: {
        src: 'lib/stpl.js',
        dest: 'lib/stpl.min.js'
      }
    },
    qunit: {
      all: ['tests/*.html']
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');

  // Default task(s).
  grunt.registerTask('default', ['uglify','qunit']);

};
